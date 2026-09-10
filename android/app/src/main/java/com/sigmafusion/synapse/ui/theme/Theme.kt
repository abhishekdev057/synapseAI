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
    primary = Green600,
    onPrimary = Color.White,
    primaryContainer = Green200,
    onPrimaryContainer = Color(0xFF08321C),
    secondary = Blue600,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFD7E6FB),
    onSecondaryContainer = Color(0xFF0B2C52),
    tertiary = Navy700,
    onTertiary = Color.White,
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
    primary = Color(0xFF46B877),
    onPrimary = Color(0xFF04140B),
    primaryContainer = Green700,
    onPrimaryContainer = Color(0xFFCDEFDA),
    secondary = Color(0xFF7FB2F0),
    onSecondary = Color(0xFF06213B),
    secondaryContainer = Color(0xFF1B3A5C),
    onSecondaryContainer = Color(0xFFD7E6FB),
    tertiary = Color(0xFFB9CFEA),
    onTertiary = Color(0xFF0C243E),
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
    @Suppress("UNUSED_PARAMETER") darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    // The Cognitive Companion look is a single bright, high-contrast theme —
    // a deliberate accessibility choice for older eyes. DarkColors is kept for
    // reference but not applied.
    val colors = LightColors
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
