import { AddContactForm } from "@/components/dashboard/AddContactForm";
import { AddReminderForm } from "@/components/dashboard/AddReminderForm";
import { AlertRow } from "@/components/dashboard/AlertRow";
import { PatientTabs } from "@/components/dashboard/PatientTabs";
import { Card, SectionTitle, Stat } from "@/components/ui";
import { allPatientsBrief, resolvePatientId } from "@/lib/demo";
import {
  getAdherence,
  getDomainTrends,
  getEngagement,
  getPatient,
  listAlerts,
  listContacts,
  listReminders,
} from "@/lib/queries";
import { fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CaregiverDashboard({
  searchParams,
}: PageProps<"/caregiver">) {
  const sp = await searchParams;
  const patientId = await resolvePatientId(sp);
  const patients = await allPatientsBrief();
  const patient = patientId ? await getPatient(patientId) : null;

  if (!patient) {
    return <p>No patient found. Run <code>npm run db:seed</code>.</p>;
  }

  const [trends, adherence, engagement, alerts, reminders, contacts] =
    await Promise.all([
      getDomainTrends(patient.id),
      getAdherence(patient.id),
      getEngagement(patient.id),
      listAlerts(patient.id),
      listReminders(patient.id),
      listContacts(patient.id),
    ]);

  const openAlerts = alerts.filter((a) => a.status === "open");
  const declining = trends.filter((t) => t.decline.status === "declining");
  const caregiverName = patient.caregivers[0]?.name ?? "Caregiver";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{patient.name}</h1>
        <p className="text-sm text-muted">
          {patient.ageYears ? `${patient.ageYears} yrs · ` : ""}
          {patient.region ?? "—"} · stage: {patient.cognitiveStage}
        </p>
        <div className="mt-3">
          <PatientTabs base="/caregiver" patients={patients} activeId={patient.id} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Games · last 7 days" value={engagement.last7} sub="target 10–14" />
        <Stat
          label="Reminder adherence · 14d"
          value={adherence.rate == null ? "—" : `${adherence.rate}%`}
          sub={`${adherence.done}/${adherence.total} confirmed`}
        />
        <Stat label="Open alerts" value={openAlerts.length} />
        <Stat
          label="Last played"
          value={engagement.lastPlayed ? fmtDate(engagement.lastPlayed) : "—"}
        />
      </div>

      <Card>
        <SectionTitle hint="Plain-language read of the last ~3 weeks of scores.">
          How {patient.name.split(" ")[0]} is doing
        </SectionTitle>
        <ul className="space-y-2 text-sm">
          {trends.map((t) => (
            <li key={t.domain} className="flex items-start gap-2">
              <span
                className={`mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
                  t.decline.status === "declining"
                    ? "bg-status-red"
                    : t.decline.status === "improving"
                      ? "bg-status-green"
                      : "bg-border"
                }`}
              />
              <span>
                <strong>{t.label}:</strong> {t.decline.summary}
              </span>
            </li>
          ))}
        </ul>
        {declining.length > 0 && (
          <p className="mt-3 rounded-lg bg-status-red/10 p-3 text-sm text-[color:var(--red)]">
            {declining.length} area(s) declining — the doctor has been notified via
            an alert.
          </p>
        )}
      </Card>

      <Card>
        <SectionTitle>Alerts</SectionTitle>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted">No alerts.</p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <AlertRow
                key={a.id}
                by={caregiverName}
                alert={{ ...a, createdAt: a.createdAt as unknown as string }}
              />
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <SectionTitle hint="Spoken on the patient's device at these times.">
            Reminders
          </SectionTitle>
          <ul className="mb-3 space-y-2 text-sm">
            {reminders.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
              >
                <span>
                  <span className="font-medium">{r.title}</span>
                  <span className="text-muted"> · {r.kind}</span>
                </span>
                <span className="text-muted">{r.timesOfDay.join(", ")}</span>
              </li>
            ))}
          </ul>
          <AddReminderForm patientId={patient.id} />
        </Card>

        <Card>
          <SectionTitle hint='Shown in the patient app under "Who is this?"'>
            Family contacts
          </SectionTitle>
          <ul className="mb-3 space-y-2 text-sm">
            {contacts.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-border px-3 py-2"
              >
                <span className="font-medium">{c.name}</span>
                <span className="text-muted"> · {c.relationship}</span>
                {c.notes ? (
                  <p className="text-xs text-muted">{c.notes}</p>
                ) : null}
              </li>
            ))}
          </ul>
          <AddContactForm patientId={patient.id} />
        </Card>
      </div>
    </div>
  );
}
