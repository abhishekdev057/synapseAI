# Synapse — Project Overview (for mentors)

**AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia
Patients in the North Eastern Region (NER)**

Smart India Hackathon — Problem Statement **26003** — Ministry of Development of
North Eastern Region (MDoNER) — Category: Software — Theme: MedTech / HealthTech.

This document explains **everything in the current codebase**: what it is, why
each technology was chosen, how the two AI/algorithmic pieces work, the database
design, the API, and what is real vs. still to be built. It is written to be read
aloud to a mentor.

---

## 1. What has been built

A working **full-stack scaffold** with three role-based front-ends sharing one
database and one API:

| Role | Route | What it does today |
|------|-------|--------------------|
| **Patient** (elderly dementia patient) | `/patient` | Orientation home screen with a live clock and a "read this to me" voice button; a games list; one fully playable adaptive game (**Memory Lane**); today's reminders with large "Done" buttons; a "Who is this?" family screen. Large targets, high contrast, no timers, no scores, no failure states. |
| **Family caregiver** | `/caregiver` | Per-patient dashboard: engagement (games in last 7 days), reminder adherence (14 days), open alerts, a plain-language read of every cognitive domain, reminder management, and family-contact management. |
| **Clinician / ASHA worker** | `/clinician` | Multi-patient list sorted by priority with a traffic-light status; a patient detail page with per-domain trend charts, an auto-generated **referral summary**, and an alert feed with acknowledge / resolve. |

Everything is backed by **Neon Postgres** through **Drizzle ORM**, and by a REST
API under `/api` that the patient app already uses (and that a future offline
mobile/PWA client would use).

The database is **seeded** with three fictional NER patients and ~3 weeks of
history so every screen has real content and the decline-detection algorithm
actually fires.

---

## 2. Repository layout

```
synapse/
├── app/                      # Next.js App Router
│   ├── page.tsx              # Landing page / role portal
│   ├── layout.tsx            # Root layout + fonts + metadata
│   ├── globals.css           # Tailwind v4 theme tokens (teal / terracotta / mustard)
│   │
│   ├── patient/              # PATIENT APP (elderly-first UI)
│   │   ├── layout.tsx        #   .patient-scope: larger text, min 4rem buttons
│   │   ├── page.tsx          #   Orientation home: clock, next task, big nav
│   │   ├── games/page.tsx    #   The 7-game suite (only Memory Lane playable)
│   │   ├── games/memory-lane/page.tsx
│   │   ├── reminders/page.tsx
│   │   └── people/page.tsx   #   "Who is this?" family faces + voice
│   │
│   ├── caregiver/            # FAMILY DASHBOARD
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── clinician/            # CLINICIAN / ASHA DASHBOARD
│   │   ├── layout.tsx
│   │   ├── page.tsx          #   Prioritised patient list
│   │   └── [id]/page.tsx     #   Patient detail: charts + referral + alerts
│   │
│   └── api/                  # REST API (used by patient app + future PWA)
│       ├── patients/route.ts
│       ├── patients/[id]/route.ts
│       ├── patients/[id]/sessions/route.ts        # record a game round
│       ├── patients/[id]/next-difficulty/route.ts # ask the DDA engine
│       ├── patients/[id]/trends/route.ts
│       ├── patients/[id]/reminders/route.ts
│       ├── patients/[id]/reminders/today/route.ts
│       ├── patients/[id]/alerts/route.ts
│       ├── patients/[id]/contacts/route.ts
│       ├── reminders/[id]/log/route.ts            # Done / missed / snoozed
│       └── alerts/[id]/route.ts                   # acknowledge / resolve
│
├── db/
│   ├── schema.ts             # Drizzle schema — 11 tables + enums (see §5)
│   └── seed.ts               # Deterministic-ish demo data generator
│
├── lib/
│   ├── db.ts                 # Neon serverless driver + Drizzle client
│   ├── schema re-export
│   ├── queries.ts            # All DB reads/writes used by pages + API
│   ├── adaptive.ts           # Dynamic Difficulty Adjustment engine (see §6)
│   ├── decline.ts            # Cognitive decline detection (see §7)
│   ├── referral.ts           # Builds the clinician referral summary text
│   ├── cognitive-domains.ts  # The 6 domains + 7-game catalogue (identifiers)
│   ├── languages.ts          # NER language codes → speech-synthesis tags
│   ├── demo.ts               # "which patient" resolver (no auth yet)
│   └── utils.ts              # cn(), date/percent formatters
│
├── components/
│   ├── ui.tsx                # Card, Button, Badge, StatusDot, Stat, SectionTitle
│   ├── patient/              # Clock, SpeakButton, ReminderList, MemoryLane
│   └── dashboard/            # PatientTabs, AlertRow, TrendChart, Add*Form
│
├── drizzle.config.ts         # Points drizzle-kit at Neon
├── .env                      # DATABASE_URL (gitignored — NOT committed)
├── .env.example              # Template that IS committed
└── docs/PROJECT_OVERVIEW.md  # this file
```

