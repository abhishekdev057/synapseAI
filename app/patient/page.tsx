import Link from "next/link";
import { Brain, Pill, Users } from "lucide-react";
import { ApkDownload } from "@/components/ApkDownload";
import { Clock } from "@/components/patient/Clock";
import { SpeakButton } from "@/components/patient/SpeakButton";
import { resolvePatientId } from "@/lib/demo";
import { getPatient, getTodayReminders } from "@/lib/queries";
import { fmt } from "@/lib/i18n";
import { resolvePatientLang } from "@/lib/patient-lang";
import { fmtTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

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

  const { dict: t, speechTag } = await resolvePatientLang(patient.language);
  const occurrences = await getTodayReminders(patient.id);
  const next = occurrences.find((o) => o.status === "pending");
  const firstName = patient.name.split(" ")[0];
  const spokenLine = next
    ? fmt(t.greetingWithNext, {
        name: firstName,
        task: next.title,
        time: fmtTime(next.scheduledFor),
      })
    : fmt(t.greetingNoNext, { name: firstName });

  const NAV = [
    { href: "/patient/games", icon: Brain, label: t.playAGame, tone: "bg-primary text-primary-fg" },
    { href: "/patient/reminders", icon: Pill, label: t.myReminders, tone: "bg-surface border border-border" },
    { href: "/patient/people", icon: Users, label: t.whoIsThis, tone: "bg-surface border border-border" },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-surface p-6">
        <Clock />
        <div className="mt-5 flex justify-center">
          <SpeakButton text={spokenLine} lang={speechTag} label={t.readThisToMe} />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-xl font-semibold">{t.next}</h2>
        {next ? (
          <div className="mt-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-2xl">{next.title}</p>
              <p className="text-lg text-muted">
                {fmt(t.atTime, { time: fmtTime(next.scheduledFor) })}
              </p>
            </div>
            <Link
              href="/patient/reminders"
              className="rounded-xl bg-primary px-6 py-4 text-lg font-semibold text-primary-fg"
            >
              {t.open}
            </Link>
          </div>
        ) : (
          <p className="mt-3 text-xl text-muted">{t.nothingMoreToday}</p>
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

      <p className="text-center text-base text-muted">{t.feelLost}</p>

      <ApkDownload />
    </div>
  );
}
