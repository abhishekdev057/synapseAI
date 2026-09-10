package com.sigmafusion.synapse.ui.screens.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.MedicalServices
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.SportsEsports
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.sigmafusion.synapse.core.TimeUtils
import com.sigmafusion.synapse.ui.components.BigTile
import com.sigmafusion.synapse.ui.components.SectionCard
import com.sigmafusion.synapse.ui.screens.synapseViewModel
import com.sigmafusion.synapse.ui.theme.Dimens
import com.sigmafusion.synapse.ui.voice.SpeakButton
import com.sigmafusion.synapse.ui.voice.rememberSpeaker
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onOpenGames: () -> Unit,
    onOpenReminders: () -> Unit,
    onOpenPeople: () -> Unit,
    onOpenSettings: () -> Unit,
) {
    val vm: HomeViewModel = synapseViewModel { HomeViewModel(it) }
    val state by vm.state.collectAsStateWithLifecycle()

    val nowEpoch by produceState(initialValue = TimeUtils.now()) {
        while (true) {
            value = TimeUtils.now()
            delay(20_000)
        }
    }

    val speaker = rememberSpeaker(state.speechTag)
    val greeting = buildGreeting(state.firstName, state.nextReminderTitle, state.nextReminderTime)

    LaunchedEffect(state.firstName, state.ttsEnabled) {
        if (state.ttsEnabled && state.firstName.isNotBlank()) {
            delay(400)
            speaker.speak(greeting)
        }
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = { Text("Synapse", style = MaterialTheme.typography.titleLarge) },
                actions = {
                    IconButton(onClick = onOpenSettings) {
                        Icon(Icons.Default.Settings, "Settings")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface,
                ),
            )
        },
    ) { inner ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(inner)
                .verticalScroll(rememberScrollState())
                .padding(Dimens.screenPadding),
            verticalArrangement = Arrangement.spacedBy(Dimens.gapLarge),
        ) {
            SectionCard {
                Column(
                    Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Row(verticalAlignment = Alignment.Bottom) {
                        Text(
                            TimeUtils.formatBigClock(nowEpoch),
                            style = MaterialTheme.typography.displayLarge,
                        )
                        Spacer(Modifier.height(0.dp))
                        Text(
                            "  ${TimeUtils.formatAmPm(nowEpoch)}",
                            style = MaterialTheme.typography.headlineMedium,
                            modifier = Modifier.padding(bottom = 8.dp),
                        )
                    }
                    Text(
                        TimeUtils.formatDayDate(nowEpoch),
                        style = MaterialTheme.typography.titleLarge,
                    )
                    Text(
                        "It is ${TimeUtils.partOfDay(nowEpoch)} now.",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(8.dp))
                    SpeakButton(text = greeting, speaker = speaker, label = "Read this to me")
                }
            }

            SectionCard {
                Text("Next", style = MaterialTheme.typography.headlineMedium)
                if (state.nextReminderTitle != null) {
                    Text(
                        state.nextReminderTitle!!,
                        style = MaterialTheme.typography.titleLarge,
                    )
                    Text(
                        "at ${state.nextReminderTime}",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    com.sigmafusion.synapse.ui.components.PrimaryButton(
                        text = "Open",
                        onClick = onOpenReminders,
                    )
                } else {
                    Text(
                        "Nothing more to do today. Well done.",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            BigTile(
                label = "Play a game",
                icon = Icons.Default.SportsEsports,
                onClick = onOpenGames,
                container = MaterialTheme.colorScheme.primary,
                content = MaterialTheme.colorScheme.onPrimary,
            )
            BigTile("My reminders", Icons.Default.MedicalServices, onOpenReminders)
            BigTile("Who is this?", Icons.Default.Groups, onOpenPeople)

            Text(
                "If you feel lost, open Settings to call your family.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}

private fun buildGreeting(firstName: String, nextTitle: String?, nextTime: String?): String {
    if (firstName.isBlank()) return "Welcome to Synapse."
    return if (nextTitle != null) {
        "Hello $firstName. Your next task is $nextTitle at $nextTime."
    } else {
        "Hello $firstName. There are no more reminders today."
    }
}