---

## 3. Technology stack and why

| Layer | Choice | Why this, for this problem |
|-------|--------|----------------------------|
| **Framework** | **Next.js 16 (App Router)** + React 19 | One codebase serves all three roles + the API. Server Components read the database directly (no API round-trip for dashboards), while the patient screens can run as an installable **PWA** later for offline use. Deploys to Vercel with zero config. |
| **Language** | **TypeScript** (strict) | Healthcare data — we want the compiler to catch shape errors in scores, enums, and reminder schedules before they reach a caregiver. |
| **Styling** | **Tailwind CSS v4** | Fast, consistent, and the design tokens (teal / indigo primary, terracotta + mustard accents echoing NER textiles) live in one file, `globals.css`. A `.patient-scope` class bumps font size and minimum button height for the elderly UI. |
| **Database** | **Neon Postgres** (serverless) | Managed Postgres with a generous free tier, instant branching for dev/demo, and an HTTP driver that suits serverless functions. Relational is the right fit: patients ↔ caregivers ↔ clinicians ↔ sessions ↔ reminders are all foreign-key relationships. |
| **ORM** | **Drizzle ORM** + **drizzle-kit** | Type-safe SQL: the table definitions in `db/schema.ts` generate the TypeScript types used everywhere. `drizzle-kit push` syncs the schema to Neon without hand-written migrations during prototyping. |
| **DB driver** | `@neondatabase/serverless` (`neon-http`) | One HTTP round-trip per query, no connection pool to manage — ideal for Vercel/serverless. |
| **Charts** | **Recharts** | The clinician trend charts. Small, declarative, works with React 19. |
| **Validation** | **Zod** | Every API route validates its request body with a Zod schema before touching the database. |
| **Icons** | **lucide-react** | Consistent, light line icons. |
| **Voice** | Browser **Web Speech API** (`speechSynthesis`) | Zero-dependency text-to-speech for the "read aloud" buttons. Works offline once the OS has voices. In production this is replaced by the tiered plan in §10 (AI4Bharat / Vosk / Piper + pre-recorded clips for low-resource languages). |
| **Scripts** | **tsx** | Runs `db/seed.ts` as TypeScript directly. |

Nothing here is locked in — the point of the scaffold is that each layer is a
standard, swappable choice.

---

## 4. Architecture

```
                    ┌──────────────────────────────────────────┐
                    │              Neon Postgres               │
                    │   patients, caregivers, clinicians,      │
                    │   game_sessions, cognitive_scores,       │
                    │   reminders, reminder_logs, alerts,      │
                    │   family_contacts, baseline_assessments  │
                    └──────────────────┬───────────────────────┘
                                       │ Drizzle ORM (lib/db.ts, lib/queries.ts)
             ┌─────────────────────────┼─────────────────────────┐
             │                         │                         │
   Server Components            REST API (/api)          db/seed.ts
   (dashboards read DB          - patient app uses it     (demo data)
    directly, no HTTP hop)      - future offline PWA
             │                    uses it to sync
             │                         │
   ┌─────────┴─────────┐   ┌───────────┴───────────┐
   │ /caregiver        │   │ /patient  (games,     │
   │ /clinician        │   │  reminders, people)   │
   └───────────────────┘   └───────────────────────┘
```

