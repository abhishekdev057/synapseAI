/**
 * Cognitive decline detection.
 *
 * Reads a time series of rolled-up domain scores (0–100) and decides whether
 * the patient is stable, improving, or in a sustained decline that a caregiver
 * or clinician should look at. Two independent signals must agree before we
 * raise a flag, to keep false alarms low:
 *
 *   1. Trend slope   — ordinary least-squares regression of score against
 *                      time, expressed as points-per-week.
 *   2. Level shift    — drop between the mean of the first third of the
 *                      window and the mean of the last third (a simple,
 *                      explainable stand-in for a CUSUM change-point).
 *
 * The output includes a plain-language summary that the dashboards show
 * verbatim to caregivers.
 */

export interface ScorePoint {
  recordedAt: Date | string;
  score: number;
}

export type TrendStatus = "stable" | "declining" | "improving";
export type Severity = "info" | "warning" | "critical";

export interface DeclineResult {
  status: TrendStatus;
  /** Regression slope in score-points per week (negative = worsening). */
  slopePerWeek: number;
  /** Mean(last third) − Mean(first third), in points. */
  levelShift: number;
  severity: Severity;
  /** Caregiver-facing sentence. */
  summary: string;
  /** Number of points the decision used. */
  points: number;
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

// Thresholds — deliberately conservative.
const SLOPE_FLAG = -2; // points/week or worse
const SHIFT_FLAG = -8; // points drop, first third -> last third
const SHIFT_CRITICAL = -15;

function toTime(d: Date | string): number {
  return typeof d === "string" ? Date.parse(d) : d.getTime();
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

/** OLS slope of y over x, in y-units per x-unit. */
function slope(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

export function detectDecline(
  series: ScorePoint[],
  domainLabel = "cognitive",
): DeclineResult {
  const clean = [...series]
    .filter((p) => Number.isFinite(p.score))
    .sort((a, b) => toTime(a.recordedAt) - toTime(b.recordedAt));

  if (clean.length < 4) {
    return {
      status: "stable",
      slopePerWeek: 0,
      levelShift: 0,
      severity: "info",
      summary: `Not enough ${domainLabel} data yet to assess a trend.`,
      points: clean.length,
    };
  }

  const t0 = toTime(clean[0].recordedAt);
  const xsWeeks = clean.map((p) => (toTime(p.recordedAt) - t0) / MS_PER_WEEK);
  const ys = clean.map((p) => p.score);

  const slopePerWeek = Number(slope(xsWeeks, ys).toFixed(2));

  const third = Math.max(1, Math.floor(clean.length / 3));
  const firstMean = mean(ys.slice(0, third));
  const lastMean = mean(ys.slice(-third));
  const levelShift = Number((lastMean - firstMean).toFixed(1));

  const spanWeeks = Math.max(1, Math.round(xsWeeks[xsWeeks.length - 1]));

  let status: TrendStatus = "stable";
  let severity: Severity = "info";
  let summary = `${cap(domainLabel)} scores are stable over the last ${spanWeeks} week(s).`;

  const declining = slopePerWeek <= SLOPE_FLAG && levelShift <= SHIFT_FLAG;
  const improving = slopePerWeek >= 2 && levelShift >= 8;

  if (declining) {
    status = "declining";
    severity = levelShift <= SHIFT_CRITICAL ? "critical" : "warning";
    summary =
      `${cap(domainLabel)} scores have declined steadily over the last ${spanWeeks} week(s) ` +
      `(down ${Math.abs(levelShift)} points, about ${Math.abs(slopePerWeek)} points/week). ` +
      `Consider a clinical review.`;
  } else if (improving) {
    status = "improving";
    severity = "info";
    summary =
      `${cap(domainLabel)} scores have improved over the last ${spanWeeks} week(s) ` +
      `(up ${Math.abs(levelShift)} points). Keep the current routine.`;
  }

  return {
    status,
    slopePerWeek,
    levelShift,
    severity,
    summary,
    points: clean.length,
  };
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
