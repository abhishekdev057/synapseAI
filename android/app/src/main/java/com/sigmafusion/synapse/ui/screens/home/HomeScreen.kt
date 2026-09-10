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
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.sigmafusion.synapse.core.TimeUtils
import com.sigmafusion.synapse.ui.components.BigTile
import com.sigmafusion.synapse.ui.components.PrimaryButton
import com.sigmafusion.synapse.ui.components.SectionCard
import com.sigmafusion.synapse.ui.i18n.LocalStrings
import com.sigmafusion.synapse.ui.i18n.partOfDayLabel
import com.sigmafusion.synapse.ui.screens.synapseViewModel
import com.sigmafusion.synapse.ui.theme.Dimens
import com.sigmafusion.synapse.ui.theme.StatusRed
import com.sigmafusion.synapse.ui.theme.TintLavender
import com.sigmafusion.synapse.ui.theme.TintMint
import com.sigmafusion.synapse.ui.theme.TintPeach
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
    val t = LocalStrings.current

    val nowEpoch by produceState(initialValue = TimeUtils.now()) {
        while (true) {
            value = TimeUtils.now()
            delay(20_000)
        }
    }

    val speaker = rememberSpeaker(state.speechTag)
    val greeting = when {
        state.firstName.isBlank() -> t.welcome
        state.nextReminderTitle != null -> t.greetingWithNext(
            state.firstName, state.nextReminderTitle!!, state.nextReminderTime.orEmpty(),
        )
        else -> t.greetingNoNext(state.firstName)
    }

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
                title = { Text(t.appName, style = MaterialTheme.typography.titleLarge) },
                actions = {
                    IconButton(onClick = onOpenSettings) {
                        Icon(Icons.Default.Settings, t.settings)
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
                        t.itIsPartNow(t.partOfDayLabel(TimeUtils.partOfDay(nowEpoch))),
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(8.dp))
                    SpeakButton(text = greeting, speaker = speaker, label = t.readThisToMe)
                }
            }

            SectionCard {
                Text(t.next, style = MaterialTheme.typography.headlineMedium)
                if (state.nextReminderTitle != null) {
                    Text(
                        state.nextReminderTitle!!,
                        style = MaterialTheme.typography.titleLarge,
                    )
                    Text(
                        t.atTime(state.nextReminderTime.orEmpty()),
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    PrimaryButton(text = t.open, onClick = onOpenReminders)
                } else {
                    Text(
                        t.nothingMoreToday,
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            BigTile(
                label = t.playAGame,
                icon = Icons.Default.SportsEsports,
                onClick = onOpenGames,
                container = TintPeach,
                content = MaterialTheme.colorScheme.onSurface,
            )
            BigTile(
                label = t.myReminders,
                icon = Icons.Default.MedicalServices,
                onClick = onOpenReminders,
                container = TintMint,
                content = MaterialTheme.colorScheme.onSurface,
            )
            BigTile(
                label = t.whoIsThis,
                icon = Icons.Default.Groups,
                onClick = onOpenPeople,
                container = TintLavender,
                content = MaterialTheme.colorScheme.onSurface,
            )
            BigTile(
                label = t.feelLost,
                icon = Icons.Default.Groups,
                onClick = onOpenPeople,
                container = StatusRed,
                content = androidx.compose.ui.graphics.Color.White,
            )
        }
    }
}
