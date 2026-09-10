package com.sigmafusion.synapse.ui.components

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathMeasure
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.sigmafusion.synapse.ui.theme.Blue600
import com.sigmafusion.synapse.ui.theme.Mustard
import com.sigmafusion.synapse.ui.theme.Navy700
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.sin

/**
 * A soft circular holder that makes an emoji read as an illustration — a subtle
 * radial "lit from above" gradient and a lifted shadow.
 */
@Composable
fun Medallion(
    modifier: Modifier = Modifier,
    size: Dp = 56.dp,
    content: @Composable () -> Unit,
) {
    Box(
        modifier
            .size(size)
            .shadow(6.dp, CircleShape, clip = false)
            .background(
                Brush.radialGradient(
                    0f to Color.White,
                    0.7f to Color(0xFFF1F6FC),
                    1f to Color(0xFFE6EEF8),
                ),
                CircleShape,
            ),
        contentAlignment = Alignment.Center,
        content = { content() },
    )
}

/**
 * The Synapse mark as a living illustration: a breathing core and three nodes
 * drifting around it. Compose-native (no asset), still under the single bright
 * theme.
 */
@Composable
fun BrandOrb(modifier: Modifier = Modifier, size: Dp = 64.dp) {
    val t = rememberInfiniteTransition(label = "orb")
    val breathe by t.animateFloat(
        initialValue = 0.94f,
        targetValue = 1.06f,
        animationSpec = infiniteRepeatable(tween(2200, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "breathe",
    )
    val spin by t.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(12000, easing = LinearEasing)),
        label = "spin",
    )
    val green = com.sigmafusion.synapse.ui.theme.Green600
    Box(modifier.size(size), contentAlignment = Alignment.Center) {
        Canvas(Modifier.size(size)) {
            val c = center
            val rad = size.toPx()
            drawCircle(green, radius = rad * 0.44f, center = c, alpha = 0.12f)
            scale(breathe, pivot = c) { drawCircle(green, radius = rad * 0.26f, center = c) }
        }
        Canvas(Modifier.size(size).rotate(spin)) {
            val c = center
            val rad = size.toPx()
            val nodes = listOf(
                Triple(0.0, rad * 0.40f, Navy700),
                Triple(120.0, rad * 0.40f, Mustard),
                Triple(240.0, rad * 0.40f, Blue600),
            )
            nodes.forEach { (deg, dist, color) ->
                val a = Math.toRadians(deg - 90)
                val p = Offset(c.x + cos(a).toFloat() * dist, c.y + sin(a).toFloat() * dist)
                drawLine(color.copy(alpha = 0.25f), c, p, strokeWidth = 2.dp.toPx())
                drawCircle(color, radius = rad * 0.07f, center = p)
            }
        }
    }
}

/**
 * The round-complete celebration: a green disc springs open, a white tick draws
 * itself on, a ring pulses outward, and a few sparks fly. Plays once when it
 * enters composition.
 */
@Composable
fun CelebrationBloom(modifier: Modifier = Modifier, size: Dp = 160.dp) {
    val disc = remember { Animatable(0f) }
    val check = remember { Animatable(0f) }
    val ring = remember { Animatable(0f) }
    val spark = remember { Animatable(0f) }

    androidx.compose.runtime.LaunchedEffect(Unit) {
        launch { disc.animateTo(1f, spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = 260f)) }
        launch { delay(110); ring.animateTo(1f, tween(600, easing = FastOutSlowInEasing)) }
        launch { delay(140); spark.animateTo(1f, tween(720, easing = FastOutSlowInEasing)) }
        launch { delay(240); check.animateTo(1f, tween(420, easing = FastOutSlowInEasing)) }
    }

    val primary = com.sigmafusion.synapse.ui.theme.Green600
    val sparkColors = listOf(Mustard, Blue600, Navy700, Mustard, Blue600, primary)

    Canvas(modifier.size(size)) {
        val c = center
        val r = size.toPx() * 0.30f

        if (ring.value in 0f..0.999f) {
            drawCircle(
                primary,
                radius = r + size.toPx() * 0.24f * ring.value,
                center = c,
                alpha = (1f - ring.value) * 0.55f,
                style = Stroke(width = 6.dp.toPx()),
            )
        }

        for (i in 0 until 6) {
            val ang = Math.toRadians((i * 60 - 30).toDouble())
            val dist = size.toPx() * 0.44f * spark.value
            val p = Offset(c.x + cos(ang).toFloat() * dist, c.y + sin(ang).toFloat() * dist)
            val alpha = (1f - spark.value).coerceIn(0f, 1f)
            val grow = (1f - abs(spark.value - 0.4f)).coerceIn(0f, 1f)
            drawCircle(sparkColors[i], radius = 6.dp.toPx() * grow, center = p, alpha = alpha)
        }

        scale(disc.value.coerceAtLeast(0.001f), pivot = c) {
            drawCircle(primary, radius = r, center = c)
        }

        if (check.value > 0f) {
            val path = Path().apply {
                moveTo(c.x - r * 0.42f, c.y + r * 0.02f)
                lineTo(c.x - r * 0.10f, c.y + r * 0.34f)
                lineTo(c.x + r * 0.46f, c.y - r * 0.34f)
            }
            val measure = PathMeasure().apply { setPath(path, false) }
            val seg = Path()
            measure.getSegment(0f, measure.length * check.value, seg, true)
            drawPath(
                seg,
                Color.White,
                style = Stroke(width = 8.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round),
            )
        }
    }
}
