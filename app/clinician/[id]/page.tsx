import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertRow } from "@/components/dashboard/AlertRow";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { Badge, Card, SectionTitle, Stat, StatusDot } from "@/components/ui";
import {
  getAdherence,
  getDomainTrends,
  getEngagement,
  getPatient,
  listAlerts,
} from "@/lib/queries";
import { buildReferralSummary } from "@/lib/referral";
import { fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const declineTone = {
  declining: "red",
  improving: "green",
  stable: "neutral",
} as const;

export default async function ClinicianPatient({
  params,
}: PageProps<"/clinician/[id]">) {
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();

  const [trends, alerts, adherence, engagement] = await Promise.all([
    getDomainTrends(id),
    listAlerts(id),
    getAdherence(id),
    getEngagement(id),
  ]);

  const declining = trends.filter((t) => t.decline.status === "declining");
  const status: "green" | "amber" | "red" =
    alerts.some((a) => a.status === "open" && a.severity === "critical") ||
    declining.some((d) => d.decline.severity === "critical")
      ? "red"
      : alerts.some((a) => a.status === "open") || declining.length
        ? "amber"
        : "green";

  const referral = buildReferralSummary({
    name: patient.name,
    ageYears: patient.ageYears,
    sex: patient.sex,
    region: patient.region,
    cognitiveStage: patient.cognitiveStage,
    baseline: patient.baseline
      ? {
          totalScore: patient.baseline.totalScore,
          maxScore: patient.baseline.maxScore,
          assessedAt: patient.baseline.assessedAt,
        }
      : null,
    trends,
    adherenceRate: adherence.rate,
    engagementLast7: engagement.last7,
  });

  return (
    <div className="space-y-8">
      <div>
        <Link href="/clinician" className="text-sm text-primary hover:underline">
          ← All patients
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <StatusDot status={status} className="h-4 w-4" />
          <h1 className="text-2xl font-bold">{patient.name}</h1>
        </div>
        <p className="text-sm text-muted">
          {patient.ageYears ? `${patient.ageYears} yrs · ` : ""}
          {patient.sex ? `${patient.sex} · ` : ""}
          {patient.region ?? "—"} · stage {patient.cognitiveStage} · primary:{" "}
          {patient.clinician?.name ?? "—"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Games · 7d" value={engagement.last7} />
        <Stat label="Games · 30d" value={engagement.last30} />
        <Stat
          label="Adherence · 14d"
          value={adherence.rate == null ? "—" : `${adherence.rate}%`}
        />
        <Stat
          label="Declining domains"
          value={declining.length}
          sub={declining.map((d) => d.label).join(", ") || "none"}
        />
      </div>

      <Card>
        <SectionTitle hint="Auto-generated from the trend + adherence data. Editable before sharing in the real app.">
          Referral summary
        </SectionTitle>
        <pre className="whitespace-pre-wrap rounded-lg bg-background p-4 text-sm">
          {referral}
        </pre>
      </Card>

      <div>
        <SectionTitle hint="Rolled-up 0–100 score per cognitive domain. Dashed line = 60 (support threshold).">
          Cognitive trends
        </SectionTitle>
        <div className="grid gap-4 md:grid-cols-2">
          {trends.map((t) => (
            <Card key={t.domain}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">{t.label}</span>
                <Badge tone={declineTone[t.decline.status]}>
                  {t.decline.status}
                </Badge>
              </div>
              <TrendChart
                data={t.series}
                color={
                  t.decline.status === "declining"
                    ? "#cf4b3f"
                    : t.decline.status === "improving"
                      ? "#2f9e6b"
                      : "#0f766e"
                }
              />
              <p className="mt-2 text-xs text-muted">{t.decline.summary}</p>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <SectionTitle>Alerts</SectionTitle>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted">No alerts.</p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <AlertRow
                key={a.id}
                by={patient.clinician?.name ?? "Clinician"}
                alert={{ ...a, createdAt: a.createdAt as unknown as string }}
              />
            ))}
          </ul>
        )}
      </Card>

      <p className="text-xs text-muted">Last updated {fmtDate(new Date())}.</p>
    </div>
  );
}
