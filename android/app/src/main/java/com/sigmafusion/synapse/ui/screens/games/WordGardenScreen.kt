package com.sigmafusion.synapse.ui.screens.games

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.sigmafusion.synapse.domain.CognitiveDomain
import com.sigmafusion.synapse.ui.components.Medallion
import com.sigmafusion.synapse.ui.i18n.LocalStrings
import com.sigmafusion.synapse.ui.screens.synapseViewModel
import com.sigmafusion.synapse.ui.voice.VoiceInputButton
import com.sigmafusion.synapse.ui.voice.rememberSpeaker
import kotlinx.coroutines.delay

private data class Pic(val emoji: String, val word: String, val options: List<String>)

private val PICS = listOf(
    Pic("🐘", "Elephant", listOf("Elephant", "Buffalo", "Horse")),
    Pic("🍵", "Tea", listOf("Tea", "Milk", "Water")),
    Pic("🌾", "Rice", listOf("Rice", "Wheat", "Grass")),
    Pic("🐟", "Fish", listOf("Fish", "Frog", "Snake")),
    Pic("🎋", "Bamboo", listOf("Bamboo", "Sugarcane", "Reed")),
    Pic("🌺", "Flower", listOf("Flower", "Leaf", "Fruit")),
    Pic("🥁", "Drum", listOf("Drum", "Bell", "Flute")),
    Pic("🏔️", "Mountain", listOf("Mountain", "River", "Cloud")),
    Pic("🛶", "Boat", listOf("Boat", "Cart", "Bridge")),
    Pic("🥭", "Mango", listOf("Mango", "Orange", "Guava")),
)

@Composable
fun WordGardenScreen(onDone: () -> Unit) {
    val vm = synapseViewModel {
        GameSessionViewModel(it, "word_garden", CognitiveDomain.LANGUAGE.wire)
    }
    val ui by vm.ui.collectAsStateWithLifecycle()
    val speaker = rememberSpeaker(ui.speechTag)
    val t = LocalStrings.current

    val total = remember(ui.difficulty) { scaleBetween(ui.difficulty, 2, 5) }
    val pics = remember(ui.round, ui.difficulty) { PICS.shuffled().take(total) }

    var idx by remember(ui.round, ui.difficulty) { mutableIntStateOf(0) }
    var picked by remember(ui.round, ui.difficulty) { mutableStateOf<String?>(null) }
    var firstTryRight by remember(ui.round, ui.difficulty) { mutableIntStateOf(0) }
    var triedWrong by remember(ui.round, ui.difficulty) { mutableStateOf(false) }
    val startedAt = remember(ui.round, ui.difficulty) { System.currentTimeMillis() }

    val pic = pics[idx]
    val options = remember(idx, ui.round) { pic.options.shuffled() }
    val solved = picked?.equals(pic.word, ignoreCase = true) == true

    fun submit(word: String) {
        if (solved) return
        picked = word
        if (word.equals(pic.word, ignoreCase = true)) {
            if (!triedWrong) firstTryRight += 1
        } else {
            triedWrong = true
        }
    }

    LaunchedEffect(solved, idx, ui.round) {
        if (solved) {
            delay(900)
            if (idx + 1 >= pics.size) {
                vm.finish(
                    RoundOutcome(
                        accuracy = firstTryRight.toDouble() / pics.size,
                        roundsCompleted = pics.size,
                        reactionTimeMs = ((System.currentTimeMillis() - startedAt) / pics.size).toInt(),
                    ),
                )
            } else {
                idx += 1
                picked = null
                triedWrong = false
            }
        }
    }

    GameShell(
        title = t.gameWordGarden,
        instruction = t.instrWordGarden,
        speaker = speaker,
        ui = ui,
        onPlayAgain = vm::playAgain,
        onHome = onDone,
    ) {
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = MaterialTheme.colorScheme.surfaceVariant,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(
                Modifier.fillMaxWidth().padding(28.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Medallion(size = 132.dp) { Text(pic.emoji, fontSize = 76.sp) }
                if (solved) {
                    Text(
                        pic.word,
                        style = MaterialTheme.typography.headlineMedium,
                        color = MaterialTheme.colorScheme.primary,
                    )
                }
            }
        }

        Column(
            Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            VoiceInputButton(
                languageTag = ui.speechTag,
                label = t.sayTheWord,
                listeningLabel = t.listening,
                onResult = { said ->
                    val match = pic.options.firstOrNull { said.contains(it, ignoreCase = true) }
                    submit(match ?: said)
                },
            )
            Text(
                t.orTapAnswer,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }

        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            options.forEach { word ->
                val chosen = picked == word
                val right = chosen && word.equals(pic.word, ignoreCase = true)
                val wrong = chosen && !right
                Surface(
                    onClick = { submit(word) },
                    shape = RoundedCornerShape(18.dp),
                    color = when {
                        right -> MaterialTheme.colorScheme.primaryContainer
                        wrong -> MaterialTheme.colorScheme.errorContainer
                        else -> MaterialTheme.colorScheme.surface
                    },
                    border = androidx.compose.foundation.BorderStroke(
                        2.dp,
                        when {
                            right -> MaterialTheme.colorScheme.primary
                            wrong -> MaterialTheme.colorScheme.error
                            else -> MaterialTheme.colorScheme.outline
                        },
                    ),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(
                        word,
                        style = MaterialTheme.typography.titleLarge,
                        modifier = Modifier.padding(horizontal = 20.dp, vertical = 18.dp),
                    )
                }
            }
        }

        picked?.let {
            Text(
                if (solved) t.goodChoice else t.tryAnother,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth(),
            )
        }
        Text(
            t.roundProgress(idx + 1, pics.size),
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
