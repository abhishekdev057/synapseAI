import "dotenv/config";
import { db } from "@/lib/db";
import {
  alerts,
  baselineAssessments,
  caregivers,
  clinicians,
  cognitiveScores,
  familyContacts,
  gameSessions,
  patientCaregivers,
  patients,
  reminderLogs,
  reminders,
} from "@/db/schema";
import { roundScore } from "@/lib/adaptive";
import type { DomainKey } from "@/lib/cognitive-domains";

/* Utilities ------------------------------------------------------- */

const DAY = 864e5;
const daysAgo = (n: number, h = 9, m = 0) => {
  const d = new Date(Date.now() - n * DAY);
  d.setHours(h, m, 0, 0);
  return d;
};
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

async function wipe() {
  await db.delete(reminderLogs);
  await db.delete(reminders);
  await db.delete(gameSessions);
  await db.delete(cognitiveScores);
  await db.delete(baselineAssessments);
  await db.delete(alerts);
  await db.delete(familyContacts);
  await db.delete(patientCaregivers);
  await db.delete(patients);
  await db.delete(caregivers);
  await db.delete(clinicians);
}

const gameForDomain = (domain: DomainKey) =>
  domain === "memory"
    ? "memory_lane"
    : domain === "attention"
      ? "bird_and_beast"
      : domain === "pattern_recognition"
        ? "pattern_of_the_loom"
        : domain === "routine_recall"
          ? "morning_routine"
          : "song_of_the_hills";

/* Seed ---------------------------------------------------------- */

