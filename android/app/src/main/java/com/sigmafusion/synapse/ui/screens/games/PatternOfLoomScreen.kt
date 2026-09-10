package com.sigmafusion.synapse.ui.screens.games

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.MaterialTheme
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
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.sigmafusion.synapse.domain.CognitiveDomain
import com.sigmafusion.synapse.ui.components.SecondaryButton
import com.sigmafusion.synapse.ui.i18n.LocalStrings
import com.sigmafusion.synapse.ui.screens.synapseViewModel
import com.sigmafusion.synapse.ui.voice.rememberSpeaker
import kotlinx.coroutines.delay

private const val GRID = 9 // 3×3 loom

@Composable
fun PatternOfLoomScreen(onDone: () -> Unit) {
    val vm = synapseViewModel {
        GameSessionViewModel(it, "pattern_of_the_loom", CognitiveDomain.PATTERN_RECOGNITION.wire)
    }
    val ui by vm.ui.collectAsStateWithLifecycle()
    val speaker = rememberSpeaker(ui.speechTag)
    val t = LocalStrings.current

    val len = remember(ui.difficulty) { scaleBetween(ui.difficulty, 2, 6) }
    var replays by remember(ui.round, ui.difficulty) { mutableIntStateOf(0) }
    // playKey changes to (re)trigger the watch animation.
    var playKey by remember(ui.round, ui.difficulty) { mutableIntStateOf(0) }
    val sequence = remember(ui.round, ui.difficulty) {
        (0 until GRID).shuffled().take(len.coerceAtMost(GRID))
    }

    var mode by remember(ui.round, ui.difficulty) { mutableStateOf("watch") }
    var lit by remember(ui.round, ui.difficulty) { mutableStateOf<Int?>(null) }
    var taps by remember(ui.round, ui.difficulty) { mutableStateOf(listOf<Int>()) }
    var startedAt by remember(ui.round, ui.difficulty) { mutableStateOf(0L) }

    LaunchedEffect(playKey, ui.round, ui.difficulty) {
        mode = "watch"; taps = emptyList(); lit = null
        delay(400)
        sequence.forEach { cell ->
            lit = cell
            delay(600)
            lit = null
            delay(200)
        }
        mode = "input"
        startedAt = System.currentTimeMillis()
    }

    GameShell(
        title = t.gamePatternOfLoom,
        instruction = t.instrPatternLoom,
        speaker = speaker,
        ui = ui,
        onPlayAgain = vm::playAgain,
        onHome = onDone,
    ) {
        Text(
            if (mode == "watch") t.watchCarefully else t.nowYourTurn,
            style = MaterialTheme.typography.titleMedium,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
        )
        SecondaryButton(
            text = t.showAgain,
            onClick = { replays++; playKey++ },
            leadingIcon = Icons.Default.PlayArrow,
        )
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            (0 until GRID).chunked(3).forEach { rowCells ->
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    rowCells.forEach { cell ->
                        val isLit = lit == cell
                        val tapped = taps.contains(cell)
                        Surface(
                            onClick = {
                                if (mode == "input" && taps.size < sequence.size) {
                                    val next = taps + cell
                                    taps = next
                                    if (next.size == sequence.size) {
                                        val right = next.filterIndexed { i, c -> sequence[i] == c }.size
                                        vm.finish(
                                            RoundOutcome(
                                                accuracy = right.toDouble() / sequence.size,
                                                hintsUsed = replays,
                                                roundsCompleted = sequence.size,
                                                reactionTimeMs = if (startedAt > 0) {
                                                    ((System.currentTimeMillis() - startedAt) /
                                                        sequence.size).toInt()
                                                } else null,
                                            ),
                                        )
                                    }
                                }
                            },
                            enabled = mode == "input",
                            shape = RoundedCornerShape(16.dp),
                            color = when {
                                isLit -> MaterialTheme.colorScheme.tertiary
                                tapped -> MaterialTheme.colorScheme.primaryContainer
                                else -> MaterialTheme.colorScheme.surfaceVariant
                            },
                            border = androidx.compose.foundation.BorderStroke(
                                2.dp,
                                if (isLit) MaterialTheme.colorScheme.tertiary
                                else MaterialTheme.colorScheme.outline,
                            ),
                            modifier = Modifier.weight(1f).aspectRatio(1f),
                        ) {
                            Box(
                                Modifier
                                    .padding(6.dp)
                                    .background(
                                        MaterialTheme.colorScheme.outline.copy(alpha = 0.08f),
                                        RoundedCornerShape(8.dp),
                                    ),
                            ) {}
                        }
                    }
                }
            }
        }
        Text(
            t.roundProgress(taps.size, sequence.size),
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
