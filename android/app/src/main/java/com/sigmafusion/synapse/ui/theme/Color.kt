package com.sigmafusion.synapse.ui.theme

import androidx.compose.ui.graphics.Color

/*
 * Palette — "Cognitive Companion" theme.
 * Forest-green primary actions, calm blue for secondary, warm red reserved for
 * help/alerts, on a soft sky-tinted ground (never pure #FFFFFF, which glares
 * for older eyes). Pastel tints echo North-East Indian textiles.
 */

// Brand
val Green600 = Color(0xFF2C8A51) // primary
val Green700 = Color(0xFF1F6E3E)
val Green200 = Color(0xFFBFE4CC) // primary container (light)
val Blue600 = Color(0xFF1F6CD0) // secondary / info
val Navy700 = Color(0xFF163A63) // tertiary / headings
val Mustard = Color(0xFFE08A1E)

// Back-compat aliases (older references)
val Teal700 = Green600
val Teal600 = Green700
val Teal200 = Green200
val Indigo = Navy700
val Terracotta = Blue600

// Pastel card tints (light)
val TintPeach = Color(0xFFFDECE3)
val TintCream = Color(0xFFFBF3DE)
val TintLavender = Color(0xFFEEE7FB)
val TintMint = Color(0xFFE3F2EA)
val TintSky = Color(0xFFE6F0FC)
val TintRose = Color(0xFFFCE7EA)

// Neutrals (light)
val Ground = Color(0xFFEDF4FB)
val Surface = Color(0xFFFFFFFF)
val SurfaceAlt = Color(0xFFF1F6FC)
val InkPrimary = Color(0xFF16324F)
val InkMuted = Color(0xFF5C7086)
val OutlineLight = Color(0xFFDCE6F2)

// Neutrals (dark)
val GroundDark = Color(0xFF0B1622)
val SurfaceDark = Color(0xFF12212F)
val SurfaceAltDark = Color(0xFF16283A)
val InkPrimaryDark = Color(0xFFE7EEF6)
val InkMutedDark = Color(0xFF9FB2C4)
val OutlineDark = Color(0xFF24384C)

// Semantic status
val StatusGreen = Color(0xFF2C8A51)
val StatusAmber = Color(0xFFE08A1E)
val StatusRed = Color(0xFFDF4436)
