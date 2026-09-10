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
    <div className="sy-fade-rise space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-navy">{t.whoIsThis}</h1>
        <p className="mt-1 text-lg text-muted">{t.yourFamilyIntro}</p>
      </div>

      <ul className="sy-stagger grid grid-cols-2 gap-4">
        {contacts.map((c) => (
          <li
            key={c.id}
            className="sy-card flex flex-col items-center p-5 text-center"
          >
            <div className="sy-medallion flex h-28 w-28 items-center justify-center overflow-hidden text-4xl font-bold text-primary">
              {c.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.photoUrl}
                  alt={c.name}
                  className="h-28 w-28 rounded-full object-cover"
                />
              ) : (
                <span aria-hidden>{c.name.charAt(0)}</span>
              )}
            </div>
            <p className="mt-4 text-2xl font-bold text-navy">{c.name}</p>
            <p className="text-lg text-muted">{c.relationship}</p>
            {c.notes ? <p className="mt-1 text-sm text-muted">{c.notes}</p> : null}
            <div className="mt-4">
              <SpeakButton
                text={fmt(t.thisIsPerson, {
                  name: c.name,
                  relationship: c.relationship,
                  notes: c.notes ?? "",
                })}
                lang={speechTag}
                label={t.hear}
                className="sy-press inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium"
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
