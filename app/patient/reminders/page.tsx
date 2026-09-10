import { ReminderList } from "@/components/patient/ReminderList";
import { resolvePatientId } from "@/lib/demo";
import { getPatient, getTodayReminders } from "@/lib/queries";
import { langTag } from "@/lib/languages";

export const dynamic = "force-dynamic";

export default async function PatientReminders({
  searchParams,
}: PageProps<"/patient/reminders">) {
  const sp = await searchParams;
  const patientId = await resolvePatientId(sp);
  const patient = patientId ? await getPatient(patientId) : null;
  if (!patient) return <p className="text-lg">No patient found.</p>;

  const occurrences = await getTodayReminders(patient.id);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Today&apos;s reminders</h1>
      <ReminderList
        patientId={patient.id}
        speechTag={langTag(patient.language)}
        initial={occurrences}
      />
    </div>
  );
}
