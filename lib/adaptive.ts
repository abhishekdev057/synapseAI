/**
 * Dynamic Difficulty Adjustment (DDA).
 *
 * Goal: keep the patient in the "flow zone" — challenged but succeeding —
 * which the cognitive-training literature places around 75–85% accuracy.
 * The engine is a small deterministic control loop: no training data, no
 * network, runs on the patient's device.
 *
 * Inputs are the patient's recent rounds of ONE game. Output is the
 * difficulty level (1 easiest … 10 hardest) for the next round, plus a
 * human-readable reason (shown to caregivers/clinicians, never the patient).
 */

export const DIFFICULTY_MIN = 1;
export const DIFFICULTY_MAX = 10;

/** Flow-zone accuracy band we steer toward. */
export const FLOW_LOW = 0.75;
export const FLOW_HIGH = 0.85;

export type Stage = "mild" | "moderate" | "severe";

export interface RoundResult {
  /** Fraction correct, 0..1. */
  accuracy: number;
  /** Difficulty the round was played at. */
  difficulty: number;
  /** Hints the patient needed. */
  hintsUsed?: number;
  /** Mean response latency, ms (optional). */
  reactionTimeMs?: number;
  /** When it was played — newer rounds weigh more. */
  playedAt?: Date | string;
}

export interface AdaptiveDecision {
  next: number;
  reason: string;
  /** Hint-penalised accuracy the decision was based on. */
  effectiveAccuracy: number;
}

/** Starting difficulty for a patient with no history, by baseline stage. */
export function startingDifficulty(stage: Stage): number {
  switch (stage) {
    case "severe":
      return 1;
    case "moderate":
      return 2;
    case "mild":
    default:
      return 3;
  }
}

function clamp(n: number, lo = DIFFICULTY_MIN, hi = DIFFICULTY_MAX): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Penalise accuracy for heavy hint use: each hint shaves a little off, so a
 * "90% with lots of hints" round is not treated as mastery.
 */
function effectiveAccuracy(r: RoundResult): number {
  const hintPenalty = Math.min(0.25, (r.hintsUsed ?? 0) * 0.05);
  return Math.max(0, Math.min(1, r.accuracy - hintPenalty));
}

/**
 * Decide the next difficulty from up to the last few rounds.
 * Recent rounds are weighted more heavily (recency weighting 3, 2, 1 …).
 */
export function nextDifficulty(
  recentRounds: RoundResult[],
  opts: { stage?: Stage; window?: number } = {},
): AdaptiveDecision {
  const stage = opts.stage ?? "mild";
  const windowSize = opts.window ?? 3;

  if (recentRounds.length === 0) {
    const next = startingDifficulty(stage);
    return {
      next,
      reason: `No history yet — starting at level ${next} for a ${stage} baseline.`,
      effectiveAccuracy: 0,
    };
  }

  // Newest first, take the window.
  const sorted = [...recentRounds].sort(
    (a, b) => toTime(b.playedAt) - toTime(a.playedAt),
  );
  const window = sorted.slice(0, windowSize);

  let weightSum = 0;
  let accSum = 0;
  window.forEach((r, i) => {
    const w = window.length - i; // 3,2,1
    weightSum += w;
    accSum += w * effectiveAccuracy(r);
  });
  const eff = accSum / weightSum;

  // Anchor on the difficulty of the most recent round actually played.
  const current = window[0].difficulty ?? startingDifficulty(stage);

  let next = current;
  let reason: string;

  if (eff >= 0.95) {
    next = clamp(current + 2);
    reason = `Effective accuracy ${(eff * 100).toFixed(0)}% — well above the flow zone; stepping up two levels to ${next}.`;
  } else if (eff > FLOW_HIGH) {
    next = clamp(current + 1);
    reason = `Effective accuracy ${(eff * 100).toFixed(0)}% — above the 75–85% flow zone; stepping up to level ${next}.`;
  } else if (eff < 0.5) {
    next = clamp(current - 2);
    reason = `Effective accuracy ${(eff * 100).toFixed(0)}% — struggling; easing down two levels to ${next}.`;
  } else if (eff < FLOW_LOW) {
    next = clamp(current - 1);
    reason = `Effective accuracy ${(eff * 100).toFixed(0)}% — below the flow zone; easing down to level ${next}.`;
  } else {
    next = current;
    reason = `Effective accuracy ${(eff * 100).toFixed(0)}% — inside the 75–85% flow zone; holding at level ${next}.`;
  }

  return { next, reason, effectiveAccuracy: Number(eff.toFixed(3)) };
}

function toTime(d?: Date | string): number {
  if (!d) return 0;
  return typeof d === "string" ? Date.parse(d) : d.getTime();
}

/**
 * Convert a round's raw result into a friendly 0–100 score.
 * Never shown to the patient — used for caregiver/clinician trends only.
 */
export function roundScore(r: RoundResult): number {
  const base = effectiveAccuracy(r) * 100;
  // Small bonus for playing at a higher level.
  const levelBonus = ((r.difficulty ?? 1) - 1) * 1.5;
  return Math.round(clamp(base + levelBonus, 0, 100));
}
