import Link from "next/link";
import { Brain, Pill, Users } from "lucide-react";
import { ApkDownload } from "@/components/ApkDownload";
import { Clock } from "@/components/patient/Clock";
import { SpeakButton } from "@/components/patient/SpeakButton";
import { resolvePatientId } from "@/lib/demo";
import { getPatient, getTodayReminders } from "@/lib/queries";
import { langTag } from "@/lib/languages";
import { fmtTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/patient/games", icon: Brain, label: "Play a game", tone: "bg-primary text-primary-fg" },
  { href: "/patient/reminders", icon: Pill, label: "My reminders", tone: "bg-surface border border-border" },
  { href: "/patient/people", icon: Users, label: "Who is this?", tone: "bg-surface border border-border" },
];

export default async function PatientHome({
  searchParams,
}: PageProps<"/patient">) {
  const sp = await searchParams;
  const patientId = await resolvePatientId(sp);
  const patient = patientId ? await getPatient(patientId) : null;

  if (!patient) {
    return (
      <p className="text-lg">
        No patient found. Run <code>npm run db:seed</code> first.
      </p>
    );
  }

  const occurrences = await getTodayReminders(patient.id);
  const next = occurrences.find((o) => o.status === "pending");
  const spokenLine = next
    ? `Hello ${patient.name}. Your next task is ${next.title} at ${fmtTime(next.scheduledFor)}.`
    : `Hello ${patient.name}. There are no more reminders today.`;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-surface p-6">
        <Clock />
        <div className="mt-5 flex justify-center">
          <SpeakButton text={spokenLine} lang={langTag(patient.language)} label="Read this to me" />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-xl font-semibold">Next</h2>
        {next ? (
          <div className="mt-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-2xl">{next.title}</p>
              <p className="text-lg text-muted">at {fmtTime(next.scheduledFor)}</p>
            </div>
            <Link
              href="/patient/reminders"
              className="rounded-xl bg-primary px-6 py-4 text-lg font-semibold text-primary-fg"
            >
              Open
            </Link>
          </div>
        ) : (
          <p className="mt-3 text-xl text-muted">Nothing more to do today. Well done.</p>
        )}
      </section>

      <nav className="grid gap-4">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`flex items-center gap-4 rounded-2xl px-6 py-6 text-2xl font-semibold ${n.tone}`}
          >
            <n.icon className="h-9 w-9" strokeWidth={1.75} />
            {n.label}
          </Link>
        ))}
      </nav>

      <p className="text-center text-base text-muted">
        If you feel lost, press and hold the Home button to call your family.
      </p>

      <ApkDownload />
    </div>
  );
}
