package com.sigmafusion.synapse.data.remote

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/* Response envelopes + payloads matching the Next.js API under /api. */

@Serializable
data class PatientListResponse(val patients: List<PatientSummaryDto> = emptyList())

@Serializable
data class PatientSummaryDto(
    val id: String,
    val name: String,
    val ageYears: Int? = null,
    val region: String? = null,
    val language: String = "as",
    val cognitiveStage: String = "mild",
)

@Serializable
data class PatientEnvelope(val patient: PatientDto)

@Serializable
data class PatientDto(
    val id: String,
    val name: String,
    val ageYears: Int? = null,
    val sex: String? = null,
    val language: String = "as",
    val region: String? = null,
    val cognitiveStage: String = "mild",
)

@Serializable
data class RemindersResponse(val reminders: List<ReminderDto> = emptyList())

@Serializable
data class ReminderDto(
    val id: String,
    val patientId: String,
    val kind: String,
    val title: String,
    val description: String? = null,
    val timesOfDay: List<String> = emptyList(),
    val daysOfWeek: List<Int> = emptyList(),
    val medicinePhotoUrl: String? = null,
    val active: Boolean = true,
)

@Serializable
data class TodayResponse(val occurrences: List<OccurrenceDto> = emptyList())

@Serializable
data class OccurrenceDto(
    val reminderId: String,
    val kind: String,
    val title: String,
    val description: String? = null,
    val medicinePhotoUrl: String? = null,
    val time: String,
    val scheduledFor: String,
    val status: String,
    val logId: String? = null,
)

@Serializable
data class ContactsResponse(val contacts: List<ContactDto> = emptyList())

@Serializable
data class ContactDto(
    val id: String,
    val patientId: String,
    val name: String,
    val relationship: String,
    val photoUrl: String? = null,
    val voiceClipUrl: String? = null,
    val notes: String? = null,
)

@Serializable
data class NextDifficultyDto(
    val game: String? = null,
    val next: Int,
    val reason: String,
    val effectiveAccuracy: Double = 0.0,
)

@Serializable
data class SessionCreateDto(
    val gameKey: String,
    val domain: String,
    val difficulty: Int,
    val accuracy: Double,
    val reactionTimeMs: Int? = null,
    val hintsUsed: Int? = null,
    val roundsCompleted: Int? = null,
    val completed: Boolean? = true,
)

@Serializable
data class SessionCreateResponse(
    val session: SessionRowDto? = null,
    val score: Int = 0,
    val adaptive: NextDifficultyDto,
)

@Serializable
data class SessionRowDto(val id: String)

@Serializable
data class ReminderLogCreateDto(
    val patientId: String,
    val status: String,
    val scheduledFor: String,
)

@Serializable
data class ReminderLogResponse(val log: ReminderLogRowDto? = null)

@Serializable
data class ReminderLogRowDto(
    val id: String,
    @SerialName("status") val status: String = "done",
)
