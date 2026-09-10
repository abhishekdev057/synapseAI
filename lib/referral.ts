import type { DomainTrend } from "@/lib/queries";

interface ReferralInput {
  name: string;
  ageYears: number | null;
  sex: string | null;
  region: string | null;
  cognitiveStage: string;
  baseline: { totalScore: number; maxScore: number; assessedAt: Date | string } | null;
  trends: DomainTrend[];
  adherenceRate: number | null;
  engagementLast7: number;
}

/** Compose a plain-text referral summary a clinician can hand to a specialist. */
export function buildReferralSummary(i: ReferralInput): string {
  const lines: string[] = [];
  lines.push(
    `Patient: ${i.name}, ${i.ageYears ?? "?"}y ${i.sex ?? ""}, ${i.region ?? "NER"}.`,
  );
  lines.push(`Recorded dementia stage: ${i.cognitiveStage}.`);
  if (i.baseline) {
    lines.push(
      `Baseline in-app screen: ${i.baseline.totalScore}/${i.baseline.maxScore} ` +
        `(${new Date(i.baseline.assessedAt).toLocaleDateString("en-IN")}). Not diagnostic.`,
    );
  }

  const declining = i.trends.filter((t) => t.decline.status === "declining");
  const improving = i.trends.filter((t) => t.decline.status === "improving");

  if (declining.length) {
    lines.push(
      `Cognitive domains showing sustained decline: ` +
        declining
          .map(
            (t) =>
              `${t.label} (${t.decline.levelShift} pts, ${t.decline.slopePerWeek}/wk)`,
          )
          .join("; ") +
        `.`,
    );
  } else {
    lines.push(`No domain currently meets the decline threshold.`);
  }
  if (improving.length) {
    lines.push(
      `Improving: ${improving.map((t) => t.label).join(", ")}.`,
    );
  }

  lines.push(
    `Engagement: ${i.engagementLast7} game rounds in the last 7 days. ` +
      `Reminder adherence (14d): ${i.adherenceRate == null ? "n/a" : i.adherenceRate + "%"}.`,
  );

  if (declining.some((t) => t.decline.severity === "critical")) {
    lines.push(
      `Recommendation: prioritise clinical review — at least one domain has ` +
        `dropped >15 points over the window.`,
    );
  } else if (declining.length) {
    lines.push(`Recommendation: schedule a review at the next available slot.`);
  } else {
    lines.push(`Recommendation: continue current routine; re-assess in 4 weeks.`);
  }

  return lines.join("\n");
}
