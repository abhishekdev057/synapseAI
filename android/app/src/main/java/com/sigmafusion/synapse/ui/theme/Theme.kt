package com.sigmafusion.synapse.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.dp
import androidx.core.view.WindowCompat

private val LightColors = lightColorScheme(
    primary = Teal700,
    onPrimary = Color.White,
    primaryContainer = Teal200,
    onPrimaryContainer = Color(0xFF08322E),
    secondary = Terracotta,
    onSecondary = Color.White,
    tertiary = Mustard,
    onTertiary = Color(0xFF3A2A06),
    background = Ground,
    onBackground = InkPrimary,
    surface = Surface,
    onSurface = InkPrimary,
    surfaceVariant = SurfaceAlt,
    onSurfaceVariant = InkMuted,
    outline = OutlineLight,
    outlineVariant = OutlineLight,
    error = StatusRed,
    onError = Color.White,
)

private val DarkColors = darkColorScheme(
    primary = Teal200,
    onPrimary = Color(0xFF06201D),
    primaryContainer = Teal600,
    onPrimaryContainer = Color(0xFFCDEFEA),
    secondary = Color(0xFFE79070),
    onSecondary = Color(0xFF3A1808),
    tertiary = Mustard,
    onTertiary = Color(0xFF3A2A06),
    background = GroundDark,
    onBackground = InkPrimaryDark,
    surface = SurfaceDark,
    onSurface = InkPrimaryDark,
    surfaceVariant = SurfaceAltDark,
    onSurfaceVariant = InkMutedDark,
    outline = OutlineDark,
    outlineVariant = OutlineDark,
    error = Color(0xFFE98A80),
    onError = Color(0xFF3A0F0B),
)

private val SynapseShapes = Shapes(
    extraSmall = androidx.compose.foundation.shape.RoundedCornerShape(10.dp),
    small = androidx.compose.foundation.shape.RoundedCornerShape(14.dp),
    medium = androidx.compose.foundation.shape.RoundedCornerShape(18.dp),
    large = androidx.compose.foundation.shape.RoundedCornerShape(24.dp),
    extraLarge = androidx.compose.foundation.shape.RoundedCornerShape(32.dp),
)

@Composable
fun SynapseTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colors = if (darkTheme) DarkColors else LightColors
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars =
                colors.background.luminance() > 0.5f
        }
    }
    MaterialTheme(
        colorScheme = colors,
        typography = SynapseTypography,
        shapes = SynapseShapes,
        content = content,
    )
}
