@file:OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)

package com.sigmafusion.synapse.data

import android.content.Context
import com.sigmafusion.synapse.BuildConfig
import com.sigmafusion.synapse.core.TimeUtils
import com.sigmafusion.synapse.data.local.FamilyContactEntity
import com.sigmafusion.synapse.data.local.GameSessionEntity
import com.sigmafusion.synapse.data.local.PatientEntity
import com.sigmafusion.synapse.data.local.ReminderEntity
import com.sigmafusion.synapse.data.local.ReminderLogEntity
import com.sigmafusion.synapse.data.local.SettingsStore
import com.sigmafusion.synapse.data.local.SynapseDatabase
import com.sigmafusion.synapse.data.remote.ApiProvider
import com.sigmafusion.synapse.data.remote.ReminderLogCreateDto
import com.sigmafusion.synapse.data.remote.SessionCreateDto
import com.sigmafusion.synapse.data.sync.SyncScheduler
import com.sigmafusion.synapse.domain.AdaptiveDifficulty
import com.sigmafusion.synapse.domain.FamilyMember
import com.sigmafusion.synapse.domain.PatientProfile
import com.sigmafusion.synapse.domain.ReminderOccurrence
import com.sigmafusion.synapse.domain.ReminderStatus
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import java.util.UUID

/**
 * The single source of truth for the patient app. Reads always come from Room
 * (so the UI works fully offline); writes go to Room immediately and are queued
 * for the next sync with the server at [BuildConfig.DEFAULT_BASE_URL].
 */