Two shared algorithm modules sit between the data and the UI:

- **`lib/adaptive.ts`** — decides the difficulty of the patient's next game round.
- **`lib/decline.ts`** — decides whether a cognitive domain is declining and how
  urgently, and produces the sentence caregivers/clinicians read.

Both are **pure functions** with no dependencies — they can run on-device in the
future mobile client exactly as they run here.

---

## 5. Database schema (`db/schema.ts`)

11 tables. All primary keys are UUIDs; all timestamps are `timestamptz`.

### People

| Table | Key columns | Purpose |
|-------|-------------|---------|
| `clinicians` | `name`, `facility`, `region` | PHC / hospital doctor or ASHA worker. |
| `caregivers` | `name`, `relationship`, `phone`, `email` | Family member. |
| `patients` | `name`, `age_years`, `sex`, `language`, `region`, `cognitive_stage` (`mild`/`moderate`/`severe`), `primary_clinician_id` → clinicians | The elderly user. `language` is a code from `lib/languages.ts`. |
| `patient_caregivers` | (`patient_id`, `caregiver_id`) composite PK, `is_primary` | Many-to-many: a patient can have several caregivers. |

### Cognitive assessment & gameplay

| Table | Key columns | Purpose |
|-------|-------------|---------|
| `baseline_assessments` | `instrument` (`synapse_baseline`/`mmse`/`moca`), `total_score`, `max_score`, `band` | The short onboarding screen that sets the starting difficulty band. **Explicitly not diagnostic.** |
| `game_sessions` | `game_key`, `domain`, `difficulty` (1–10), `accuracy` (0–1), `reaction_time_ms`, `hints_used`, `rounds_completed`, `score` (0–100), `played_at` | One completed game round. This is the raw signal for adaptive difficulty. |
| `cognitive_scores` | `domain`, `score` (0–100), `source` (`rollup`/`assessment`), `recorded_at` | **Daily rolled-up** score per domain. This is the time-series the decline detector and the clinician charts read. Writing a `game_session` refreshes the day's rollup automatically (`refreshDailyRollup` in `lib/queries.ts`). |

`domain` is one of six: `memory`, `attention`, `routine_recall`,
`pattern_recognition`, `engagement`, `language` — mapping directly onto the five
cognitive areas named in the problem statement (plus `language` as a supporting
domain).

### Reminders & memory assistance

| Table | Key columns | Purpose |
|-------|-------------|---------|
| `reminders` | `kind` (`medicine`/`hydration`/`activity`/`appointment`), `title`, `description`, `times_of_day` (`["07:30", ...]`), `days_of_week` (`[]` = daily), `medicine_photo_url`, `active` | A recurring reminder. Times are **local** — designed to be scheduled on-device, never server-pushed. |
| `reminder_logs` | `reminder_id`, `patient_id`, `scheduled_for`, `status` (`pending`/`done`/`missed`/`snoozed`), `responded_at` | One occurrence of a reminder and what the patient did. Adherence % is computed from these. |
| `family_contacts` | `name`, `relationship`, `photo_url`, `voice_clip_url`, `notes` | The "Who is this?" data set. |

### Monitoring

| Table | Key columns | Purpose |
|-------|-------------|---------|
| `alerts` | `kind` (`missed_medication`/`cognitive_decline`/`low_engagement`/`sos`), `severity` (`info`/`warning`/`critical`), `title`, `message`, `status` (`open`/`acknowledged`/`resolved`), `acknowledged_by` | What both dashboards surface. In the scaffold these are seeded; §11 describes wiring them to fire automatically. |

---

## 6. The adaptive difficulty engine (`lib/adaptive.ts`)

**Goal:** keep the patient in the *flow zone* — challenged but succeeding.
Cognitive-training research places this at roughly **75–85 % accuracy**. Too easy
and there is no training effect and the patient disengages; too hard and they
feel they are failing, which for a dementia patient causes real distress.

**It is a small deterministic control loop — no training data, no network, no
model file.** It can run on the patient's device.

### Inputs
The patient's last few rounds of **one** game: `accuracy`, `difficulty`,
`hintsUsed`, `reactionTimeMs`, `playedAt`.

