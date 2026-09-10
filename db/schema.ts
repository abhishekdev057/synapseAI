import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

/** The five cognitive domains named in the problem statement, plus language. */
export const cognitiveDomain = pgEnum("cognitive_domain", [
  "memory", // memory improvement
  "attention", // attention and concentration
  "routine_recall", // daily routine recall
  "pattern_recognition", // pattern and object recognition
  "engagement", // emotional and mental engagement
  "language", // verbal fluency (supporting domain)
]);

/** Coarse dementia staging used to set a starting difficulty band. */
export const cognitiveStage = pgEnum("cognitive_stage", [
  "mild",
  "moderate",
  "severe",
]);

export const assessmentInstrument = pgEnum("assessment_instrument", [
  "synapse_baseline", // our short in-app battery (MMSE/MoCA-inspired, not diagnostic)
  "mmse",
  "moca",
]);

export const reminderKind = pgEnum("reminder_kind", [
  "medicine",
  "hydration",
  "activity",
  "appointment",
]);

export const reminderStatus = pgEnum("reminder_status", [
  "pending",
  "done",
  "missed",
  "snoozed",
]);

export const alertKind = pgEnum("alert_kind", [
  "missed_medication",
  "cognitive_decline",
  "low_engagement",
  "sos",
]);

export const alertSeverity = pgEnum("alert_severity", [
  "info",
  "warning",
  "critical",
]);

export const alertStatus = pgEnum("alert_status", [
  "open",
  "acknowledged",
  "resolved",
]);

/* ------------------------------------------------------------------ */
/* People                                                             */
/* ------------------------------------------------------------------ */

export const clinicians = pgTable("clinicians", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  facility: text("facility"), // PHC / CHC / hospital
  region: text("region"), // NER state
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const caregivers = pgTable("caregivers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  relationship: text("relationship"), // son, daughter, spouse...
  phone: text("phone"),
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const patients = pgTable("patients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ageYears: integer("age_years"),
  sex: text("sex"),
  /** Preferred language code, e.g. "as" (Assamese), "bn", "ne", "kha", "mni". */
  language: text("language").notNull().default("as"),
  /** NER state / district for context and reporting. */
  region: text("region"),
  cognitiveStage: cognitiveStage("cognitive_stage").notNull().default("mild"),
  primaryClinicianId: uuid("primary_clinician_id").references(() => clinicians.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Many-to-many: a patient can have several family caregivers. */
export const patientCaregivers = pgTable(
  "patient_caregivers",
  {
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    caregiverId: uuid("caregiver_id")
      .notNull()
      .references(() => caregivers.id, { onDelete: "cascade" }),
    isPrimary: boolean("is_primary").notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.patientId, t.caregiverId] })],
);

/* ------------------------------------------------------------------ */
/* Cognitive assessment & gameplay                                     */
/* ------------------------------------------------------------------ */

export const baselineAssessments = pgTable("baseline_assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  instrument: assessmentInstrument("instrument").notNull().default("synapse_baseline"),
  totalScore: integer("total_score").notNull(),
  maxScore: integer("max_score").notNull().default(30),
  band: cognitiveStage("band").notNull(),
  assessedAt: timestamp("assessed_at", { withTimezone: true }).defaultNow().notNull(),
});

/** One completed cognitive-game round. Feeds adaptive difficulty + trends. */
export const gameSessions = pgTable("game_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  /** Stable game identifier, e.g. "memory_lane", "market_basket". */
  gameKey: text("game_key").notNull(),
  domain: cognitiveDomain("domain").notNull(),
  /** Difficulty level the round was played at (1 = easiest ... 10 = hardest). */
  difficulty: integer("difficulty").notNull().default(1),
  /** Fraction of correct responses, 0..1. */
  accuracy: real("accuracy").notNull(),
  /** Mean response latency in milliseconds. */
  reactionTimeMs: integer("reaction_time_ms"),
  hintsUsed: integer("hints_used").notNull().default(0),
  roundsCompleted: integer("rounds_completed").notNull().default(0),
  completed: boolean("completed").notNull().default(true),
  /** 0..100 friendly score (never shown to the patient). */
  score: integer("score").notNull().default(0),
  playedAt: timestamp("played_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Daily / weekly rolled-up score per cognitive domain (0..100).
 * This is the series the decline-detection algorithm and the clinician
 * trend charts read from.
 */
export const cognitiveScores = pgTable("cognitive_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  domain: cognitiveDomain("domain").notNull(),
  score: integer("score").notNull(), // 0..100
  source: text("source").notNull().default("rollup"), // "rollup" | "assessment"
  recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/* Reminders & memory assistance                                       */
/* ------------------------------------------------------------------ */

export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  kind: reminderKind("kind").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  /** Local trigger times, "HH:MM" 24h. Scheduled on-device, no server push. */
  timesOfDay: text("times_of_day").array().notNull().default([]),
  /** Days of week (0 = Sun .. 6 = Sat). Empty array = every day. */
  daysOfWeek: integer("days_of_week").array().notNull().default([]),
  medicinePhotoUrl: text("medicine_photo_url"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reminderLogs = pgTable("reminder_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  reminderId: uuid("reminder_id")
    .notNull()
    .references(() => reminders.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
  status: reminderStatus("status").notNull().default("pending"),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** "Who is this?" — family faces, names, relationships and voice clips. */
export const familyContacts = pgTable("family_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  relationship: text("relationship").notNull(),
  photoUrl: text("photo_url"),
  voiceClipUrl: text("voice_clip_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ------------------------------------------------------------------ */
/* Alerts (caregiver + clinician monitoring)                           */
/* ------------------------------------------------------------------ */

export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  kind: alertKind("kind").notNull(),
  severity: alertSeverity("severity").notNull().default("warning"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  status: alertStatus("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  acknowledgedBy: text("acknowledged_by"),
});

/* ------------------------------------------------------------------ */
/* Inferred types                                                      */
/* ------------------------------------------------------------------ */

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
export type GameSession = typeof gameSessions.$inferSelect;
export type NewGameSession = typeof gameSessions.$inferInsert;
export type Reminder = typeof reminders.$inferSelect;
export type ReminderLog = typeof reminderLogs.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type FamilyContact = typeof familyContacts.$inferSelect;
export type CognitiveScore = typeof cognitiveScores.$inferSelect;
