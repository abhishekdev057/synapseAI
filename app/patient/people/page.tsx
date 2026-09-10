import { SpeakButton } from "@/components/patient/SpeakButton";
import { resolvePatientId } from "@/lib/demo";
import { getPatient, listContacts } from "@/lib/queries";
import { fmt } from "@/lib/i18n";
import { resolvePatientLang } from "@/lib/patient-lang";

export const dynamic = "force-dynamic";

export default async function PeoplePage({
  searchParams,
}: PageProps<"/patient/people">) {
  const sp = await searchParams;
  const patientId = await resolvePatientId(sp);
  const patient = patientId ? await getPatient(patientId) : null;
  if (!patient) return <p className="text-lg">No patient found.</p>;

  const { dict: t, speechTag } = await resolvePatientLang(patient.language);
  const contacts = await listContacts(patient.id);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t.whoIsThis}</h1>
      <p className="text-lg text-muted">{t.yourFamilyIntro}</p>

      <ul className="grid grid-cols-2 gap-4">
        {contacts.map((c) => (
          <li
            key={c.id}
            className="flex flex-col items-center rounded-2xl border border-border bg-surface p-5 text-center"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-4xl">
              {c.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.photoUrl}
                  alt={c.name}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <span aria-hidden>{c.name.charAt(0)}</span>
              )}
            </div>
            <p className="mt-3 text-2xl font-semibold">{c.name}</p>
            <p className="text-lg text-muted">{c.relationship}</p>
            {c.notes ? <p className="mt-1 text-sm text-muted">{c.notes}</p> : null}
            <div className="mt-3">
              <SpeakButton
                text={fmt(t.thisIsPerson, {
                  name: c.name,
                  relationship: c.relationship,
                  notes: c.notes ?? "",
                })}
                lang={speechTag}
                label={t.hear}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm"
              />
            </div>
          </li>
        ))}
      </ul>

      {contacts.length === 0 && (
        <p className="text-lg text-muted">{t.noFamilyYet}</p>
      )}
    </div>
  );
}