### Algorithm (`nextDifficulty`)
1. **Cold start (no history):** difficulty is set from the baseline stage —
   `mild → 3`, `moderate → 2`, `severe → 1` (`startingDifficulty`).
2. **Effective accuracy:** each hint used shaves 5 % off the raw accuracy
   (capped at −25 %), so "90 % with lots of hints" is not treated as mastery
   (`effectiveAccuracy`).
3. **Recency-weighted mean:** the last 3 rounds are averaged with weights
   3 : 2 : 1 so the most recent performance dominates.
4. **Decision**, anchored on the difficulty actually played most recently:

   | Effective accuracy | Action |
   |--------------------|--------|
   | ≥ 95 %             | +2 levels |
   | > 85 %             | +1 level |
   | 75 – 85 %          | hold (in the flow zone) |
   | < 75 %             | −1 level |
   | < 50 %             | −2 levels |

5. Result is clamped to 1–10 and returned with a **plain-language reason**
   (shown only to caregivers/clinicians, never the patient).

### Where it runs
- `GET /api/patients/[id]/next-difficulty?game=memory_lane` returns the decision.
- `POST /api/patients/[id]/sessions` records a round **and** returns the updated
  decision, so the patient app can adjust the very next round.
- The Memory Lane game (`components/patient/MemoryLane.tsx`) uses it: the number
  of card pairs = `clamp(2 + round(difficulty · 0.8), 3, 10)`.

### Example (from the seeded "Aideu" patient, who is struggling)
```
GET .../next-difficulty?game=memory_lane
→ { "next": 2,
    "reason": "Effective accuracy 51% — below the flow zone; easing down to level 2.",
    "effectiveAccuracy": 0.507 }
```

---

## 7. The cognitive decline detection (`lib/decline.ts`)

**Goal:** the "early cognitive intervention" requirement. Turn a noisy series of
domain scores into: *stable / declining / improving*, a severity, and a sentence
a caregiver can act on.

**Two independent signals must agree before a flag is raised** — this keeps false
alarms low, which matters because a false "your parent is declining" alert is
harmful.

### Inputs
The `cognitive_scores` rollups for one domain (0–100, roughly one point per day).

### Algorithm (`detectDecline`)
1. Need **≥ 4 points**, else return `stable` / "not enough data".
2. **Signal 1 — trend slope:** ordinary least-squares regression of score
   against time, expressed as **points per week**.
3. **Signal 2 — level shift:** `mean(last third) − mean(first third)` of the
   window, in points. (A simple, explainable stand-in for a CUSUM change-point.)
4. **Decision:**
   - `declining` if slope ≤ **−2 pts/week** **and** level shift ≤ **−8 pts**.
     - `severity = critical` if the shift is ≤ −15 pts, else `warning`.
   - `improving` if slope ≥ +2 pts/week **and** level shift ≥ +8 pts.
   - otherwise `stable`.
5. Returns a **caregiver-facing summary**, e.g.
   *"Attention scores have declined steadily over the last 3 weeks (down 17.6
   points, about 8.1 points/week). Consider a clinical review."*

### Where it runs
- `getDomainTrends()` in `lib/queries.ts` runs it for all six domains.
- The **clinician list** uses it to compute the traffic-light status and sort
  patients by priority.
- The **clinician detail** page colours each chart and prints the summary.
- The **caregiver** page prints the summary per domain in plain language.
- `lib/referral.ts` folds the declining domains into the referral text.

### Example (seeded "Aideu")
```
Memory                       stable     slope/wk=-3.08  shift=-5.6
Attention & Concentration    declining  slope/wk=-8.11  shift=-17.6   → critical
Daily Routine Recall         stable     slope/wk=-0.26  shift=-0.3
```

---

## 8. API reference

All routes are under `/api`, return JSON, and validate input with Zod.

