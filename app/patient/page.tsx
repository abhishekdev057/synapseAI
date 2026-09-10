import Link from "next/link";
import { Brain, HeartHandshake, Pill, Users, ArrowRight } from "lucide-react";
import { ApkDownload } from "@/components/ApkDownload";
import { Clock } from "@/components/patient/Clock";
import { SpeakButton } from "@/components/patient/SpeakButton";
import { BrandOrb } from "@/components/patient/BrandOrb";
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
    <div className="sy-fade-rise space-y-6">
      {/* Warm welcome + orientation */}
      <section className="sy-card overflow-hidden">
        <div className="flex items-center gap-4 bg-gradient-to-br from-tint-sky to-tint-lavender px-6 pt-6 pb-4">
          <BrandOrb size={76} className="sy-float shrink-0" />
          <div>
            <p className="text-lg text-muted">{t.hello}</p>
            <p className="text-3xl font-extrabold text-navy">{firstName}</p>
          </div>
        </div>
        <div className="px-6 pb-6 pt-4">
          <Clock />
          <div className="mt-5 flex justify-center">
            <SpeakButton
              text={spokenLine}
              lang={speechTag}
              label={t.readThisToMe}
              className="sy-press inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-4 text-lg font-bold text-primary-fg shadow-[0_10px_30px_rgba(44,138,81,0.28)]"
            />
          </div>
        </div>
      </section>

      {/* Next task */}
      <section className="sy-card border-primary/25 bg-tint-mint p-6">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary/50" style={{ animation: "sy-ring 1.8s ease-out infinite" }} />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
          </span>
          <h2 className="text-xl font-bold text-navy">{t.next}</h2>
        </div>
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
              className="sy-press inline-flex shrink-0 items-center gap-2 rounded-2xl bg-primary px-7 py-4 text-lg font-bold text-primary-fg shadow-[0_8px_22px_rgba(44,138,81,0.25)]"
            >
              {t.open} <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        ) : (
          <p className="mt-3 text-xl text-muted">{t.nothingMoreToday}</p>
        )}
      </section>

      {/* Big navigation */}
      <nav className="sy-stagger grid gap-4">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`sy-press flex items-center gap-5 rounded-3xl border border-border ${n.tint} px-6 py-6 text-2xl font-bold text-navy shadow-[0_6px_20px_rgba(22,58,99,0.06)]`}
          >
            <span className="sy-medallion inline-flex h-16 w-16 shrink-0 items-center justify-center">
              <n.icon className="h-9 w-9 text-primary" strokeWidth={2} />
            </span>
            <span className="flex-1">{n.label}</span>
            <ArrowRight className="h-6 w-6 text-muted" />
          </Link>
        ))}
      </nav>

      {/* Help */}
      <Link
        href="/patient/people"
        className="sy-press flex items-center justify-center gap-3 rounded-3xl bg-status-red px-6 py-6 text-2xl font-extrabold text-white shadow-[0_10px_30px_rgba(223,68,54,0.3)]"
      >
        <HeartHandshake className="h-9 w-9" strokeWidth={2} />
        {t.iFeelLost}
      </Link>
      <p className="text-center text-base text-muted">{t.feelLost}</p>

      <ApkDownload />
    </div>
  );
}
