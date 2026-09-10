import Link from "next/link";
import { Activity, HeartPulse, Stethoscope } from "lucide-react";

const PERSONAS = [
  {
    href: "/patient",
    icon: Activity,
    title: "Patient app",
    who: "Elderly dementia patient",
    blurb:
      "Voice-led, large-target home screen: orientation, cognitive games with adaptive difficulty, spoken reminders and a “Who is this?” family aid.",
  },
  {
    href: "/caregiver",
    icon: HeartPulse,
    title: "Family dashboard",
    who: "Family caregiver",
    blurb:
      "Set reminders, watch engagement and adherence in plain language, act on early alerts, and manage the family photo/voice contacts.",
  },
  {
    href: "/clinician",
    icon: Stethoscope,
    title: "Clinician dashboard",
    who: "ASHA worker / PHC doctor",
    blurb:
      "Multi-patient list with a traffic-light status, per-domain cognitive trend charts, a decline-detection feed and a referral summary.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <header className="mb-10">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          SIH PS 26003 · MDoNER · MedTech / HealthTech
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Synapse</h1>
        <p className="mt-2 max-w-2xl text-muted">
          AI-based cognitive gaming and memory assistance for elderly dementia
          patients in the North Eastern Region. Offline-first, voice-led,
          culturally rooted, and built around three roles.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-3">
        {PERSONAS.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="group rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p.icon className="h-8 w-8 text-primary" strokeWidth={1.75} />
            <h2 className="mt-4 text-lg font-semibold">{p.title}</h2>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {p.who}
            </p>
            <p className="mt-3 text-sm text-muted">{p.blurb}</p>
            <span className="mt-4 inline-block text-sm font-medium text-primary group-hover:underline">
              Open →
            </span>
          </Link>
        ))}
      </div>

      <section className="mt-12 rounded-2xl border border-border bg-surface p-6">
        <h3 className="text-sm font-semibold">What is in this scaffold</h3>
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
