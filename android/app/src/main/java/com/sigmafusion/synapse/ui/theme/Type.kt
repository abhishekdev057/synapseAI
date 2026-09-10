package com.sigmafusion.synapse.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.unit.sp

/*
 * Type scale is deliberately ~30% larger than Material's defaults and never
 * drops below 16sp. Older users read better with generous line height and
 * medium weight, so body text is Medium, not Normal.
 */
private val family = FontFamily.Default

private val lh = LineHeightStyle(
    alignment = LineHeightStyle.Alignment.Center,
    trim = LineHeightStyle.Trim.None,
)

val SynapseTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = family, fontWeight = FontWeight.Bold,
        fontSize = 48.sp, lineHeight = 54.sp, lineHeightStyle = lh,
    ),
    displayMedium = TextStyle(
        fontFamily = family, fontWeight = FontWeight.Bold,
        fontSize = 40.sp, lineHeight = 46.sp, lineHeightStyle = lh,
    ),
    headlineLarge = TextStyle(
        fontFamily = family, fontWeight = FontWeight.Bold,
        fontSize = 32.sp, lineHeight = 40.sp, lineHeightStyle = lh,
    ),
    headlineMedium = TextStyle(
        fontFamily = family, fontWeight = FontWeight.Bold,
        fontSize = 27.sp, lineHeight = 34.sp, lineHeightStyle = lh,
    ),
    titleLarge = TextStyle(
        fontFamily = family, fontWeight = FontWeight.SemiBold,
        fontSize = 23.sp, lineHeight = 30.sp, lineHeightStyle = lh,
    ),
    titleMedium = TextStyle(
        fontFamily = family, fontWeight = FontWeight.SemiBold,
        fontSize = 20.sp, lineHeight = 27.sp, lineHeightStyle = lh,
    ),
    bodyLarge = TextStyle(
        fontFamily = family, fontWeight = FontWeight.Medium,
        fontSize = 20.sp, lineHeight = 30.sp, lineHeightStyle = lh,
    ),
    bodyMedium = TextStyle(
        fontFamily = family, fontWeight = FontWeight.Medium,
        fontSize = 18.sp, lineHeight = 27.sp, lineHeightStyle = lh,
    ),
    labelLarge = TextStyle(
        fontFamily = family, fontWeight = FontWeight.SemiBold,
        fontSize = 20.sp, lineHeight = 24.sp, lineHeightStyle = lh,
    ),
    labelMedium = TextStyle(
        fontFamily = family, fontWeight = FontWeight.Medium,
        fontSize = 16.sp, lineHeight = 20.sp, lineHeightStyle = lh,
    ),
)
