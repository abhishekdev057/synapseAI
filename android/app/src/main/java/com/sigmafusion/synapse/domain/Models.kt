package com.sigmafusion.synapse.domain

/** UI-facing models (mapped from Room entities / DTOs). */

data class PatientProfile(
    val id: String,
    val name: String,
    val firstName: String,
    val ageYears: Int?,
    val region: String?,
    val language: String,
    val cognitiveStage: String,
)

enum class ReminderStatus { PENDING, DONE, MISSED, SNOOZED;
    companion object {
        fun fromWire(v: String) = when (v.lowercase()) {
            "done" -> DONE
            "missed" -> MISSED
            "snoozed" -> SNOOZED
            else -> PENDING
        }
    }
    val wire: String get() = name.lowercase()
}

data class ReminderOccurrence(
    val reminderId: String,
    val kind: String,
    val title: String,
    val description: String?,
    val medicinePhotoUrl: String?,
    val timeLabel: String,
    val scheduledForEpoch: Long,
    val status: ReminderStatus,
) {
    val emoji: String
        get() = when (kind) {
            "medicine" -> "💊"
            "hydration" -> "💧"
            "activity" -> "🚶"
            "appointment" -> "🏥"
            else -> "🔔"
        }
}

data class FamilyMember(
    val id: String,
    val name: String,
    val relationship: String,
    val photoUrl: String?,
    val notes: String?,
)

data class SyncStatus(
    val lastSyncEpoch: Long,
    val syncing: Boolean,
    val lastError: String? = null,
)
