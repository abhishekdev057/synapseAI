package com.sigmafusion.synapse.ui.screens.games

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
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
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.sigmafusion.synapse.domain.CognitiveDomain
import com.sigmafusion.synapse.ui.i18n.LocalStrings
import com.sigmafusion.synapse.ui.screens.synapseViewModel
import com.sigmafusion.synapse.ui.voice.SpeakButton
import com.sigmafusion.synapse.ui.voice.rememberSpeaker
import kotlinx.coroutines.delay

private data class Verse(
    val before: String,
    val answer: String,
    val after: String,
    val options: List<String>,
)

private val VERSES = listOf(
    Verse("The hornbill calls from the tall", "tree", ", morning has come to the hills.", listOf("tree", "river", "drum")),
    Verse("On the wide waters of Loktak the fishermen push their", "boat", " at dawn.", listOf("boat", "cart", "plough")),
    Verse("The Brahmaputra is wide and the", "moon", " floats upon it like a lamp.", listOf("moon", "stone", "leaf")),
    Verse("In Bihu the young ones dance while the elders keep the", "beat", " on the dhol.", listOf("beat", "field", "gate")),
    Verse("Tea leaves are green on the hill and the basket is on her", "back", ".", listOf("back", "roof", "road")),
    Verse("The living-root bridge holds strong across the running", "stream", " below.", listOf("stream", "cloud", "market")),
    Verse("When the rice is ripe the whole village goes to the", "field", " together.", listOf("field", "temple", "school")),
)

@Composable
fun SongOfHillsScreen(onDone: () -> Unit) {
    val vm = synapseViewModel {
        GameSessionViewModel(it, "song_of_the_hills", CognitiveDomain.ENGAGEMENT.wire)
    }
    val ui by vm.ui.collectAsStateWithLifecycle()
    val speaker = rememberSpeaker(ui.speechTag)
    val t = LocalStrings.current

    val total = remember(ui.difficulty) { scaleBetween(ui.difficulty, 1, 4).coerceAtLeast(1) }
    val verses = remember(ui.round, ui.difficulty) { VERSES.shuffled().take(total) }

    var idx by remember(ui.round, ui.difficulty) { mutableIntStateOf(0) }
    var picked by remember(ui.round, ui.difficulty) { mutableStateOf<String?>(null) }
    var firstTryRight by remember(ui.round, ui.difficulty) { mutableIntStateOf(0) }
    var triedWrong by remember(ui.round, ui.difficulty) { mutableStateOf(false) }
    val startedAt = remember(ui.round, ui.difficulty) { System.currentTimeMillis() }

    val verse = verses[idx]
    val options = remember(idx, ui.round) { verse.options.shuffled() }
    val solved = picked == verse.answer

    LaunchedEffect(solved, idx, ui.round) {
        if (solved) {
            delay(900)
            if (idx + 1 >= verses.size) {
                vm.finish(
                    RoundOutcome(
                        accuracy = firstTryRight.toDouble() / verses.size,
                        roundsCompleted = verses.size,
                        reactionTimeMs = ((System.currentTimeMillis() - startedAt) / verses.size).toInt(),
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
        title = t.gameSongOfHills,
        instruction = t.instrSongHills,
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
            Text(
                "${verse.before}  ${if (solved) verse.answer else "____"}  ${verse.after}",
                style = MaterialTheme.typography.titleLarge,
                modifier = Modifier.padding(20.dp),
            )
        }
        SpeakButton(
            text = "${verse.before} ... ${verse.after}",
            speaker = speaker,
            label = t.hearTheLine,
        )
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            options.forEach { word ->
                val chosen = picked == word
                val right = chosen && word == verse.answer
                val wrong = chosen && word != verse.answer
                Surface(
                    onClick = {
                        if (picked != verse.answer) {
                            picked = word
                            if (word == verse.answer) {
                                if (!triedWrong) firstTryRight += 1
                            } else {
                                triedWrong = true
                            }
                        }
                    },
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
            t.roundProgress(idx + 1, verses.size),
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