| Method & path | Body / query | Returns |
|---------------|--------------|---------|
| `GET /api/patients` | — | All patients with computed traffic-light status, open-alert counts, 7-day session count, worst declining domain. |
| `POST /api/patients` | `name`, `ageYears?`, `language?`, `region?`, `cognitiveStage?`, `primaryClinicianId?` | Created patient. |
| `GET /api/patients/[id]` | — | Patient + linked clinician + caregivers + latest baseline. |
| `GET /api/patients/[id]/trends` | — | Per-domain series + `detectDecline` result. |
| `GET /api/patients/[id]/sessions` | `?game=` | Recent game rounds. |
| `POST /api/patients/[id]/sessions` | `gameKey`, `domain`, `difficulty`, `accuracy`, `reactionTimeMs?`, `hintsUsed?`, `roundsCompleted?` | `{ session, score, adaptive }` — persists the round, refreshes the daily rollup, returns the next-difficulty decision. |
| `GET /api/patients/[id]/next-difficulty` | `?game=` | `{ next, reason, effectiveAccuracy }`. |
| `GET /api/patients/[id]/reminders` | — | All reminders. |
| `POST /api/patients/[id]/reminders` | `kind`, `title`, `timesOfDay[]`, `daysOfWeek[]`, `description?`, `medicinePhotoUrl?` | Created reminder. |
| `GET /api/patients/[id]/reminders/today` | — | Today's reminder occurrences with per-occurrence status. |
| `POST /api/reminders/[id]/log` | `patientId`, `status` (`done`/`missed`/`snoozed`), `scheduledFor` (ISO) | Upserts the occurrence log. |
| `GET /api/patients/[id]/alerts` | — | All alerts, newest first. |
| `PATCH /api/alerts/[id]` | `status`, `by?` | Acknowledge / resolve an alert. |
| `GET /api/patients/[id]/contacts` | — | Family contacts. |
| `POST /api/patients/[id]/contacts` | `name`, `relationship`, `photoUrl?`, `voiceClipUrl?`, `notes?` | Created contact. |

---

## 9. The three apps, screen by screen

### Patient (`/patient`) — elderly-first
- **Home:** live clock, day/date, part-of-day line, a "read this to me" button
  (Web Speech API, language from the patient record), the next pending reminder
  with an **Open** button, and three big nav tiles (Play a game / My reminders /
  Who is this?). A line about press-and-hold Home to call family.
- **Games:** the full seven-game suite is listed with its cultural theme; only
  **Memory Lane** is playable, the rest are visibly locked.
- **Memory Lane:** a matching game. Pair count comes from the adaptive engine.
  No timer, no score shown, no "wrong" — mismatches simply flip back. A "Show
  all" hint (counted). On completion: a gentle "Well done today" screen, a
  **Play again** button that uses the *new* recommended difficulty, and a
  collapsible "For your caregiver / doctor" note with the effective accuracy and
  the adaptive reason. The round is POSTed to the API.
- **Reminders:** today's occurrences as large cards with an emoji per kind, a
  "Hear" button, and **Done** / **Later** buttons that write to `reminder_logs`.
- **Who is this?:** a grid of family contacts (photo or initial, name,
  relationship, note) each with a "Hear" button that speaks
  *"This is Anjali, your daughter…"*.

### Caregiver (`/caregiver`)
Patient switcher (tabs) + four stat tiles (games 7d, adherence 14d, open alerts,
last played) + a plain-language per-domain status list + the alert feed
(acknowledge / resolve) + reminder list with an **Add reminder** form + family
contacts with an **Add family member** form.

### Clinician (`/clinician`)
- **List:** every patient as a row, **sorted red → amber → green**, showing
  status, region, stage, alert counts, 7-day sessions, flagged area.
- **Detail (`/clinician/[id]`):** status header, four stat tiles, an
  auto-generated **referral summary** (`lib/referral.ts`), six per-domain
  **trend charts** (Recharts) coloured by trend with the decline sentence under
  each, and the alert feed.

---

## 10. Offline-first strategy

**Designed for, partially demonstrated.**

- The two algorithms (`lib/adaptive.ts`, `lib/decline.ts`) are pure, dependency-
  free functions — they are written so the future mobile/PWA client runs them
  **on-device**, unchanged.
- Reminder times are stored as **local trigger times** (`times_of_day`), not
  server schedules — so a device can fire them with the radio off.
