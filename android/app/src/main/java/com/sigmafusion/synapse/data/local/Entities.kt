package com.sigmafusion.synapse.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "patient")
data class PatientEntity(
    @PrimaryKey val id: String,
    val name: String,
    val ageYears: Int?,
    val language: String,
    val region: String?,
    val cognitiveStage: String,
)

@Entity(tableName = "reminder")
data class ReminderEntity(
    @PrimaryKey val id: String,
    val patientId: String,
    val kind: String, // medicine | hydration | activity | appointment
    val title: String,
    val description: String?,
    /** "HH:mm" values joined by ','. */
    val timesOfDayCsv: String,
    /** ints 0..6 joined by ','; empty = every day. */
    val daysOfWeekCsv: String,
    val medicinePhotoUrl: String?,
    val active: Boolean,
) {
    val timesOfDay: List<String>
        get() = timesOfDayCsv.split(',').map { it.trim() }.filter { it.isNotEmpty() }
    val daysOfWeek: List<Int>
        get() = daysOfWeekCsv.split(',').mapNotNull { it.trim().toIntOrNull() }
}

@Entity(tableName = "reminder_log")
data class ReminderLogEntity(
    @PrimaryKey val localId: String,
    val remoteId: String?,
    val reminderId: String,
    val patientId: String,
    val scheduledForEpoch: Long,
    val status: String, // pending | done | missed | snoozed
    val respondedAtEpoch: Long?,
    val synced: Boolean,
)

@Entity(tableName = "game_session")
data class GameSessionEntity(
    @PrimaryKey val localId: String,
    val remoteId: String?,
    val patientId: String,
    val gameKey: String,
    val domain: String,
    val difficulty: Int,
    val accuracy: Double,
    val reactionTimeMs: Int?,
    val hintsUsed: Int,
    val roundsCompleted: Int,
    val score: Int,
    val playedAtEpoch: Long,
    val synced: Boolean,
)

@Entity(tableName = "family_contact")
data class FamilyContactEntity(
    @PrimaryKey val id: String,
    val patientId: String,
    val name: String,
    val relationship: String,
    val photoUrl: String?,
    val voiceClipUrl: String?,
    val notes: String?,
)
