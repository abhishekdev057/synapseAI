package com.sigmafusion.synapse.ui.screens.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.sigmafusion.synapse.BuildConfig
import com.sigmafusion.synapse.core.TimeUtils
import com.sigmafusion.synapse.data.SynapseRepository
import com.sigmafusion.synapse.domain.LANGUAGE_OPTIONS
import com.sigmafusion.synapse.ui.components.PrimaryButton
import com.sigmafusion.synapse.ui.components.ScreenColumn
import com.sigmafusion.synapse.ui.components.SectionCard
import com.sigmafusion.synapse.ui.screens.synapseViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class SettingsUi(
    val patientName: String = "",
    val languageCode: String = "as",
    val ttsEnabled: Boolean = true,
    val baseUrl: String = BuildConfig.DEFAULT_BASE_URL,
    val lastSyncEpoch: Long = 0L,
    val syncing: Boolean = false,
)

class SettingsViewModel(private val repo: SynapseRepository) : ViewModel() {
    private val syncing = kotlinx.coroutines.flow.MutableStateFlow(false)

    val state: StateFlow<SettingsUi> =
        combine(
            repo.patientName,
            repo.languageCode,
            repo.ttsEnabled,
            repo.baseUrl,
            repo.lastSync,
        ) { name, lang, tts, url, sync ->
            SettingsUi(name.orEmpty(), lang, tts, url, sync)
        }.combine(syncing) { ui, s -> ui.copy(syncing = s) }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), SettingsUi())

    fun setLanguage(code: String) = viewModelScope.launch { repo.setLanguage(code) }
    fun setTts(enabled: Boolean) = viewModelScope.launch { repo.setTtsEnabled(enabled) }
    fun setBaseUrl(url: String) = viewModelScope.launch { repo.setBaseUrl(url.trim()) }
    fun syncNow() = viewModelScope.launch {
        syncing.value = true
        repo.sync()
        syncing.value = false
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun SettingsScreen() {
    val vm: SettingsViewModel = synapseViewModel { SettingsViewModel(it) }
    val s by vm.state.collectAsStateWithLifecycle()
    var urlField by remember(s.baseUrl) { mutableStateOf(s.baseUrl) }

    ScreenColumn {
        SectionCard {
            Text("Patient", style = MaterialTheme.typography.titleLarge)
            Text(
                s.patientName.ifBlank { "Not set — will load on next sync" },
                style = MaterialTheme.typography.bodyLarge,
            )
        }

        SectionCard {
            Text("Language", style = MaterialTheme.typography.titleLarge)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                LANGUAGE_OPTIONS.forEach { opt ->
                    FilterChip(
                        selected = opt.code == s.languageCode,
                        onClick = { vm.setLanguage(opt.code) },
                        label = { Text("${opt.name} · ${opt.nativeName}") },
                    )
                }
            }
        }

        SectionCard {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.weight(1f)) {
                    Text("Read aloud", style = MaterialTheme.typography.titleLarge)
                    Text(
                        "Speak prompts and reminders on this device.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Switch(checked = s.ttsEnabled, onCheckedChange = { vm.setTts(it) })
            }
        }

        SectionCard {
            Text("Sync server", style = MaterialTheme.typography.titleLarge)
            OutlinedTextField(
                value = urlField,
                onValueChange = { urlField = it },
                label = { Text("Base URL") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            PrimaryButton(text = "Save server URL", onClick = { vm.setBaseUrl(urlField) })
            Text(
                if (s.lastSyncEpoch == 0L) {
                    "Not synced yet."
                } else {
                    "Last synced ${TimeUtils.formatShortDate(s.lastSyncEpoch)} " +
                        TimeUtils.formatClockTime(s.lastSyncEpoch)
                },
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            PrimaryButton(
                text = if (s.syncing) "Syncing…" else "Sync now",
                onClick = { vm.syncNow() },
                enabled = !s.syncing,
            )
        }

        SectionCard {
            Text("About", style = MaterialTheme.typography.titleLarge)
            Text(
                "Synapse ${BuildConfig.VERSION_NAME} · offline-first patient app.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
