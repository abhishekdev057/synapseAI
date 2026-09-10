import { WordGarden } from "@/components/patient/games/WordGarden";
import { ClientOnly } from "@/components/patient/games/ClientOnly";
import { GameLoading } from "@/components/patient/games/GameShell";
import { resolvePatientId } from "@/lib/demo";
import { getPatient, recommendDifficulty } from "@/lib/queries";
import { resolvePatientLang } from "@/lib/patient-lang";

export const dynamic = "force-dynamic";

export default async function WordGardenPage({
  searchParams,
}: PageProps<"/patient/games/word-garden">) {
  const sp = await searchParams;
  const patientId = await resolvePatientId(sp);
  const patient = patientId ? await getPatient(patientId) : null;
  if (!patient) return <p className="text-lg">No patient found.</p>;

  const { dict: t, speechTag } = await resolvePatientLang(patient.language);
  const decision = await recommendDifficulty(patient.id, "word_garden");

  return (
    <ClientOnly fallback={<GameLoading title={t.titleWordGarden} />}>
      <WordGarden
        patientId={patient.id}
        patientName={patient.name.split(" ")[0]}
        speechTag={speechTag}
        dict={t}
        initialDifficulty={decision.next}
        initialReason={decision.reason}
      />
    </ClientOnly>
  );
}
