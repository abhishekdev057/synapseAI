import { and, desc, eq, gte, sql } from "drizzle-orm";
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
import { nextDifficulty, roundScore, type RoundResult, type Stage } from "@/lib/adaptive";
import { detectDecline, type ScorePoint } from "@/lib/decline";
import { DOMAIN_LIST, DOMAINS, type DomainKey } from "@/lib/cognitive-domains";

/* ------------------------------------------------------------------ */
/* Patients                                                            */
/* ------------------------------------------------------------------ */

export async function getPatient(id: string) {
  const [row] = await db.select().from(patients).where(eq(patients.id, id));
  if (!row) return null;

  const clin = row.primaryClinicianId
    ? (await db.select().from(clinicians).where(eq(clinicians.id, row.primaryClinicianId)))[0]
    : null;

  const cgs = await db
    .select({
      id: caregivers.id,
      name: caregivers.name,
      relationship: caregivers.relationship,
      phone: caregivers.phone,
      isPrimary: patientCaregivers.isPrimary,
    })
    .from(patientCaregivers)
    .innerJoin(caregivers, eq(caregivers.id, patientCaregivers.caregiverId))
    .where(eq(patientCaregivers.patientId, id));

  const [baseline] = await db
    .select()
    .from(baselineAssessments)
    .where(eq(baselineAssessments.patientId, id))
    .orderBy(desc(baselineAssessments.assessedAt))
    .limit(1);

  return { ...row, clinician: clin ?? null, caregivers: cgs, baseline: baseline ?? null };
}

export interface PatientStatus {
  id: string;
  name: string;
  ageYears: number | null;
  region: string | null;
  language: string;
  cognitiveStage: string;
  /** green = fine, amber = watch, red = needs attention. */
  status: "green" | "amber" | "red";
  openAlerts: number;
  criticalAlerts: number;
  sessionsLast7d: number;
  worstDomain: { domain: DomainKey; label: string; summary: string } | null;
}

