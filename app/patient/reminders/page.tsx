import { ReminderList } from "@/components/patient/ReminderList";
import { resolvePatientId } from "@/lib/demo";
import { getPatient, getTodayReminders } from "@/lib/queries";
import { resolvePatientLang } from "@/lib/patient-lang";

export const dynamic = "force-dynamic";

export default async function PatientReminders({
  searchParams,
}: PageProps<"/patient/reminders">) {
  const sp = await searchParams;
  const patientId = await resolvePatientId(sp);
  const patient = patientId ? await getPatient(patientId) : null;
  if (!patient) return <p className="text-lg">No patient found.</p>;

  const { dict: t, speechTag } = await resolvePatientLang(patient.language);
  const occurrences = await getTodayReminders(patient.id);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t.todaysReminders}</h1>
      <ReminderList
        patientId={patient.id}
        speechTag={speechTag}
        dict={t}
        initial={occurrences}
      />
    </div>
  );
}