- Voice uses the **on-device** Web Speech API, not a cloud TTS call.
- The REST API is deliberately a thin **sync surface**: a local-first client
  (SQLite / IndexedDB) would queue `game_sessions` and `reminder_logs` and
  `POST` them in a batch when connectivity appears.

**Tiered voice plan for NER languages** (not in the scaffold — see the pitch
document): Tier 1 (Assamese, Bengali, Nepali, Hindi, English) full on-device
TTS + keyword ASR via AI4Bharat / Vosk / Piper; Tier 2 (Meitei, Bodo) TTS where
models exist else pre-recorded human clips; Tier 3 (Khasi, Mizo, Nagamese…)
pre-recorded human clips only. `lib/languages.ts` already carries the language
codes and a best-effort speech tag per language.

---

## 11. Security & privacy

**Implemented now:**
- `DATABASE_URL` lives only in `.env`, which is **gitignored**. `.env.example`
  (placeholders only) is committed.
- Neon connections are TLS + channel-binding (`sslmode=require`).
- Every API route validates input with Zod before any DB write.
- No secret, key, or PII is committed to the repo.

**Designed, not yet built:**
- Authentication and role-based access (patient / caregiver / clinician /
  admin). Today the "current patient" is resolved by `lib/demo.ts` for the demo.
- Encryption at rest on the device (SQLCipher) for the offline client.
- Consent capture and revocation; data minimisation.
- Alignment of the data model with **ABDM / Ayushman Bharat Health Account** so
  records are portable into the national digital health stack.
- Compliance posture for the **DPDP Act 2023**.
- Positioning as a *cognitive engagement and monitoring aid*, not a diagnostic
  device, with a human always in the loop.

**Auto-firing alerts** (the wiring that turns seeded alerts into real ones):
a scheduled job (Vercel Cron) that, per patient, runs `detectDecline` on each
domain and `getAdherence`, and inserts an `alerts` row when a threshold is
crossed and no open alert of that kind already exists. The thresholds already
exist in `lib/decline.ts`; only the cron handler is missing.

---

## 12. Running it locally

```bash
# 1. Install
npm install

# 2. Configure the database
cp .env.example .env          # then paste your Neon pooled DATABASE_URL

# 3. Create the tables in Neon
npm run db:push

# 4. Load demo data (3 patients, ~3 weeks of history)
npm run db:seed

# 5. Run
npm run dev                   # http://localhost:3000
```

Other scripts: `npm run build`, `npm run db:studio` (Drizzle Studio),
`npm run db:generate` (SQL migration files).

---

## 13. Deploying

- **App:** push to GitHub, import the repo in Vercel, set `DATABASE_URL` as an
  environment variable. Next.js 16 + Neon HTTP driver run on Vercel's default
  Node runtime with no extra config.
- **Database:** the same Neon project, or a Neon **branch** per environment
  (`preview` vs `production`). Run `npm run db:push` against the production URL
  once.

---

## 14. What is real vs. mocked in this scaffold

| Real | Mocked / simplified |
|------|---------------------|
| Postgres schema, migrations, seed | No authentication — `lib/demo.ts` picks the patient |
| Adaptive difficulty engine + tests-by-example | Only 1 of 7 games is playable |
| Decline detection with two-signal logic | Alerts are seeded, not auto-generated (cron handler pending) |
| REST API with Zod validation | Voice = browser TTS, not AI4Bharat / pre-recorded NER clips |
| All three dashboards, live from the DB | Offline sync client not built (API is sync-ready) |
| Recharts trend visualisations | Photos / voice clips are URLs, no upload/storage yet |
| Referral summary generator | No PDF export of the referral yet |

---

## 15. Roadmap

1. **Auth + roles** (Clerk or Auth.js) and per-role data scoping.
2. **Vercel Cron** handler to auto-generate alerts from `detectDecline` + adherence.
3. Build the remaining six games (Market Basket, Morning Routine, Pattern of the
   Loom, Bird & Beast, Song of the Hills, Word Garden).
4. **Offline PWA / React Native** client: local SQLite, batch sync via the API,
   on-device inference using `lib/adaptive.ts` + `lib/decline.ts` verbatim.
5. **Tiered NER voice**: AI4Bharat / Vosk / Piper packs + community-recorded
   prompts for Tier-3 languages.
