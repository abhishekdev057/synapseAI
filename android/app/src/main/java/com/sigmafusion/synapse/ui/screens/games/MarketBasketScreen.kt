package com.sigmafusion.synapse.ui.screens.games

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ShoppingBasket
import androidx.compose.material.icons.filled.Visibility
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.sigmafusion.synapse.domain.CognitiveDomain
import com.sigmafusion.synapse.ui.components.PrimaryButton
import com.sigmafusion.synapse.ui.components.SecondaryButton
import com.sigmafusion.synapse.ui.i18n.LocalStrings
import com.sigmafusion.synapse.ui.screens.synapseViewModel
import com.sigmafusion.synapse.ui.voice.SpeakButton
import com.sigmafusion.synapse.ui.voice.rememberSpeaker

private data class Good(val emoji: String, val name: String)

private val GOODS = listOf(
    Good("🍚", "Rice"), Good("🍵", "Assam tea"), Good("🎋", "Bamboo shoot"),
    Good("🌰", "Betel nut"), Good("🐟", "Fish"), Good("🥚", "Eggs"),
    Good("🌶️", "Chillies"), Good("🫚", "Ginger"), Good("🎃", "Pumpkin"),
    Good("🍊", "Oranges"), Good("🥛", "Milk"), Good("🧂", "Salt"),
    Good("🥔", "Potatoes"), Good("🍌", "Bananas"),
)

@Composable
fun MarketBasketScreen(onDone: () -> Unit) {
    val vm = synapseViewModel {
        GameSessionViewModel(it, "market_basket", CognitiveDomain.ATTENTION.wire)
    }
    val ui by vm.ui.collectAsStateWithLifecycle()
    val speaker = rememberSpeaker(ui.speechTag)
    val t = LocalStrings.current

    val listSize = remember(ui.difficulty) { scaleBetween(ui.difficulty, 3, 8) }
    val list = remember(ui.round, ui.difficulty) { GOODS.shuffled().take(listSize) }
    val stall = remember(ui.round, ui.difficulty) {
        val distractors = GOODS.filterNot { it in list }.shuffled().take(6)
        (list + distractors).shuffled()
    }
    val wanted = remember(list) { list.map { it.name }.toSet() }

    var step by remember(ui.round) { mutableStateOf("study") }
    var chosen by remember(ui.round) { mutableStateOf(setOf<String>()) }
    var peeks by remember(ui.round) { mutableIntStateOf(0) }
    var startedAt by remember(ui.round) { mutableStateOf(0L) }

    GameShell(
        title = t.gameMarketBasket,
        instruction = t.instrMarketBasket,
        speaker = speaker,
        ui = ui,
        onPlayAgain = vm::playAgain,
        onHome = onDone,
    ) {
        if (step == "study") {
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = MaterialTheme.colorScheme.surfaceVariant,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(t.thingsToBuy, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    list.forEach { g ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(g.emoji, fontSize = 28.sp, modifier = Modifier.padding(end = 12.dp))
                            Text(g.name, style = MaterialTheme.typography.bodyLarge)
                        }
                    }
                }
            }
            SpeakButton(
                text = "${t.thingsToBuy}: ${list.joinToString(", ") { it.name }}",
                speaker = speaker,
                label = t.hearThis,
            )
            PrimaryButton(
                text = t.goToMarket,
                onClick = { step = "shop"; startedAt = System.currentTimeMillis() },
                leadingIcon = Icons.Default.ShoppingBasket,
            )
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                stall.chunked(3).forEach { rowGoods ->
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        rowGoods.forEach { g ->
                            val picked = chosen.contains(g.name)
                            Surface(
                                onClick = {
                                    chosen = if (picked) chosen - g.name else chosen + g.name
                                },
                                shape = RoundedCornerShape(18.dp),
                                color = if (picked) MaterialTheme.colorScheme.primaryContainer
                                else MaterialTheme.colorScheme.surface,
                                border = androidx.compose.foundation.BorderStroke(
                                    1.dp,
                                    if (picked) MaterialTheme.colorScheme.primary
                                    else MaterialTheme.colorScheme.outline,
                                ),
                                modifier = Modifier.weight(1f).aspectRatio(1f),
                            ) {
                                Column(
                                    Modifier.padding(4.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.Center,
                                ) {
                                    Text(g.emoji, fontSize = 30.sp)
                                    Text(
                                        g.name,
                                        style = MaterialTheme.typography.labelSmall,
                                        textAlign = TextAlign.Center,
                                    )
                                }
                            }
                        }
                        repeat(3 - rowGoods.size) { Box(Modifier.weight(1f)) }
                    }
                }

                Row(
                    Modifier.fillMaxWidth().padding(top = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    SecondaryButton(
                        text = t.showAgain,
                        onClick = { peeks++; step = "study" },
                        leadingIcon = Icons.Default.Visibility,
                        modifier = Modifier.weight(1f),
                    )
                    PrimaryButton(
                        text = t.done,
                        onClick = {
                            val correct = chosen.count { it in wanted }
                            val bad = chosen.count { it !in wanted }
                            val acc = if (wanted.isEmpty()) 1.0
                            else ((correct - bad).coerceAtLeast(0)).toDouble() / wanted.size
                            vm.finish(
                                RoundOutcome(
                                    accuracy = acc,
                                    hintsUsed = peeks,
                                    roundsCompleted = wanted.size,
                                    reactionTimeMs = if (startedAt > 0) {
                                        ((System.currentTimeMillis() - startedAt) /
                                            wanted.size.coerceAtLeast(1)).toInt()
                                    } else null,
                                ),
                            )
                        },
                        leadingIcon = Icons.Default.Check,
                        modifier = Modifier.weight(1f),
                    )
                }
                Text(
                    t.roundProgress(chosen.size, wanted.size),
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}
