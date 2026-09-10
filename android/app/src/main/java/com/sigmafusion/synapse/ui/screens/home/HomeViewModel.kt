package com.sigmafusion.synapse.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sigmafusion.synapse.data.SynapseRepository
import com.sigmafusion.synapse.domain.ReminderStatus
import com.sigmafusion.synapse.domain.speechTagFor
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn

data class HomeUiState(
    val firstName: String = "",
    val speechTag: String = "en-IN",
    val ttsEnabled: Boolean = true,
    val nextReminderTitle: String? = null,
    val nextReminderTime: String? = null,
)

class HomeViewModel(repo: SynapseRepository) : ViewModel() {

    val state: StateFlow<HomeUiState> =
        combine(
            repo.patient,
            repo.todayReminders,
            repo.languageCode,
            repo.ttsEnabled,
        ) { patient, reminders, langCode, tts ->
            val next = reminders.firstOrNull { it.status == ReminderStatus.PENDING }
            HomeUiState(
                firstName = patient?.firstName.orEmpty(),
                speechTag = speechTagFor(langCode),
                ttsEnabled = tts,
                nextReminderTitle = next?.title,
                nextReminderTime = next?.timeLabel,
            )
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), HomeUiState())
}
