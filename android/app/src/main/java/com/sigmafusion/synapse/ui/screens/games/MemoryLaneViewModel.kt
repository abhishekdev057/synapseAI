package com.sigmafusion.synapse.ui.screens.games

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sigmafusion.synapse.core.TimeUtils
import com.sigmafusion.synapse.data.SynapseRepository
import com.sigmafusion.synapse.domain.CognitiveDomain
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlin.math.min
import kotlin.math.roundToInt

/** NER-themed picture set for the matching game. */
private val SYMBOLS = listOf(
    "🦏", "🐘", "🍵", "🎋", "🏔️", "🛶", "🥭", "🌾",
    "🥁", "🌺", "🐓", "🏞️", "🫖", "🐟", "🌸", "🪷",
)

data class Card(val uid: Int, val symbol: String, val matched: Boolean = false)

enum class Phase { LOADING, PLAYING, DONE }

data class MemoryLaneUi(
    val phase: Phase = Phase.LOADING,
    val firstName: String = "",
    val speechTag: String = "en-IN",
    val difficulty: Int = 3,
    val deck: List<Card> = emptyList(),
    val flipped: List<Int> = emptyList(),
    val showAll: Boolean = false,
    val pairsFound: Int = 0,
    val pairsTotal: Int = 0,
    val decisionReason: String = "",
    val effectiveAccuracy: Double = 0.0,
)

class MemoryLaneViewModel(private val repo: SynapseRepository) : ViewModel() {

    private val _ui = MutableStateFlow(MemoryLaneUi())
    val ui: StateFlow<MemoryLaneUi> = _ui

    private var attempts = 0
    private var hintsUsed = 0
    private var startedAt = 0L
    private var saving = false

    init {
        viewModelScope.launch {
            val name = repo.patient.first()?.firstName.orEmpty()
            val tag = repo.languageTag.first()
            val decision = repo.recommendDifficulty("memory_lane")
            _ui.value = _ui.value.copy(firstName = name, speechTag = tag)
            startRound(decision.next)
        }
    }

    private fun pairCountFor(difficulty: Int): Int =
        maxOf(3, min(10, 2 + (difficulty * 0.8).roundToInt()))

    fun startRound(difficulty: Int) {
        val pairs = pairCountFor(difficulty)
        val chosen = SYMBOLS.shuffled().take(pairs)
        val deck = chosen.flatMapIndexed { i, s ->
            listOf(Card(i * 2, s), Card(i * 2 + 1, s))
        }.shuffled()

        attempts = 0
        hintsUsed = 0
        startedAt = TimeUtils.now()
        saving = false
        _ui.value = _ui.value.copy(
            phase = Phase.PLAYING,
            difficulty = difficulty,
            deck = deck,
            flipped = emptyList(),
            showAll = false,
            pairsFound = 0,
            pairsTotal = pairs,
        )
    }

    fun onFlip(uid: Int) {
        val s = _ui.value
        if (s.phase != Phase.PLAYING || s.showAll) return
        if (s.flipped.contains(uid) || s.flipped.size == 2) return
        val card = s.deck.firstOrNull { it.uid == uid } ?: return
        if (card.matched) return

        val nextFlipped = s.flipped + uid
        _ui.value = s.copy(flipped = nextFlipped)
        if (nextFlipped.size < 2) return

        attempts++
        val a = s.deck.first { it.uid == nextFlipped[0] }
        val b = s.deck.first { it.uid == nextFlipped[1] }

        viewModelScope.launch {
            if (a.symbol == b.symbol) {
                delay(320)
                val newDeck = _ui.value.deck.map {
                    if (it.symbol == a.symbol) it.copy(matched = true) else it
                }
                val found = newDeck.count { it.matched } / 2
                _ui.value = _ui.value.copy(deck = newDeck, flipped = emptyList(), pairsFound = found)
                if (found == _ui.value.pairsTotal) finishRound()
            } else {
                delay(900)
                _ui.value = _ui.value.copy(flipped = emptyList())
            }
        }
    }

    fun hint() {
        if (_ui.value.showAll) return
        hintsUsed++
        _ui.value = _ui.value.copy(showAll = true)
        viewModelScope.launch {
            delay(1600)
            _ui.value = _ui.value.copy(showAll = false)
        }
    }

    private fun finishRound() {
        if (saving) return
        saving = true
        val s = _ui.value
        val elapsed = TimeUtils.now() - startedAt
        val accuracy = if (attempts > 0) min(1.0, s.pairsTotal.toDouble() / attempts) else 1.0

        viewModelScope.launch {
            val decision = repo.recordRound(
                SynapseRepository.RoundInput(
                    gameKey = "memory_lane",
                    domain = CognitiveDomain.MEMORY.wire,
                    difficulty = s.difficulty,
                    accuracy = (accuracy * 1000).roundToInt() / 1000.0,
                    reactionTimeMs = (elapsed / s.pairsTotal).toInt(),
                    hintsUsed = hintsUsed,
                    roundsCompleted = s.pairsTotal,
                ),
            )
            _ui.value = _ui.value.copy(
                phase = Phase.DONE,
                decisionReason = decision.reason,
                effectiveAccuracy = decision.effectiveAccuracy,
                difficulty = decision.next,
            )
        }
    }

    fun playAgain() = startRound(_ui.value.difficulty)
}
