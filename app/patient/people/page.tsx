import { SpeakButton } from "@/components/patient/SpeakButton";
import { resolvePatientId } from "@/lib/demo";
import { getPatient, listContacts } from "@/lib/queries";
import { langTag } from "@/lib/languages";

export const dynamic = "force-dynamic";

export default async function PeoplePage({
  searchParams,
}: PageProps<"/patient/people">) {
  const sp = await searchParams;
  const patientId = await resolvePatientId(sp);
  const patient = patientId ? await getPatient(patientId) : null;
  if (!patient) return <p className="text-lg">No patient found.</p>;

  const contacts = await listContacts(patient.id);
  const tag = langTag(patient.language);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Who is this?</h1>
      <p className="text-lg text-muted">Your family and the people close to you.</p>

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
                text={`This is ${c.name}, your ${c.relationship}. ${c.notes ?? ""}`}
                lang={tag}
                label="Hear"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm"
              />
            </div>
          </li>
        ))}
      </ul>

      {contacts.length === 0 && (
        <p className="text-lg text-muted">
          No family added yet. A caregiver can add them from the family dashboard.
        </p>
      )}
    </div>
  );
}