/** Clinician list view: every patient with a computed traffic-light status. */
export async function listPatientsWithStatus(): Promise<PatientStatus[]> {
  const all = await db.select().from(patients).orderBy(patients.name);
  const since = new Date(Date.now() - 7 * 864e5);

  const out: PatientStatus[] = [];
  for (const p of all) {
    const openAlertRows = await db
      .select({ severity: alerts.severity })
      .from(alerts)
      .where(and(eq(alerts.patientId, p.id), eq(alerts.status, "open")));

    const [{ count: sessions7 }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(gameSessions)
      .where(and(eq(gameSessions.patientId, p.id), gte(gameSessions.playedAt, since)));

    const trends = await getDomainTrends(p.id);
    const declining = trends.filter((t) => t.decline.status === "declining");
    declining.sort((a, b) => a.decline.levelShift - b.decline.levelShift);

    const critical = openAlertRows.filter((a) => a.severity === "critical").length;
    let status: PatientStatus["status"] = "green";
    if (critical > 0 || declining.some((d) => d.decline.severity === "critical")) {
      status = "red";
    } else if (openAlertRows.length > 0 || declining.length > 0 || sessions7 === 0) {
      status = "amber";
    }

    out.push({
      id: p.id,
      name: p.name,
      ageYears: p.ageYears,
      region: p.region,
      language: p.language,
      cognitiveStage: p.cognitiveStage,
      status,
      openAlerts: openAlertRows.length,
      criticalAlerts: critical,
      sessionsLast7d: sessions7,
      worstDomain: declining[0]
        ? {
            domain: declining[0].domain,
            label: DOMAINS[declining[0].domain].label,
            summary: declining[0].decline.summary,
          }
        : null,
    });
  }

  // Red first, then amber, then green.
  const rank = { red: 0, amber: 1, green: 2 } as const;
  out.sort((a, b) => rank[a.status] - rank[b.status] || a.name.localeCompare(b.name));
  return out;
}

/* ------------------------------------------------------------------ */
/* Cognitive trends                                                    */
/* ------------------------------------------------------------------ */

export interface DomainTrend {
  domain: DomainKey;
  label: string;
  series: { date: string; score: number }[];
  decline: ReturnType<typeof detectDecline>;
}

export async function getDomainTrends(patientId: string): Promise<DomainTrend[]> {
  const rows = await db
    .select()
    .from(cognitiveScores)
    .where(eq(cognitiveScores.patientId, patientId))
    .orderBy(cognitiveScores.recordedAt);

  return DOMAIN_LIST.map((meta) => {
    const domainRows = rows.filter((r) => r.domain === meta.key);
    const series = domainRows.map((r) => ({
      date: r.recordedAt.toISOString(),
      score: r.score,
    }));
    const points: ScorePoint[] = domainRows.map((r) => ({
      recordedAt: r.recordedAt,
      score: r.score,
    }));
    return {
      domain: meta.key,
      label: meta.label,
      series,
      decline: detectDecline(points, meta.label.toLowerCase()),
    };
  });
}

/* ------------------------------------------------------------------ */
/* Game sessions + adaptive difficulty                                 */
/* ------------------------------------------------------------------ */

export async function getRecentSessions(patientId: string, gameKey?: string, limit = 20) {
  const where = gameKey
    ? and(eq(gameSessions.patientId, patientId), eq(gameSessions.gameKey, gameKey))
    : eq(gameSessions.patientId, patientId);
  return db
    .select()
    .from(gameSessions)
    .where(where)
    .orderBy(desc(gameSessions.playedAt))
    .limit(limit);
}

/** Recommend the difficulty for the patient's next round of a given game. */
export async function recommendDifficulty(patientId: string, gameKey: string) {
  const recent = await getRecentSessions(patientId, gameKey, 5);
  const [p] = await db.select().from(patients).where(eq(patients.id, patientId));
  const rounds: RoundResult[] = recent.map((s) => ({
    accuracy: s.accuracy,
    difficulty: s.difficulty,
    hintsUsed: s.hintsUsed,
    reactionTimeMs: s.reactionTimeMs ?? undefined,
    playedAt: s.playedAt,
  }));
  return nextDifficulty(rounds, { stage: (p?.cognitiveStage ?? "mild") as Stage });
}

interface RecordSessionInput {
  patientId: string;
  gameKey: string;
  domain: DomainKey;
  difficulty: number;
  accuracy: number;
  reactionTimeMs?: number;
  hintsUsed?: number;
  roundsCompleted?: number;
  completed?: boolean;
}

/**
 * Persist a completed round, refresh today's domain rollup, and return the
 * recommended difficulty for the next round.
 */
export async function recordSession(input: RecordSessionInput) {
  const score = roundScore({
    accuracy: input.accuracy,
    difficulty: input.difficulty,
    hintsUsed: input.hintsUsed,
  });

  const [session] = await db
    .insert(gameSessions)
    .values({
      patientId: input.patientId,
      gameKey: input.gameKey,
      domain: input.domain,
      difficulty: input.difficulty,
      accuracy: input.accuracy,
      reactionTimeMs: input.reactionTimeMs,
      hintsUsed: input.hintsUsed ?? 0,
      roundsCompleted: input.roundsCompleted ?? 0,
      completed: input.completed ?? true,
      score,
    })
    .returning();

  await refreshDailyRollup(input.patientId, input.domain);
  const adaptive = await recommendDifficulty(input.patientId, input.gameKey);

  return { session, score, adaptive };
}

/**
 * Recompute the rolled-up 0–100 score for one patient+domain for "today"
 * from that day's game rounds, and upsert a single cognitive_scores row.
 */
async function refreshDailyRollup(patientId: string, domain: DomainKey) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todays = await db
    .select({ score: gameSessions.score })
    .from(gameSessions)
    .where(
      and(
        eq(gameSessions.patientId, patientId),
        eq(gameSessions.domain, domain),
        gte(gameSessions.playedAt, startOfDay),
      ),
    );
  if (todays.length === 0) return;

  const avg = Math.round(todays.reduce((a, r) => a + r.score, 0) / todays.length);

  const [existing] = await db
    .select()
    .from(cognitiveScores)
    .where(
      and(
        eq(cognitiveScores.patientId, patientId),
        eq(cognitiveScores.domain, domain),
        gte(cognitiveScores.recordedAt, startOfDay),
        eq(cognitiveScores.source, "rollup"),
      ),
    );

  if (existing) {
    await db
      .update(cognitiveScores)
      .set({ score: avg, recordedAt: new Date() })
      .where(eq(cognitiveScores.id, existing.id));
  } else {
    await db.insert(cognitiveScores).values({
      patientId,
      domain,
      score: avg,
      source: "rollup",
    });
  }
}

/* ------------------------------------------------------------------ */
/* Reminders                                                           */
/* ------------------------------------------------------------------ */

export async function listReminders(patientId: string) {
  return db
    .select()
    .from(reminders)
    .where(eq(reminders.patientId, patientId))
    .orderBy(reminders.kind, reminders.title);
}

