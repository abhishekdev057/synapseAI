package com.sigmafusion.synapse.ui.screens.games

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sigmafusion.synapse.data.SynapseRepository
import com.sigmafusion.synapse.ui.components.CelebrationBloom
import com.sigmafusion.synapse.ui.components.LoadingBlock
import com.sigmafusion.synapse.ui.components.PrimaryButton
import com.sigmafusion.synapse.ui.components.SecondaryButton
import com.sigmafusion.synapse.ui.i18n.LocalStrings
import com.sigmafusion.synapse.ui.theme.Dimens
import com.sigmafusion.synapse.ui.voice.SpeakButton
import com.sigmafusion.synapse.ui.voice.Speaker
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

enum class GamePhase { PLAYING, DONE }

data class GameUi(
    val loading: Boolean = true,
    val phase: GamePhase = GamePhase.PLAYING,
    val firstName: String = "",
    val speechTag: String = "en-IN",
    val difficulty: Int = 3,
    /** Bumped on "play again" so boards rebuild. */
    val round: Int = 0,
    val reason: String = "",
    val effectiveAccuracy: Double = 0.0,
)

/** One completed round, as the games report it. */
data class RoundOutcome(
    val accuracy: Double,
    val hintsUsed: Int = 0,
    val roundsCompleted: Int = 1,
    val reactionTimeMs: Int? = null,
)

/**
 * Shared "load the starting difficulty, persist each finished round, hand back
 * the adaptive engine's next level" logic for every game — the generic form of
 * what [MemoryLaneViewModel] does inline.
 */
class GameSessionViewModel(
    private val repo: SynapseRepository,
    private val gameKey: String,
    private val domain: String,
) : ViewModel() {

    private val _ui = MutableStateFlow(GameUi())
    val ui: StateFlow<GameUi> = _ui

    private var saving = false

    init {
        viewModelScope.launch {
            val name = repo.patient.first()?.firstName.orEmpty()
            val tag = repo.languageTag.first()
            val next = repo.recommendDifficulty(gameKey).next
            _ui.value = _ui.value.copy(
                loading = false, firstName = name, speechTag = tag, difficulty = next,
            )
        }
    }

    fun finish(outcome: RoundOutcome) {
        if (saving) return
        saving = true
        val difficulty = _ui.value.difficulty
        viewModelScope.launch {
            val decision = repo.recordRound(
                SynapseRepository.RoundInput(
                    gameKey = gameKey,
                    domain = domain,
                    difficulty = difficulty,
                    accuracy = (outcome.accuracy.coerceIn(0.0, 1.0) * 1000).roundToInt() / 1000.0,
                    reactionTimeMs = outcome.reactionTimeMs?.takeIf { it > 0 },
                    hintsUsed = outcome.hintsUsed,
                    roundsCompleted = outcome.roundsCompleted,
                ),
            )
            _ui.value = _ui.value.copy(
                phase = GamePhase.DONE,
                reason = decision.reason,
                effectiveAccuracy = decision.effectiveAccuracy,
                difficulty = decision.next,
            )
        }
    }

    fun playAgain() {
        saving = false
        _ui.value = _ui.value.copy(phase = GamePhase.PLAYING, round = _ui.value.round + 1)
    }
}

/**
 * Calm chrome shared by every game: a header, a "hear the instructions"
 * button, and one gentle completion screen. No timers, no scores, no fail
 * states — the rules Memory Lane already follows.
 */
@Composable
fun GameShell(
    title: String,
    instruction: String,
    speaker: Speaker,
    ui: GameUi,
    onPlayAgain: () -> Unit,
    onHome: () -> Unit,
    content: @Composable () -> Unit,
) {
    val t = LocalStrings.current
    when {
        ui.loading -> LoadingBlock()
        ui.phase == GamePhase.DONE -> GameDoneView(
            firstName = ui.firstName,
            reason = ui.reason,
            effectiveAccuracy = ui.effectiveAccuracy,
            speaker = speaker,
            onPlayAgain = onPlayAgain,
            onHome = onHome,
        )
        else -> Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(Dimens.screenPadding),
            verticalArrangement = Arrangement.spacedBy(Dimens.gap),
        ) {
            Text(title, style = MaterialTheme.typography.headlineSmall)
            Row(
                Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    instruction,
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.weight(1f),
                )
                SpeakButton(text = instruction, speaker = speaker, label = t.hear)
            }
            content()
        }
    }
}

@Composable
fun GameDoneView(
    firstName: String,
    reason: String,
    effectiveAccuracy: Double,
    speaker: Speaker,
    onPlayAgain: () -> Unit,
    onHome: () -> Unit,
) {
    val t = LocalStrings.current
    var showDetail by remember { mutableStateOf(false) }
    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(Dimens.screenPadding),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(Dimens.gap),
    ) {
        CelebrationBloom(modifier = Modifier.padding(top = 24.dp), size = 168.dp)
        Text(
            t.wellDoneToday(firstName),
            style = MaterialTheme.typography.headlineLarge,
            textAlign = TextAlign.Center,
        )
        Text(
            t.youFinishedGame,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
        SpeakButton(
            text = "${t.wellDoneToday(firstName)} ${t.youFinishedGame}",
            speaker = speaker,
            label = t.hearThis,
        )
        PrimaryButton(text = t.playAgain, onClick = onPlayAgain, leadingIcon = Icons.Default.Refresh)
        SecondaryButton(text = t.goHome, onClick = onHome, leadingIcon = Icons.Default.Home)
        Surface(
            onClick = { showDetail = !showDetail },
            shape = MaterialTheme.shapes.medium,
            color = MaterialTheme.colorScheme.surfaceVariant,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(Modifier.padding(16.dp)) {
                Text(
                    t.forYourCaregiver,
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.SemiBold,
                )
                if (showDetail) {
                    Text(
                        t.effectiveAccuracy((effectiveAccuracy * 100).toInt()),
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(top = 8.dp),
                    )
                    Text(t.adaptiveEngine(reason), style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
    }
}
