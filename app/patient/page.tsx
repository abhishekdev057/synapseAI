import Link from "next/link";
import { Brain, HeartHandshake, Pill, Users } from "lucide-react";
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
    {
      href: "/patient/games",
      icon: Brain,
      label: t.playAGame,
      tint: "bg-tint-peach",
    },
    {
      href: "/patient/reminders",
      icon: Pill,
      label: t.myReminders,
      tint: "bg-tint-mint",
    },
    {
      href: "/patient/people",
      icon: Users,
      label: t.whoIsThis,
      tint: "bg-tint-lavender",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(22,58,99,0.04),0_8px_24px_rgba(22,58,99,0.06)]">
        <Clock />
        <div className="mt-5 flex justify-center">
          <SpeakButton text={spokenLine} lang={speechTag} label={t.readThisToMe} />
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-tint-sky p-6">
        <h2 className="text-xl font-bold text-navy">{t.next}</h2>
        {next ? (
          <div className="mt-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-semibold">{next.title}</p>
              <p className="text-lg text-muted">
                {fmt(t.atTime, { time: fmtTime(next.scheduledFor) })}
              </p>
            </div>
            <Link
              href="/patient/reminders"
              className="rounded-2xl bg-primary px-7 py-4 text-lg font-bold text-primary-fg shadow-sm"
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
            className={`flex items-center gap-4 rounded-3xl border border-border ${n.tint} px-6 py-6 text-2xl font-bold text-navy`}
          >
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface shadow-sm">
              <n.icon className="h-8 w-8 text-primary" strokeWidth={2} />
            </span>
            {n.label}
          </Link>
        ))}
      </nav>

      <Link
        href="/patient/people"
        className="flex items-center justify-center gap-3 rounded-3xl bg-status-red px-6 py-6 text-2xl font-extrabold text-white shadow-sm"
      >
        <HeartHandshake className="h-9 w-9" strokeWidth={2} />
        I feel lost
      </Link>
      <p className="text-center text-base text-muted">{t.feelLost}</p>

      <ApkDownload />
    </div>
  );
}
