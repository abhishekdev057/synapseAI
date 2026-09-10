import Link from "next/link";
import { Activity, HeartPulse, Stethoscope } from "lucide-react";
import { ApkDownload } from "@/components/ApkDownload";
import { Brand } from "@/components/Brand";

const PERSONAS = [
  {
    href: "/patient",
    icon: Activity,
    title: "Patient app",
    who: "Elderly dementia patient",
    tint: "bg-tint-peach",
    blurb:
      "Voice-led, large-target home screen: orientation, cognitive games with adaptive difficulty, spoken reminders and a “Who is this?” family aid.",
  },
  {
    href: "/caregiver",
    icon: HeartPulse,
    title: "Family dashboard",
    who: "Family caregiver",
    tint: "bg-tint-mint",
    blurb:
      "Set reminders, watch engagement and adherence in plain language, act on early alerts, and manage the family photo/voice contacts.",
  },
  {
    href: "/clinician",
    icon: Stethoscope,
    title: "Clinician dashboard",
    who: "ASHA worker / PHC doctor",
    tint: "bg-tint-lavender",
    blurb:
      "Multi-patient list with a traffic-light status, per-domain cognitive trend charts, a decline-detection feed and a referral summary.",
  },
];

const FEATURES = [
  ["Works offline", "Games, reminders and data work without internet"],
  ["Adaptive AI", "Automatically adjusts difficulty to the 75–85% flow zone"],
  ["Culturally rooted", "North East India themes and familiar content"],
  ["Safe & dignified", "No failure screens, only encouragement"],
  ["Connected care", "Families and ASHA workers stay informed"],
  ["Multilingual voice", "অসমীয়া · বাংলা · नेपाली · English (and more)"],
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <header className="mb-10">
        <Brand href={null} size="lg" tagline />
        <div className="mt-6 rounded-3xl border border-border bg-surface/70 p-6 backdrop-blur">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            SIH PS 26003 · MDoNER · MedTech / HealthTech
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
            A Cognitive Companion for Brighter Tomorrows
          </h1>
          <p className="mt-2 max-w-2xl text-muted">
            For our elders. For our communities. AI-based cognitive gaming and
            memory assistance for elderly dementia patients in the North Eastern
            Region — offline-first, voice-led, culturally rooted, and built around
            three roles.
          </p>
        </div>
      </header>

      <div className="grid gap-5 sm:grid-cols-3">
        {PERSONAS.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className={`group rounded-3xl border border-border ${p.tint} p-6 shadow-[0_1px_2px_rgba(22,58,99,0.04),0_8px_24px_rgba(22,58,99,0.06)] transition hover:-translate-y-0.5 hover:shadow-md`}
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-surface shadow-sm">
              <p.icon className="h-6 w-6 text-primary" strokeWidth={2} />
            </span>
            <h2 className="mt-4 text-lg font-bold text-navy">{p.title}</h2>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {p.who}
            </p>
            <p className="mt-3 text-sm text-foreground/80">{p.blurb}</p>
            <span className="mt-4 inline-block text-sm font-semibold text-primary group-hover:underline">
              Open →
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <ApkDownload />
      </div>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(([title, body]) => (
          <div
            key={title}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <p className="font-bold text-navy">{title}</p>
            <p className="mt-1 text-sm text-muted">{body}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 rounded-3xl border border-border bg-surface p-6">
        <h3 className="text-sm font-bold text-navy">What is in this scaffold</h3>
        <ul className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-2">
          <li>• Next.js 16 App Router + TypeScript + Tailwind v4</li>
          <li>• Neon Postgres via Drizzle ORM (11 tables)</li>
          <li>• Adaptive difficulty engine (75–85% flow zone)</li>
          <li>• Cognitive decline detection (trend slope + level shift)</li>
          <li>• REST API under <code>/api</code> for the patient PWA</li>
          <li>• Seeded demo data — 3 patients, ~3 weeks of history</li>
        </ul>
        <p className="mt-4 text-xs text-muted">
          See <code>docs/PROJECT_OVERVIEW.md</code> for the full mentor-facing
          write-up.
        </p>
      </section>
    </main>
  );
}
