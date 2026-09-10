package com.sigmafusion.synapse.ui.screens.games

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Undo
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.sigmafusion.synapse.domain.CognitiveDomain
import com.sigmafusion.synapse.ui.components.SecondaryButton
import com.sigmafusion.synapse.ui.i18n.LocalStrings
import com.sigmafusion.synapse.ui.screens.synapseViewModel
import com.sigmafusion.synapse.ui.voice.rememberSpeaker
import kotlinx.coroutines.delay

private data class Step(val emoji: String, val label: String)

private val STEPS = listOf(
    Step("🛏️", "Wake up"),
    Step("🚰", "Wash your face"),
    Step("🪥", "Brush your teeth"),
    Step("🙏", "Morning prayer"),
    Step("🍵", "Make tea"),
    Step("🍽️", "Eat breakfast"),
    Step("💊", "Take your medicine"),
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun MorningRoutineScreen(onDone: () -> Unit) {
    val vm = synapseViewModel {
        GameSessionViewModel(it, "morning_routine", CognitiveDomain.ROUTINE_RECALL.wire)
    }
    val ui by vm.ui.collectAsStateWithLifecycle()
    val speaker = rememberSpeaker(ui.speechTag)
    val t = LocalStrings.current

    val count = remember(ui.difficulty) { scaleBetween(ui.difficulty, 3, STEPS.size) }
    val canonical = remember(ui.difficulty) { STEPS.take(count) }
    val pool = remember(ui.round, ui.difficulty) { canonical.shuffled() }

    var placed by remember(ui.round, ui.difficulty) { mutableStateOf(listOf<String>()) }
    var peeks by remember(ui.round, ui.difficulty) { mutableIntStateOf(0) }
    var reveal by remember(ui.round, ui.difficulty) { mutableStateOf(false) }
    val startedAt = remember(ui.round, ui.difficulty) { System.currentTimeMillis() }

    if (reveal) {
        LaunchedEffect(placed.size, reveal) { delay(2000); reveal = false }
    }

    LaunchedEffect(placed.size, ui.round) {
        if (placed.size == canonical.size && canonical.isNotEmpty()) {
            delay(400)
            val right = placed.filterIndexed { i, label -> canonical.getOrNull(i)?.label == label }.size
            vm.finish(
                RoundOutcome(
                    accuracy = right.toDouble() / canonical.size,
                    hintsUsed = peeks,
                    roundsCompleted = canonical.size,
                    reactionTimeMs = ((System.currentTimeMillis() - startedAt) / canonical.size).toInt(),
                ),
            )
        }
    }

    GameShell(
        title = t.gameMorningRoutine,
        instruction = t.instrMorningRoutine,
        speaker = speaker,
        ui = ui,
        onPlayAgain = vm::playAgain,
        onHome = onDone,
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            canonical.forEachIndexed { i, _ ->
                val label = placed.getOrNull(i)
                val step = label?.let { l -> canonical.first { it.label == l } }
                val correct = if (reveal) canonical[i].label == label else null
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = if (step != null) MaterialTheme.colorScheme.primaryContainer
                    else MaterialTheme.colorScheme.surface,
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp, MaterialTheme.colorScheme.outline,
                    ),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Row(
                        Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            "${i + 1}",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.width(28.dp),
                        )
                        if (step != null) {
                            Text(step.emoji, fontSize = 26.sp, modifier = Modifier.padding(end = 10.dp))
                            Text(step.label, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
                            when (correct) {
                                true -> Icon(Icons.Default.Check, null, tint = MaterialTheme.colorScheme.primary)
                                false -> Icon(Icons.Default.Close, null, tint = MaterialTheme.colorScheme.error)
                                null -> {}
                            }
                        } else {
                            Text("—", color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }

            val remaining = pool.filterNot { it.label in placed }
            if (remaining.isNotEmpty()) {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    remaining.forEach { s ->
                        Surface(
                            onClick = { placed = placed + s.label },
                            shape = RoundedCornerShape(16.dp),
                            color = MaterialTheme.colorScheme.surface,
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp, MaterialTheme.colorScheme.outline,
                            ),
                        ) {
                            Row(
                                Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text(s.emoji, fontSize = 22.sp, modifier = Modifier.padding(end = 8.dp))
                                Text(s.label, style = MaterialTheme.typography.bodyLarge)
                            }
                        }
                    }
                }
            }

            Row(
                Modifier.fillMaxWidth().padding(top = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                SecondaryButton(
                    text = t.showAgain,
                    onClick = { peeks++; reveal = true },
                    leadingIcon = Icons.Default.Visibility,
                    modifier = Modifier.weight(1f),
                )
                if (placed.isNotEmpty()) {
                    SecondaryButton(
                        text = t.undo,
                        onClick = { placed = placed.dropLast(1) },
                        leadingIcon = Icons.AutoMirrored.Filled.Undo,
                        modifier = Modifier.weight(1f),
                    )
                }
            }
            Text(
                t.roundProgress(placed.size, canonical.size),
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