class SynapseRepository(
    private val appContext: Context,
    private val db: SynapseDatabase,
    private val api: ApiProvider,
    private val settings: SettingsStore,
) {
    private val patientIdFlow: Flow<String?> = settings.patientId

    val patient: Flow<PatientProfile?> =
        patientIdFlow.flatMapLatest { id ->
            if (id == null) flowOf(null)
            else db.patientDao().observe(id).map { it?.toProfile() }
        }

    val languageTag: Flow<String> = settings.language.map {
        com.sigmafusion.synapse.domain.speechTagFor(it)
    }

    val languageCode: Flow<String> = settings.language
    val ttsEnabled: Flow<Boolean> = settings.ttsEnabled
    val baseUrl: Flow<String> = settings.baseUrl
    val patientName: Flow<String?> = settings.patientName
    val lastSync: Flow<Long> = settings.lastSync

    suspend fun setLanguage(code: String) = settings.setLanguage(code)
    suspend fun setTtsEnabled(enabled: Boolean) = settings.setTtsEnabled(enabled)
    suspend fun setBaseUrl(url: String) {
        settings.setBaseUrl(url)
        api.rebuild(if (url.endsWith("/")) url else "$url/")
    }

    /** Today's reminder occurrences, computed on-device so "Done" shows instantly. */
    val todayReminders: Flow<List<ReminderOccurrence>> =
        patientIdFlow.flatMapLatest { id ->
            if (id == null) return@flatMapLatest flowOf(emptyList())
            val dayStart = TimeUtils.todayStartEpoch()
            combine(
                db.reminderDao().observeActive(id),
                db.reminderLogDao().observeSince(id, dayStart),
            ) { reminders, logs ->
                val dow = TimeUtils.todayDowSundayZero()
                reminders
                    .filter { it.daysOfWeek.isEmpty() || it.daysOfWeek.contains(dow) }
                    .flatMap { r ->
                        r.timesOfDay.map { hhmm ->
                            val epoch = TimeUtils.atTimeTodayEpoch(hhmm)
                            val log = logs.firstOrNull {
                                it.reminderId == r.id &&
                                    kotlin.math.abs(it.scheduledForEpoch - epoch) < 60_000
                            }
                            ReminderOccurrence(
                                reminderId = r.id,
                                kind = r.kind,
                                title = r.title,
                                description = r.description,
                                medicinePhotoUrl = r.medicinePhotoUrl,
                                timeLabel = TimeUtils.formatClockTime(epoch),
                                scheduledForEpoch = epoch,
                                status = ReminderStatus.fromWire(log?.status ?: "pending"),
                            )
                        }
                    }
                    .sortedBy { it.scheduledForEpoch }
            }
        }

    val contacts: Flow<List<FamilyMember>> =
        patientIdFlow.flatMapLatest { id ->
            if (id == null) flowOf(emptyList())
            else db.contactDao().observe(id).map { list -> list.map { it.toMember() } }
        }

    fun gamesPlayedSince(fromEpoch: Long): Flow<Int> =
        patientIdFlow.flatMapLatest { id ->
            if (id == null) flowOf(0) else db.gameSessionDao().countSince(id, fromEpoch)
        }

    /* ---- writes -------------------------------------------------- */

    suspend fun markReminder(occ: ReminderOccurrence, status: ReminderStatus) {
        val patientId = patientIdFlow.first() ?: return
        val existing = db.reminderLogDao().find(occ.reminderId, occ.scheduledForEpoch)
        db.reminderLogDao().upsert(
            ReminderLogEntity(
                localId = existing?.localId ?: UUID.randomUUID().toString(),
                remoteId = existing?.remoteId,
                reminderId = occ.reminderId,
                patientId = patientId,
                scheduledForEpoch = occ.scheduledForEpoch,
                status = status.wire,
                respondedAtEpoch = TimeUtils.now(),
                synced = false,
            ),
        )
        SyncScheduler.syncNow(appContext)
    }

    data class RoundInput(
        val gameKey: String,
        val domain: String,
        val difficulty: Int,
        val accuracy: Double,
        val reactionTimeMs: Int?,
        val hintsUsed: Int,
        val roundsCompleted: Int,
    )

    suspend fun recordRound(input: RoundInput): AdaptiveDifficulty.Decision {
        val patientId = patientIdFlow.first() ?: return AdaptiveDifficulty.nextDifficulty(emptyList())
        val score = AdaptiveDifficulty.roundScore(
            AdaptiveDifficulty.Round(input.accuracy, input.difficulty, input.hintsUsed),
        )
        db.gameSessionDao().insert(
            GameSessionEntity(
                localId = UUID.randomUUID().toString(),
                remoteId = null,
                patientId = patientId,
                gameKey = input.gameKey,
                domain = input.domain,
                difficulty = input.difficulty,
                accuracy = input.accuracy,
                reactionTimeMs = input.reactionTimeMs,
                hintsUsed = input.hintsUsed,
                roundsCompleted = input.roundsCompleted,
                score = score,
                playedAtEpoch = TimeUtils.now(),
                synced = false,
            ),
        )
        SyncScheduler.syncNow(appContext)
        return recommendDifficulty(input.gameKey)
    }

    suspend fun recommendDifficulty(gameKey: String): AdaptiveDifficulty.Decision {
        val patientId = patientIdFlow.first()
            ?: return AdaptiveDifficulty.nextDifficulty(emptyList())
        val stage = db.patientDao().get(patientId)?.cognitiveStage ?: "mild"
        val rounds = db.gameSessionDao().recentForGame(patientId, gameKey, 5).map {
            AdaptiveDifficulty.Round(
                accuracy = it.accuracy,
                difficulty = it.difficulty,
                hintsUsed = it.hintsUsed,
                playedAtEpochMs = it.playedAtEpoch,
            )
        }
        return AdaptiveDifficulty.nextDifficulty(rounds, stage)
    }

    /* ---- sync -------------------------------------------------- */

    /**
     * Delta sync: pull patient + reminders + contacts, push every queued
     * reminder-log and game-session, then stamp the sync time. Each remote
     * call is best-effort so a flaky link still makes progress.
     */
    suspend fun sync(): Result<Unit> = runCatching {
        api.rebuild(settings.baseUrl.first())

        var patientId = patientIdFlow.first()
        if (patientId == null) {
            patientId = runCatching {
                val list = api.api.getPatients().patients
                (list.firstOrNull { it.name == BuildConfig.DEMO_PATIENT_NAME }
                    ?: list.firstOrNull())
                    ?.also { settings.setPatient(it.id, it.name); settings.setLanguage(it.language) }
                    ?.id
            }.getOrNull()
        }

        if (patientId == null) {
            seedLocalSampleIfEmpty()
            return@runCatching
        }

        // Pull
        runCatching {
            val p = api.api.getPatient(patientId).patient
            db.patientDao().upsert(
                PatientEntity(p.id, p.name, p.ageYears, p.language, p.region, p.cognitiveStage),
            )
        }
        runCatching {
            val reminders = api.api.getReminders(patientId).reminders
            db.reminderDao().clearFor(patientId)
            db.reminderDao().upsertAll(
                reminders.map {
                    ReminderEntity(
                        id = it.id,
                        patientId = it.patientId,
                        kind = it.kind,
                        title = it.title,
                        description = it.description,
                        timesOfDayCsv = it.timesOfDay.joinToString(","),
                        daysOfWeekCsv = it.daysOfWeek.joinToString(","),
                        medicinePhotoUrl = it.medicinePhotoUrl,
                        active = it.active,
                    )
                },
            )
        }
        runCatching {
            val contacts = api.api.getContacts(patientId).contacts
            db.contactDao().clearFor(patientId)
            db.contactDao().upsertAll(
                contacts.map {
                    FamilyContactEntity(
                        it.id, it.patientId, it.name, it.relationship,
                        it.photoUrl, it.voiceClipUrl, it.notes,
                    )
                },
            )
        }

        // Push queued writes
        for (log in db.reminderLogDao().unsynced()) {
            runCatching {
                val resp = api.api.postReminderLog(
                    log.reminderId,
                    ReminderLogCreateDto(
                        patientId = log.patientId,
                        status = log.status,
                        scheduledFor = TimeUtils.epochToIso(log.scheduledForEpoch),
                    ),
                )
                db.reminderLogDao().markSynced(log.localId, resp.log?.id)
            }
        }
        for (s in db.gameSessionDao().unsynced()) {
            runCatching {
                val resp = api.api.postSession(
                    s.patientId,
                    SessionCreateDto(
                        gameKey = s.gameKey,
                        domain = s.domain,
                        difficulty = s.difficulty,
                        accuracy = s.accuracy,
                        reactionTimeMs = s.reactionTimeMs,
                        hintsUsed = s.hintsUsed,
                        roundsCompleted = s.roundsCompleted,
                        completed = true,
                    ),
                )
                db.gameSessionDao().markSynced(s.localId, resp.session?.id)
            }
        }

        settings.setLastSync(TimeUtils.now())
    }

    /** Never let the app be blank offline: a small bundled sample. */
    suspend fun seedLocalSampleIfEmpty() {
        if (db.patientDao().count() > 0) return
        val id = "local-demo"
        settings.setPatient(id, BuildConfig.DEMO_PATIENT_NAME)
        settings.setLanguage("as")
        db.patientDao().upsert(
            PatientEntity(id, BuildConfig.DEMO_PATIENT_NAME, 78, "as", "Jorhat, Assam", "moderate"),
        )
        db.reminderDao().upsertAll(
            listOf(
                sampleReminder(id, "r1", "medicine", "White tablet (Donepezil)", "Take with water after breakfast.", "07:30"),
                sampleReminder(id, "r2", "medicine", "Evening tablet", "After dinner.", "19:30"),
                sampleReminder(id, "r3", "hydration", "Drink a glass of water", null, "10:30,15:00"),
                sampleReminder(id, "r4", "activity", "Afternoon walk in the courtyard", null, "16:00"),
            ),
        )
        db.contactDao().upsertAll(
            listOf(
                FamilyContactEntity("c1", id, "Anjali", "Daughter", null, null, "Lives next door. Visits every morning."),
                FamilyContactEntity("c2", id, "Rton", "Grandson", null, null, "Studies in Guwahati. Calls on Sundays."),
                FamilyContactEntity("c3", id, "Bhola", "Late husband", null, null, "Was a schoolteacher in Jorhat."),
            ),
        )
    }

    private fun sampleReminder(
        patientId: String, id: String, kind: String, title: String,
        description: String?, timesCsv: String,
    ) = ReminderEntity(id, patientId, kind, title, description, timesCsv, "", null, true)

    /* ---- mappers ---------------------------------------------- */

    private fun PatientEntity.toProfile() = PatientProfile(
        id = id,
        name = name,
        firstName = name.substringBefore(' '),
        ageYears = ageYears,
        region = region,
        language = language,
        cognitiveStage = cognitiveStage,
    )

    private fun FamilyContactEntity.toMember() =
        FamilyMember(id, name, relationship, photoUrl, notes)
}
