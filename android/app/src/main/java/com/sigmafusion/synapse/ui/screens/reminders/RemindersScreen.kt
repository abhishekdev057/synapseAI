package com.sigmafusion.synapse.ui.screens.reminders

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.sigmafusion.synapse.data.SynapseRepository
import com.sigmafusion.synapse.domain.ReminderOccurrence
import com.sigmafusion.synapse.domain.ReminderStatus
import com.sigmafusion.synapse.ui.components.EmptyBlock
import com.sigmafusion.synapse.ui.components.PrimaryButton
import com.sigmafusion.synapse.ui.components.ScreenColumn
import com.sigmafusion.synapse.ui.i18n.LocalStrings
import com.sigmafusion.synapse.ui.screens.synapseViewModel
import com.sigmafusion.synapse.ui.theme.Dimens
import com.sigmafusion.synapse.ui.voice.SpeakButton
import com.sigmafusion.synapse.ui.voice.rememberSpeaker
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class RemindersUi(
    val occurrences: List<ReminderOccurrence> = emptyList(),
    val speechTag: String = "en-IN",
    val loading: Boolean = true,
)

class RemindersViewModel(private val repo: SynapseRepository) : ViewModel() {
    val state: StateFlow<RemindersUi> =
        combine(repo.todayReminders, repo.languageTag) { occ, tag ->
            RemindersUi(occ, tag, loading = false)
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), RemindersUi())

    fun mark(occ: ReminderOccurrence, status: ReminderStatus) {
        viewModelScope.launch { repo.markReminder(occ, status) }
    }
}

@Composable
fun RemindersScreen() {
    val vm: RemindersViewModel = synapseViewModel { RemindersViewModel(it) }
    val s by vm.state.collectAsStateWithLifecycle()
    val speaker = rememberSpeaker(s.speechTag)
    val t = LocalStrings.current

    if (!s.loading && s.occurrences.isEmpty()) {
        EmptyBlock(t.noRemindersToday)
        return
    }

    ScreenColumn {
        s.occurrences.forEach { occ ->
            ReminderCard(
                occ = occ,
                speaker = speaker,
                onDone = { vm.mark(occ, ReminderStatus.DONE) },
                onLater = { vm.mark(occ, ReminderStatus.SNOOZED) },
            )
        }
    }
}

@Composable
private fun ReminderCard(
    occ: ReminderOccurrence,
    speaker: com.sigmafusion.synapse.ui.voice.Speaker,
    onDone: () -> Unit,
    onLater: () -> Unit,
) {
    val done = occ.status == ReminderStatus.DONE
    val t = LocalStrings.current
    Surface(
        shape = MaterialTheme.shapes.large,
        color = if (done) {
            MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.35f)
        } else {
            MaterialTheme.colorScheme.surface
        },
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(Dimens.cardPadding), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(verticalAlignment = Alignment.Top) {
                Text(occ.emoji, fontSize = 40.sp)
                Spacer(Modifier.width(16.dp))
                Column(Modifier.weight(1f)) {
                    Text(occ.title, style = MaterialTheme.typography.titleLarge)
                    Text(
                        t.atTime(occ.timeLabel),
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    if (!occ.description.isNullOrBlank()) {
                        Text(
                            occ.description,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
                SpeakButton(
                    text = "${occ.title}. ${occ.description ?: ""}",
                    speaker = speaker,
                    label = t.hear,
                )
            }

            if (done) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.CheckCircle,
                        null,
                        tint = MaterialTheme.colorScheme.primary,
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        t.done,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.primary,
                    )
                }
            } else {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    PrimaryButton(
                        text = t.done,
                        onClick = onDone,
                        leadingIcon = Icons.Default.CheckCircle,
                        modifier = Modifier.weight(1f),
                    )
                    OutlinedButton(
                        onClick = onLater,
                        modifier = Modifier.weight(0.6f),
                    ) {
                        Icon(Icons.Default.Schedule, null, Modifier.padding(end = 8.dp))
                        Text(t.later)
                    }
                }
            }
        }
    }
}
