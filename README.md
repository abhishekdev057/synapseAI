# Synapse

**AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia
Patients in the North Eastern Region (NER)**

Smart India Hackathon — Problem Statement **26003** — Ministry of Development of
North Eastern Region (MDoNER). Category: Software. Theme: MedTech / HealthTech.

> Full mentor-facing write-up: [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md)

---

## What this is

A full-stack scaffold with **three role-based front-ends** on one database and
one API:

| Role | Where | Summary |
|------|-------|---------|
| **Patient** | native Android app in [`android/`](android/) (web `/patient` is the reference) | Offline-first Kotlin + Compose app: voice-led large-target home; adaptive **Memory Lane** game; local reminder alarms with big "Done"; "Who is this?" family aid; delta sync to the server. No timers, no scores, no failure states. |
| **Family caregiver** | `/caregiver` | Engagement + reminder adherence, plain-language cognitive status per domain, alert feed, reminder & contact management. |
| **Clinician / ASHA** | `/clinician` | Prioritised patient list with a traffic-light status; per-patient trend charts, an auto-generated referral summary, and an alert feed. |

Two dependency-free algorithm modules power the "AI":

- **`lib/adaptive.ts`** — Dynamic Difficulty Adjustment, steering each patient to
  a 75–85 % success "flow zone".
- **`lib/decline.ts`** — Cognitive decline detection (regression slope + level
  shift), producing the plain-language alerts.

Both are pure functions, written to move to an on-device offline client unchanged.

---

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 ·
Neon Postgres · Drizzle ORM · Recharts · Zod · Web Speech API

---

## Getting started

```bash
npm install

cp .env.example .env          # paste your Neon pooled DATABASE_URL

npm run db:push               # create tables in Neon
npm run db:seed               # load demo data (3 patients, ~3 weeks history)

npm run dev                   # http://localhost:3000
```

### Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run db:push` | Sync `db/schema.ts` to Neon |
| `npm run db:seed` | Load demo data |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:generate` | Generate SQL migration files |

---

## Project layout

```
app/            Next.js routes — patient / caregiver / clinician / api
db/             Drizzle schema + seed
lib/            db client, queries, adaptive engine, decline detection, referral
components/     shared UI + patient/ + dashboard/ component sets
android/        native Kotlin + Jetpack Compose patient app (offline-first)
docs/           PROJECT_OVERVIEW.md (read this — §18 covers the Android app)
```

---

## Status

This is a hackathon **base scaffold**. Real: schema, both algorithms, the API,
all three dashboards, seeded data. Pending: authentication, the other six games,
auto-firing alerts (Vercel Cron), the offline PWA client, and the tiered
NER-language voice stack. See `docs/PROJECT_OVERVIEW.md` §14–15.

## License

MIT — see [`LICENSE`](LICENSE).