6. **ASHA hub tablet** mode: collect from several patient devices over local
   Wi-Fi/Bluetooth, upload when connectivity returns.
7. Media storage (Vercel Blob) for family photos / voice clips.
8. Referral **PDF export**; ABDM record alignment.
9. Clinical validation with a regional institution (e.g. NEIGRIHMS, Shillong).

---

## 16. Mapping to the problem statement

| Requirement | Where it is in the code |
|-------------|-------------------------|
| (a) Cognitive games — memory, attention, routine recall, pattern/object recognition, emotional engagement | `lib/cognitive-domains.ts` (6 domains, 7-game catalogue); `components/patient/MemoryLane.tsx` (playable); `game_sessions.domain` enum |
| (b) AI/ML adapts difficulty to performance & condition | `lib/adaptive.ts`; `POST /api/patients/[id]/sessions`; `baseline_assessments` sets the starting band |
| (c) Multilingual + voice-assisted interaction | `lib/languages.ts`; `components/patient/SpeakButton.tsx`; `patients.language` |
| (d) Culturally familiar themes / visuals / sounds | Memory Lane symbol set (rhino, tea, bamboo, loom motifs…); game catalogue cultural themes; teal/terracotta/mustard theme |
| (e) Reminders — medicine, hydration, activities, appointments | `reminders` + `reminder_logs` tables; `/patient/reminders`; caregiver reminder manager |
| (f) Caregiver & health-worker dashboards | `/caregiver` and `/clinician` (list + detail) |
| (g) Offline / low-connectivity support | §10 — pure algorithm modules, local reminder times, on-device voice, sync-ready API |
| (h) Simple, elderly-friendly mobile/tablet UI | `.patient-scope` (large text, 4rem buttons), no timers, no scores, no failure states, voice on every screen |
| Secure patient data management | §11 — gitignored secrets, TLS, Zod validation; auth + encryption on the roadmap |
| Early cognitive intervention | `lib/decline.ts` + the alert feed + `lib/referral.ts` |

---

## 17. Demo script (≈ 4 minutes)

1. **Landing page** — three roles, one platform.
2. **Patient → Play a game → Memory Lane.** Point out: big cards, no timer, no
   score. Deliberately mismatch a few times, then finish. Show the gentle
   "Well done" screen; open "For your caregiver" to reveal the adaptive reason.
   Press **Play again** — note the board size changed because the engine adjusted.
3. **Patient → My reminders.** Tap **Done** on the medicine reminder; tap
   **Hear** to show voice.
4. **Patient → Who is this?** Tap **Hear** on a family member.
5. **Clinician dashboard.** The list is sorted by priority — "Aideu Handique" is
   red. Open her. Show the **Attention** chart trending down, the red
   "declining" badge, the decline sentence, and the **referral summary** that was
   generated from that data. Acknowledge the alert.
6. **Family dashboard** for the same patient — the same decline, explained in one
   plain sentence, plus adherence and the reminder/contact managers.
7. Close on §10–11: everything the patient touches is designed to run offline and
   on-device, and the two "AI" pieces are pure functions that move to the phone
   unchanged.

---

## 18. Native Android patient app (`android/`)

The web `/patient` routes are the reference implementation; the **shipping
patient client is a native Kotlin + Jetpack Compose app** in `android/`, built
offline-first with delta sync to `https://synapse.sigmafusion.in`.

### Why native
The problem statement needs offline operation, on-device voice, reliable local
reminder alarms, and an interface tuned for an 80-year-old with tremor and low
vision on a cheap Android tablet. A native app gives all four; a web view gives
none reliably.

### Stack
| Concern | Choice |
|---|---|
| Language / UI | Kotlin 2.0, Jetpack Compose + Material 3 |
| Min / target SDK | 26 (Android 8) / 35 |
| Architecture | MVVM — Compose screens → `ViewModel` (StateFlow) → `SynapseRepository` → Room / Retrofit |
| Local store | Room (`synapse.db`): patient, reminder, reminder_log, game_session, family_contact |
| Remote | Retrofit + OkHttp + kotlinx.serialization against the Next.js API |
| Settings | DataStore (patient id, server URL, language, TTS, last-sync) |
| Background sync | WorkManager — periodic (3 h, connected) + one-shot after every local write |
| Reminders | `AlarmManager` exact alarms → `ReminderReceiver` notification; re-armed on boot |
| Voice | Android `TextToSpeech` (on-device); pre-recorded clips are the production plan for Tier-2/3 NER languages |
| DI | Hand-rolled `AppContainer` (no Hilt — keeps the build lean) |

