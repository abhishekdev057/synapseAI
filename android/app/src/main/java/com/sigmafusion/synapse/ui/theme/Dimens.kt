package com.sigmafusion.synapse.ui.theme

import androidx.compose.ui.unit.dp

/** Spacing and minimum interactive sizes tuned for older users with tremor. */
object Dimens {
    val screenPadding = 20.dp
    val gap = 16.dp
    val gapLarge = 24.dp

    val cardRadius = 24.dp
    val cardPadding = 20.dp

    /** WCAG target is 44dp; we go well past it. */
    val minTouch = 64.dp
    val primaryButtonHeight = 76.dp
    val bigTileHeight = 116.dp

    val iconSmall = 24.dp
    val icon = 32.dp
    val iconLarge = 40.dp
}
