package com.sigmafusion.synapse.ui.screens.games

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import com.sigmafusion.synapse.ui.components.Medallion
import com.sigmafusion.synapse.ui.i18n.LocalStrings
import com.sigmafusion.synapse.ui.screens.synapseViewModel
import com.sigmafusion.synapse.ui.voice.rememberSpeaker

private val DISTRACTORS = listOf("🐘", "🦌", "🐐", "🐓", "🐟", "🦉", "🐝", "🐢", "🐍", "🦆")

private data class Beast(val id: Int, val emoji: String, val isTarget: Boolean)

@Composable
fun BirdAndBeastScreen(onDone: () -> Unit) {
    val vm = synapseViewModel {
        GameSessionViewModel(it, "bird_and_beast", CognitiveDomain.ATTENTION.wire)
    }
    val ui by vm.ui.collectAsStateWithLifecycle()
    val speaker = rememberSpeaker(ui.speechTag)
    val t = LocalStrings.current

    val targetEmoji = remember(ui.round) { if (ui.round % 2 == 0) "🦏" else "🦜" }
    val targetWord = if (ui.round % 2 == 0) t.theRhino else t.theHornbill

    val total = remember(ui.difficulty) { scaleBetween(ui.difficulty, 9, 24) }
    val targetCount = remember(ui.difficulty) { scaleBetween(ui.difficulty, 2, 6) }

    val tiles = remember(ui.round, ui.difficulty) {
        val pool = DISTRACTORS.filter { it != targetEmoji }.shuffled()
        (0 until total).map { i ->
            val isT = i < targetCount
            Beast(i, if (isT) targetEmoji else pool[i % pool.size], isT)
        }.shuffled()
    }

    var found by remember(ui.round, ui.difficulty) { mutableStateOf(setOf<Int>()) }
    var wrong by remember(ui.round, ui.difficulty) { mutableIntStateOf(0) }
    val startedAt = remember(ui.round, ui.difficulty) { System.currentTimeMillis() }

    GameShell(
        title = t.gameBirdAndBeast,
        instruction = t.instrBirdBeast("$targetEmoji $targetWord"),
        speaker = speaker,
        ui = ui,
        onPlayAgain = vm::playAgain,
        onHome = onDone,
    ) {
        val columns = if (total <= 9) 3 else if (total <= 16) 4 else 5
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            tiles.chunked(columns).forEach { rowTiles ->
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    rowTiles.forEach { tile ->
                        val hit = found.contains(tile.id)
                        Surface(
                            onClick = {
                                if (!hit) {
                                    if (tile.isTarget) {
                                        found = found + tile.id
                                        if (found.size == targetCount) {
                                            vm.finish(
                                                RoundOutcome(
                                                    accuracy = targetCount.toDouble() /
                                                        (targetCount + wrong),
                                                    roundsCompleted = targetCount,
                                                    reactionTimeMs = (
                                                        (System.currentTimeMillis() - startedAt) /
                                                            targetCount
                                                        ).toInt(),
                                                ),
                                            )
                                        }
                                    } else {
                                        wrong++
                                    }
                                }
                            },
                            shape = RoundedCornerShape(20.dp),
                            color = if (hit) MaterialTheme.colorScheme.primaryContainer
                            else androidx.compose.ui.graphics.Color.Transparent,
                            border = if (hit) androidx.compose.foundation.BorderStroke(
                                2.dp, MaterialTheme.colorScheme.primary,
                            ) else null,
                            modifier = Modifier
                                .weight(1f)
                                .aspectRatio(1f),
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                if (hit) {
                                    Text(tile.emoji, fontSize = 34.sp)
                                } else {
                                    Medallion(size = 56.dp) {
                                        Text(tile.emoji, fontSize = 30.sp)
                                    }
                                }
                            }
                        }
                    }
                    repeat(columns - rowTiles.size) { Box(Modifier.weight(1f)) }
                }
            }
            Text(
                t.roundProgress(found.size, targetCount),
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
            )
        }
    }
}

/** difficulty 1–10 → a value in [lo, hi]. */
fun scaleBetween(difficulty: Int, lo: Int, hi: Int): Int {
    val d = difficulty.coerceIn(1, 10)
    return (lo + (hi - lo) * (d - 1) / 9.0).toInt()
}