### Offline-first + delta sync
- **Every read comes from Room** via `Flow`, so the whole app works with the
  radio off. Today's reminder occurrences are computed **on-device** from the
  reminder rows + local logs, so tapping **Done** updates instantly.
- **Every write goes to Room first** with `synced = false`, then a sync is
  enqueued. `SynapseRepository.sync()` (also run by `SyncWorker`):
  1. picks the patient from `/api/patients` on first run (falls back to a small
     **bundled sample** so the app is never blank offline),
  2. **pulls** patient + reminders + contacts,
  3. **pushes** every queued `reminder_log` and `game_session`, marking each
     `synced` with the server id it returns,
  4. stamps `last_sync`.
  Each remote call is wrapped in `runCatching`, so a flaky link still makes
  partial progress.
- A true `?since=` delta endpoint on the server is a listed TODO; today the pull
  is a full refresh of the three small per-patient tables.

### The adaptive engine travels unchanged
`domain/AdaptiveDifficulty.kt` is a line-for-line port of the web
`lib/adaptive.ts` (same 75–85 % flow-zone control loop, same hint penalty, same
recency weights). Memory Lane calls `repo.recommendDifficulty()` before a round
and `repo.recordRound()` after — both run fully offline; the round syncs later.

### Screens
`Home` (orientation: live clock, day/date, spoken greeting, next task, three big
tiles) · `Games` (the seven-game catalogue, Memory Lane playable) · `Memory
Lane` (adaptive matching game — no timer, no score, no fail state; gentle "Well
done" + a collapsible caregiver note) · `Reminders` (large cards, **Done** /
**Later**, **Hear**) · `Who is this?` (family photos + voice) · `Settings`
(language chips, read-aloud toggle, server URL, **Sync now**, last-sync time).

### Design system (`ui/theme/`)
Elderly-first: type scale ~30 % above Material defaults and never below 16 sp,
`bodyLarge` is Medium weight; minimum touch target 64 dp, primary buttons 76 dp;
off-white ground (never pure `#FFFFFF`); teal primary with terracotta + mustard
accents (NER textiles); full light **and** dark palettes.

### Build & run
```bash
cd android
# local.properties is auto-created here with sdk.dir; or set ANDROID_HOME
./gradlew :app:assembleDebug        # -> app/build/outputs/apk/debug/app-debug.apk
# then: adb install -r app/build/outputs/apk/debug/app-debug.apk
```
Or open `android/` in Android Studio and Run. The server URL defaults to
`https://synapse.sigmafusion.in/` (`DEFAULT_BASE_URL` in `app/build.gradle.kts`)
and is overridable in-app under Settings.

### Package map (`android/app/src/main/java/com/sigmafusion/synapse/`)
```
SynapseApp.kt            Application — DI container, channels, first-run sync
MainActivity.kt          single activity, splash, Compose host
di/AppContainer.kt       hand-rolled dependency graph
core/TimeUtils.kt        clock / ISO / today helpers
domain/                  DomainCatalog, AdaptiveDifficulty (port), UI models
data/local/              Room entities, DAOs, database, DataStore SettingsStore
data/remote/             DTOs, SynapseApi (Retrofit), ApiProvider
data/SynapseRepository   the single source of truth (offline-first)
data/sync/               SyncWorker + SyncScheduler (WorkManager)
notifications/           ReminderScheduler, ReminderReceiver, BootReceiver
ui/theme/                Color, Type, Dimens, Theme
ui/components/           SectionCard, PrimaryButton, BigTile, StatusPill, …
ui/voice/                TextToSpeech wrapper + SpeakButton
ui/SynapseNavHost.kt     routes + shared AppScaffold
ui/screens/…             home / games / reminders / people / settings
```
