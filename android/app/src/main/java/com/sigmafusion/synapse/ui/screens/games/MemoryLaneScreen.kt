package com.sigmafusion.synapse.ui.screens.games

import androidx.compose.animation.Crossfade
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.sigmafusion.synapse.ui.components.LoadingBlock
import com.sigmafusion.synapse.ui.components.PrimaryButton
import com.sigmafusion.synapse.ui.components.SecondaryButton
import com.sigmafusion.synapse.ui.screens.synapseViewModel
import com.sigmafusion.synapse.ui.theme.Dimens
import com.sigmafusion.synapse.ui.voice.SpeakButton
import com.sigmafusion.synapse.ui.voice.rememberSpeaker

@Composable
fun MemoryLaneScreen(onDone: () -> Unit) {
    val vm: MemoryLaneViewModel = synapseViewModel { MemoryLaneViewModel(it) }
    val s by vm.ui.collectAsStateWithLifecycle()
    val speaker = rememberSpeaker(s.speechTag)

    Crossfade(targetState = s.phase, label = "phase") { phase ->
        when (phase) {
            Phase.LOADING -> LoadingBlock()
            Phase.DONE -> DoneView(
                firstName = s.firstName,
                reason = s.decisionReason,
                effectiveAccuracy = s.effectiveAccuracy,
                speaker = speaker,
                onPlayAgain = vm::playAgain,
                onHome = onDone,
            )
            Phase.PLAYING -> PlayingView(
                deck = s.deck,
                flipped = s.flipped,
                showAll = s.showAll,
                pairsFound = s.pairsFound,
                pairsTotal = s.pairsTotal,
                onFlip = vm::onFlip,
                onHint = vm::hint,
            )
        }
    }
}

@Composable
private fun PlayingView(
    deck: List<Card>,
    flipped: List<Int>,
    showAll: Boolean,
    pairsFound: Int,
    pairsTotal: Int,
    onFlip: (Int) -> Unit,
    onHint: () -> Unit,
) {
    val columns = when {
        pairsTotal <= 4 -> 2
        pairsTotal <= 6 -> 3
        else -> 4
    }
    Column(
        Modifier
            .fillMaxSize()
            .padding(Dimens.screenPadding),
        verticalArrangement = Arrangement.spacedBy(Dimens.gap),
    ) {
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                "Find the matching pictures.",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.weight(1f),
            )
            OutlinedButton(onClick = onHint) {
                Icon(Icons.Default.Visibility, null, Modifier.padding(end = 8.dp))
                Text("Show all")
            }
        }

        LazyVerticalGrid(
            columns = GridCells.Fixed(columns),
            modifier = Modifier.weight(1f),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            items(deck, key = { it.uid }) { card ->
                val faceUp = showAll || card.matched || flipped.contains(card.uid)
                Surface(
                    onClick = { onFlip(card.uid) },
                    enabled = !faceUp,
                    shape = MaterialTheme.shapes.large,
                    color = if (faceUp) {
                        MaterialTheme.colorScheme.primaryContainer
                    } else {
                        MaterialTheme.colorScheme.surface
                    },
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (faceUp) MaterialTheme.colorScheme.primary
                        else MaterialTheme.colorScheme.outline,
                    ),
                    modifier = Modifier
                        .aspectRatio(1f)
                        .alpha(if (card.matched) 0.55f else 1f),
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(if (faceUp) card.symbol else "", fontSize = 44.sp)
                    }
                }
            }
        }

        Text(
            "$pairsFound of $pairsTotal pairs found",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun DoneView(
    firstName: String,
    reason: String,
    effectiveAccuracy: Double,
    speaker: com.sigmafusion.synapse.ui.voice.Speaker,
    onPlayAgain: () -> Unit,
    onHome: () -> Unit,
) {
    var showDetail by remember { mutableStateOf(false) }
    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(Dimens.screenPadding),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(Dimens.gap),
    ) {
        Text("🌼", fontSize = 72.sp, modifier = Modifier.padding(top = 24.dp))
        Text(
            "Well done today${if (firstName.isNotBlank()) ", $firstName" else ""}.",
            style = MaterialTheme.typography.headlineLarge,
            textAlign = TextAlign.Center,
        )
        Text(
            "You finished the game. Your family and doctor can see that you played.",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
        SpeakButton(
            text = "Well done today${if (firstName.isNotBlank()) ", $firstName" else ""}. You finished the game.",
            speaker = speaker,
            label = "Hear this",
        )

        PrimaryButton(text = "Play again", onClick = onPlayAgain, leadingIcon = Icons.Default.Refresh)
        SecondaryButton(text = "Go home", onClick = onHome, leadingIcon = Icons.Default.Home)

        Surface(
            onClick = { showDetail = !showDetail },
            shape = MaterialTheme.shapes.medium,
            color = MaterialTheme.colorScheme.surfaceVariant,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(Modifier.padding(16.dp)) {
                Text(
                    "For your caregiver / doctor",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.SemiBold,
                )
                if (showDetail) {
                    Text(
                        "Effective accuracy: ${(effectiveAccuracy * 100).toInt()}%.",
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(top = 8.dp),
                    )
                    Text(
                        "Adaptive engine: $reason",
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }
        }
    }
}
