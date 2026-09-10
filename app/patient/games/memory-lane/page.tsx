import { MemoryLane } from "@/components/patient/MemoryLane";
import { resolvePatientId } from "@/lib/demo";
import { getPatient, recommendDifficulty } from "@/lib/queries";
import { langTag } from "@/lib/languages";

export const dynamic = "force-dynamic";

export default async function MemoryLanePage({
  searchParams,
}: PageProps<"/patient/games/memory-lane">) {
  const sp = await searchParams;
  const patientId = await resolvePatientId(sp);
  const patient = patientId ? await getPatient(patientId) : null;
  if (!patient) return <p className="text-lg">No patient found.</p>;

  const decision = await recommendDifficulty(patient.id, "memory_lane");

  return (
    <MemoryLane
      patientId={patient.id}
      patientName={patient.name.split(" ")[0]}
      speechTag={langTag(patient.language)}
      initialDifficulty={decision.next}
      initialReason={decision.reason}
    />
  );
}
