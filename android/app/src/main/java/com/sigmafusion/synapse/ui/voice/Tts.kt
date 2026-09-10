package com.sigmafusion.synapse.ui.voice

import android.speech.tts.TextToSpeech
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.util.Locale

/**
 * Voice-assisted interaction. Wraps Android's on-device [TextToSpeech] so it
 * works offline once a language pack is installed. For NER languages without a
 * TTS voice the engine falls back to its default voice — in production these
 * strings are pre-recorded human clips (see the tiered voice plan in docs).
 */
class Speaker internal constructor(private val tts: TextToSpeech) {
    var languageTag: String = "en-IN"

    fun speak(text: String) {
        if (text.isBlank()) return
        runCatching { tts.language = Locale.forLanguageTag(languageTag) }
        tts.setSpeechRate(0.9f)
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, text.hashCode().toString())
    }

    fun stop() = tts.stop()
}

@Composable
fun rememberSpeaker(languageTag: String = "en-IN"): Speaker {
    val context = LocalContext.current
    val engine = remember {
        TextToSpeech(context.applicationContext, null)
    }
    val speaker = remember { Speaker(engine) }
    speaker.languageTag = languageTag

    DisposableEffect(Unit) {
        onDispose {
            engine.stop()
            engine.shutdown()
        }
    }
    return speaker
}

@Composable
fun SpeakButton(
    text: String,
    speaker: Speaker,
    modifier: Modifier = Modifier,
    label: String = "Read aloud",
) {
    TextButton(onClick = { speaker.speak(text) }, modifier = modifier) {
        Icon(
            Icons.AutoMirrored.Filled.VolumeUp,
            contentDescription = label,
            modifier = Modifier.size(28.dp),
        )
        Text("  $label", style = MaterialTheme.typography.labelMedium, fontSize = 18.sp)
    }
}