async function main() {
  console.log("Wiping existing data…");
  await wipe();

  console.log("Inserting clinician + caregivers…");
  const [clinician] = await db
    .insert(clinicians)
    .values({
      name: "Dr. Bhupen Kalita",
      facility: "NEIGRIHMS Memory Clinic, Shillong",
      region: "Meghalaya",
    })
    .returning();

  const [cgAnjali, cgLal, cgPema] = await db
    .insert(caregivers)
    .values([
      { name: "Anjali Das", relationship: "Daughter", phone: "+91 98640 11111" },
      { name: "Lalremruata", relationship: "Son", phone: "+91 98620 22222" },
      { name: "Pema Wangchuk", relationship: "Spouse", phone: "+91 97750 33333" },
    ])
    .returning();

  console.log("Inserting patients…");
  const [aideu, lalthla, tenzing] = await db
    .insert(patients)
    .values([
      {
        name: "Aideu Handique",
        ageYears: 78,
        sex: "Female",
        language: "as",
        region: "Jorhat, Assam",
        cognitiveStage: "moderate",
        primaryClinicianId: clinician.id,
      },
      {
        name: "Lalthlamuana",
        ageYears: 72,
        sex: "Male",
        language: "lus",
        region: "Aizawl, Mizoram",
        cognitiveStage: "mild",
        primaryClinicianId: clinician.id,
      },
      {
        name: "Tenzing Bhutia",
        ageYears: 81,
        sex: "Male",
        language: "sip",
        region: "Gangtok, Sikkim",
        cognitiveStage: "mild",
        primaryClinicianId: clinician.id,
      },
    ])
    .returning();

  await db.insert(patientCaregivers).values([
    { patientId: aideu.id, caregiverId: cgAnjali.id, isPrimary: true },
    { patientId: lalthla.id, caregiverId: cgLal.id, isPrimary: true },
    { patientId: tenzing.id, caregiverId: cgPema.id, isPrimary: true },
  ]);

  await db.insert(baselineAssessments).values([
    { patientId: aideu.id, totalScore: 17, maxScore: 30, band: "moderate", assessedAt: daysAgo(25) },
    { patientId: lalthla.id, totalScore: 24, maxScore: 30, band: "mild", assessedAt: daysAgo(24) },
    { patientId: tenzing.id, totalScore: 25, maxScore: 30, band: "mild", assessedAt: daysAgo(20) },
  ]);

  /* Game sessions + daily rollups (batched) --------------------- */

  const DOMAINS: DomainKey[] = [
    "memory",
    "attention",
    "routine_recall",
    "pattern_recognition",
    "engagement",
  ];

  interface Profile {
    patientId: string;
    days: number;
    trend: Partial<Record<DomainKey, [number, number]>>;
    defaultTrend: [number, number];
    sessionsPerDay: number;
    difficulty: number;
  }

  const profiles: Profile[] = [
    {
      patientId: aideu.id,
      days: 21,
      trend: { attention: [77, 55], memory: [66, 58], engagement: [72, 68] },
      defaultTrend: [64, 62],
      sessionsPerDay: 2,
      difficulty: 3,
    },
    {
      patientId: lalthla.id,
      days: 21,
      trend: { attention: [80, 82], memory: [78, 80] },
      defaultTrend: [76, 78],
      sessionsPerDay: 2,
      difficulty: 5,
    },
    {
      patientId: tenzing.id,
      days: 6,
      trend: { memory: [70, 74] },
      defaultTrend: [71, 73],
      sessionsPerDay: 1,
      difficulty: 4,
    },
  ];

  const sessionRows: (typeof gameSessions.$inferInsert)[] = [];
  const scoreRows: (typeof cognitiveScores.$inferInsert)[] = [];

  for (const p of profiles) {
    for (let d = p.days; d >= 0; d--) {
      const frac = p.days === 0 ? 1 : (p.days - d) / p.days;
      for (const domain of DOMAINS) {
        const [s0, s1] = p.trend[domain] ?? p.defaultTrend;
        const targetScore = clamp(s0 + (s1 - s0) * frac + rand(-4, 4), 20, 98);
        const accuracy = clamp(targetScore / 100 + rand(-0.05, 0.05), 0.1, 1);
        const hintsUsed = Math.random() < 0.3 ? 1 : 0;

        for (let s = 0; s < p.sessionsPerDay; s++) {
          sessionRows.push({
            patientId: p.patientId,
            gameKey: gameForDomain(domain),
            domain,
            difficulty: p.difficulty,
            accuracy: Number(accuracy.toFixed(3)),
            reactionTimeMs: Math.round(rand(1200, 3200)),
            hintsUsed,
            roundsCompleted: Math.round(rand(6, 12)),
            completed: true,
            score: roundScore({ accuracy, difficulty: p.difficulty, hintsUsed }),
            playedAt: daysAgo(d, 9 + s * 8, Math.floor(rand(0, 59))),
          });
        }

        scoreRows.push({
          patientId: p.patientId,
          domain,
          score: Math.round(targetScore),
          source: "rollup",
          recordedAt: daysAgo(d, 20, 0),
        });
      }
    }
  }

  console.log(`Inserting ${sessionRows.length} game sessions…`);
  await db.insert(gameSessions).values(sessionRows);
  console.log(`Inserting ${scoreRows.length} cognitive-score rollups…`);
  await db.insert(cognitiveScores).values(scoreRows);

  /* Reminders + logs (batched) --------------------------------- */

  console.log("Inserting reminders + logs…");
  const reminderTemplates = [
    { kind: "medicine" as const, title: "White tablet (Donepezil)", description: "Take with water after breakfast.", timesOfDay: ["07:30"], daysOfWeek: [] as number[] },
    { kind: "medicine" as const, title: "Evening tablet", description: "After dinner.", timesOfDay: ["19:30"], daysOfWeek: [] as number[] },
    { kind: "hydration" as const, title: "Drink a glass of water", description: undefined, timesOfDay: ["10:30", "15:00"], daysOfWeek: [] as number[] },
    { kind: "activity" as const, title: "Afternoon walk in the courtyard", description: undefined, timesOfDay: ["16:00"], daysOfWeek: [] as number[] },
    { kind: "appointment" as const, title: "Memory clinic follow-up", description: "Dr. Kalita — your daughter will take you.", timesOfDay: ["10:00"], daysOfWeek: [3] },
  ];

  const logRows: (typeof reminderLogs.$inferInsert)[] = [];
  for (const p of [aideu, lalthla, tenzing]) {
    const created = await db
      .insert(reminders)
      .values(
        reminderTemplates.map((t) => ({
          patientId: p.id,
          kind: t.kind,
          title: t.title,
          description: t.description,
          timesOfDay: t.timesOfDay,
          daysOfWeek: t.daysOfWeek,
          active: true,
        })),
      )
      .returning();

    const missChance = p.id === aideu.id ? 0.28 : 0.08;
    for (const r of created) {
      if (r.kind === "appointment") continue;
      for (let d = 14; d >= 1; d--) {
        for (const time of r.timesOfDay) {
          const [h, m] = time.split(":").map(Number);
          const scheduledFor = daysAgo(d, h, m);
          const status = Math.random() < missChance ? "missed" : "done";
          logRows.push({
            reminderId: r.id,
            patientId: p.id,
            scheduledFor,
            status,
            respondedAt: status === "done" ? scheduledFor : null,
          });
        }
      }
    }
  }
  console.log(`Inserting ${logRows.length} reminder logs…`);
  await db.insert(reminderLogs).values(logRows);

  /* Alerts ---------------------------------------------------- */

  console.log("Inserting alerts…");
  await db.insert(alerts).values([
    {
      patientId: aideu.id,
      kind: "cognitive_decline",
      severity: "critical",
      title: "Attention scores declining",
      message:
        "Attention scores have declined steadily over the last 3 weeks (down ~22 points, about 1 point/week). Consider a clinical review.",
      status: "open",
      createdAt: daysAgo(1, 20, 15),
    },
    {
      patientId: aideu.id,
      kind: "missed_medication",
      severity: "warning",
      title: "Evening tablet missed repeatedly",
      message: "The 19:30 evening tablet was not confirmed on 3 of the last 7 days.",
      status: "open",
      createdAt: daysAgo(2, 21, 0),
    },
    {
      patientId: tenzing.id,
      kind: "low_engagement",
      severity: "warning",
      title: "Low engagement",
      message: "Only 4 game sessions in the last 7 days (target is 10–14).",
      status: "open",
      createdAt: daysAgo(1, 18, 0),
    },
    {
      patientId: lalthla.id,
      kind: "cognitive_decline",
      severity: "info",
      title: "Memory scores improved",
      message: "Memory scores are up ~4 points over the last 3 weeks. Keep the current routine.",
      status: "resolved",
      createdAt: daysAgo(4, 20, 0),
      acknowledgedAt: daysAgo(3, 9, 0),
      acknowledgedBy: "Dr. Bhupen Kalita",
    },
  ]);

  /* Family contacts ------------------------------------------- */

  console.log("Inserting family contacts…");
  await db.insert(familyContacts).values([
    { patientId: aideu.id, name: "Anjali", relationship: "Daughter", notes: "Lives next door. Visits every morning." },
    { patientId: aideu.id, name: "Rton", relationship: "Grandson", notes: "Studies in Guwahati. Calls on Sundays." },
    { patientId: aideu.id, name: "Bhola", relationship: "Late husband", notes: "Was a schoolteacher in Jorhat." },
    { patientId: lalthla.id, name: "Lalremruata", relationship: "Son", notes: "Primary caregiver." },
    { patientId: lalthla.id, name: "Zovi", relationship: "Granddaughter", notes: "Brings tea in the evening." },
    { patientId: tenzing.id, name: "Pema", relationship: "Wife", notes: "Cooks together every day." },
    { patientId: tenzing.id, name: "Dorjee", relationship: "Son", notes: "Runs the family shop." },
  ]);

  console.log("\nSeed complete.");
  console.log("  Aideu Handique (declining) :", aideu.id);
  console.log("  Lalthlamuana  (stable)     :", lalthla.id);
  console.log("  Tenzing Bhutia (new)       :", tenzing.id);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
