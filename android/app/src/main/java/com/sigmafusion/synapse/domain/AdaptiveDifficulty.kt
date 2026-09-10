package com.sigmafusion.synapse.domain

import kotlin.math.min
import kotlin.math.roundToInt

/**
 * Dynamic Difficulty Adjustment — a Kotlin port of the web app's
 * `lib/adaptive.ts`, kept byte-for-byte equivalent in behaviour so the
 * patient's experience is the same offline on the device and online.
 *
 * Goal: keep the patient in the 75–85% accuracy "flow zone" — challenged but
 * succeeding. Pure function, no state, no network.
 */
object AdaptiveDifficulty {

    const val MIN = 1
    const val MAX = 10
    const val FLOW_LOW = 0.75
    const val FLOW_HIGH = 0.85

    data class Round(
        val accuracy: Double,
        val difficulty: Int,
        val hintsUsed: Int = 0,
        val playedAtEpochMs: Long = 0L,
    )

    data class Decision(
        val next: Int,
        val reason: String,
        val effectiveAccuracy: Double,
    )

    fun startingDifficulty(stage: String): Int = when (stage) {
        "severe" -> 1
        "moderate" -> 2
        else -> 3
    }

    private fun clamp(n: Int, lo: Int = MIN, hi: Int = MAX) = maxOf(lo, min(hi, n))

    private fun effectiveAccuracy(r: Round): Double {
        val penalty = min(0.25, r.hintsUsed * 0.05)
        return (r.accuracy - penalty).coerceIn(0.0, 1.0)
    }

    fun nextDifficulty(
        recentRounds: List<Round>,
        stage: String = "mild",
        window: Int = 3,
    ): Decision {
        if (recentRounds.isEmpty()) {
            val n = startingDifficulty(stage)
            return Decision(n, "No history yet — starting at level $n for a $stage baseline.", 0.0)
        }

        val sorted = recentRounds.sortedByDescending { it.playedAtEpochMs }
        val slice = sorted.take(window)

        var weightSum = 0.0
        var accSum = 0.0
        slice.forEachIndexed { i, r ->
            val w = (slice.size - i).toDouble()
            weightSum += w
            accSum += w * effectiveAccuracy(r)
        }
        val eff = accSum / weightSum
        val current = slice.first().difficulty
        val pct = (eff * 100).roundToInt()

        val (next, reason) = when {
            eff >= 0.95 -> clamp(current + 2) to
                "Effective accuracy $pct% — well above the flow zone; stepping up two levels."
            eff > FLOW_HIGH -> clamp(current + 1) to
                "Effective accuracy $pct% — above the 75–85% flow zone; stepping up a level."
            eff < 0.5 -> clamp(current - 2) to
                "Effective accuracy $pct% — struggling; easing down two levels."
            eff < FLOW_LOW -> clamp(current - 1) to
                "Effective accuracy $pct% — below the flow zone; easing down a level."
            else -> current to
                "Effective accuracy $pct% — inside the 75–85% flow zone; holding."
        }
        return Decision(next, reason, (eff * 1000).roundToInt() / 1000.0)
    }

    /** Friendly 0–100 score for caregiver/clinician trends. Never shown to the patient. */
    fun roundScore(r: Round): Int {
        val base = effectiveAccuracy(r) * 100
        val levelBonus = (r.difficulty - 1) * 1.5
        return (base + levelBonus).coerceIn(0.0, 100.0).roundToInt()
    }
}