/** Today's reminder occurrences with their current log status. */
export async function getTodayReminders(patientId: string) {
  const rows = await db
    .select()
    .from(reminders)
    .where(and(eq(reminders.patientId, patientId), eq(reminders.active, true)));

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const dow = new Date().getDay();

  const logsToday = await db
    .select()
    .from(reminderLogs)
    .where(
      and(
        eq(reminderLogs.patientId, patientId),
        gte(reminderLogs.scheduledFor, startOfDay),
      ),
    );

  const occurrences: {
    reminderId: string;
    kind: string;
    title: string;
    description: string | null;
    medicinePhotoUrl: string | null;
    time: string;
    scheduledFor: string;
    status: string;
    logId: string | null;
  }[] = [];

  for (const r of rows) {
    if (r.daysOfWeek.length > 0 && !r.daysOfWeek.includes(dow)) continue;
    for (const time of r.timesOfDay) {
      const [h, m] = time.split(":").map(Number);
      const scheduledFor = new Date(startOfDay);
      scheduledFor.setHours(h, m, 0, 0);
      const log = logsToday.find(
        (l) =>
          l.reminderId === r.id &&
          Math.abs(new Date(l.scheduledFor).getTime() - scheduledFor.getTime()) < 60_000,
      );
      occurrences.push({
        reminderId: r.id,
        kind: r.kind,
        title: r.title,
        description: r.description,
        medicinePhotoUrl: r.medicinePhotoUrl,
        time,
        scheduledFor: scheduledFor.toISOString(),
        status: log?.status ?? "pending",
        logId: log?.id ?? null,
      });
    }
  }

  occurrences.sort((a, b) => a.time.localeCompare(b.time));
  return occurrences;
}

export async function logReminder(
  reminderId: string,
  patientId: string,
  status: "done" | "missed" | "snoozed",
  scheduledFor: Date,
) {
  const [existing] = await db
    .select()
    .from(reminderLogs)
    .where(
      and(
        eq(reminderLogs.reminderId, reminderId),
        eq(reminderLogs.scheduledFor, scheduledFor),
      ),
    );

  if (existing) {
    const [updated] = await db
      .update(reminderLogs)
      .set({ status, respondedAt: new Date() })
      .where(eq(reminderLogs.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(reminderLogs)
    .values({
      reminderId,
      patientId,
      scheduledFor,
      status,
      respondedAt: new Date(),
    })
    .returning();
  return created;
}

/** Game-session counts for the last 7 and 30 days. */
export async function getEngagement(patientId: string) {
  const d7 = new Date(Date.now() - 7 * 864e5);
  const d30 = new Date(Date.now() - 30 * 864e5);
  const [{ count: last7 }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(gameSessions)
    .where(and(eq(gameSessions.patientId, patientId), gte(gameSessions.playedAt, d7)));
  const [{ count: last30 }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(gameSessions)
    .where(and(eq(gameSessions.patientId, patientId), gte(gameSessions.playedAt, d30)));
  const [{ v: lastPlayed }] = await db
    .select({ v: sql<string | null>`max(${gameSessions.playedAt})` })
    .from(gameSessions)
    .where(eq(gameSessions.patientId, patientId));
  return { last7, last30, lastPlayed };
}

/** Simple 14-day adherence percentage across all reminder kinds. */
export async function getAdherence(patientId: string) {
  const since = new Date(Date.now() - 14 * 864e5);
  const logs = await db
    .select({ status: reminderLogs.status })
    .from(reminderLogs)
    .where(
      and(eq(reminderLogs.patientId, patientId), gte(reminderLogs.scheduledFor, since)),
    );
  const total = logs.length;
  const done = logs.filter((l) => l.status === "done").length;
  const missed = logs.filter((l) => l.status === "missed").length;
  return {
    total,
    done,
    missed,
    rate: total === 0 ? null : Math.round((done / total) * 100),
  };
}

/* ------------------------------------------------------------------ */
/* Alerts                                                              */
/* ------------------------------------------------------------------ */

export async function listAlerts(patientId: string) {
  return db
    .select()
    .from(alerts)
    .where(eq(alerts.patientId, patientId))
    .orderBy(desc(alerts.createdAt));
}

export async function updateAlert(
  id: string,
  status: "open" | "acknowledged" | "resolved",
  by?: string,
) {
  const [row] = await db
    .update(alerts)
    .set({
      status,
      acknowledgedAt: status === "open" ? null : new Date(),
      acknowledgedBy: by ?? null,
    })
    .where(eq(alerts.id, id))
    .returning();
  return row;
}

/* ------------------------------------------------------------------ */
/* Family contacts ("Who is this?")                                    */
/* ------------------------------------------------------------------ */

export async function listContacts(patientId: string) {
  return db
    .select()
    .from(familyContacts)
    .where(eq(familyContacts.patientId, patientId))
    .orderBy(familyContacts.name);
}

export async function addContact(input: {
  patientId: string;
  name: string;
  relationship: string;
  photoUrl?: string;
  voiceClipUrl?: string;
  notes?: string;
}) {
  const [row] = await db.insert(familyContacts).values(input).returning();
  return row;
}
