package com.sigmafusion.synapse.ui.voice

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.util.Locale
import java.util.concurrent.CopyOnWriteArrayList

/**
 * Voice-assisted output. Wraps Android's on-device [TextToSpeech] so read-aloud
 * works offline once a language pack is installed.
 *
 * Fixes over the naive wrapper:
 *  - never speaks before the engine finishes initialising (utterances are
 *    queued and flushed on init),
 *  - checks the [TextToSpeech.setLanguage] result and falls back
 *    Meitei/Khasi/… → Hindi → device default when the requested NER language
 *    has no voice (production plan: pre-recorded human clips — see docs),
 *  - exposes an [isSpeaking] flag for the UI via an [UtteranceProgressListener],
 *  - `stop()` actually stops.
 */
class Speaker internal constructor(private val context: Context) {

    var languageTag: String = "en-IN"

    private var tts: TextToSpeech? = null
    private var ready = false
    private val pending = CopyOnWriteArrayList<String>()

    private val _speakingListeners = CopyOnWriteArrayList<(Boolean) -> Unit>()
    fun onSpeakingChanged(cb: (Boolean) -> Unit) { _speakingListeners += cb }
    fun removeSpeakingListener(cb: (Boolean) -> Unit) { _speakingListeners -= cb }
    private fun emitSpeaking(v: Boolean) = _speakingListeners.forEach { it(v) }

    init {
        tts = TextToSpeech(context.applicationContext) { status ->
            ready = status == TextToSpeech.SUCCESS
            if (ready) {
                tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                    override fun onStart(utteranceId: String?) { emitSpeaking(true) }
                    override fun onDone(utteranceId: String?) { emitSpeaking(false) }
                    override fun onError(utteranceId: String?) { emitSpeaking(false) }
                    override fun onError(utteranceId: String?, errorCode: Int) { emitSpeaking(false) }
                })
                val queued = pending.toList()
                pending.clear()
                queued.forEach { speak(it) }
            }
        }
    }

    private fun applyLanguage() {
        val engine = tts ?: return
        val wanted = Locale.forLanguageTag(languageTag)
        val res = engine.setLanguage(wanted)
        if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) {
            // Try Hindi (widely installed on Indian devices), then the OS default.
            val hi = engine.setLanguage(Locale("hi", "IN"))
            if (hi == TextToSpeech.LANG_MISSING_DATA || hi == TextToSpeech.LANG_NOT_SUPPORTED) {
                engine.setLanguage(Locale.getDefault())
            }
        }
    }

    fun speak(text: String) {
        if (text.isBlank()) return
        val engine = tts
        if (engine == null || !ready) {
            pending.add(text)
            return
        }
        applyLanguage()
        engine.setSpeechRate(0.9f)
        engine.speak(text, TextToSpeech.QUEUE_FLUSH, null, text.hashCode().toString())
    }

    fun stop() {
        tts?.stop()
        emitSpeaking(false)
    }

    internal fun shutdown() {
        tts?.stop()
        tts?.shutdown()
        tts = null
        ready = false
        _speakingListeners.clear()
    }
}

@Composable
fun rememberSpeaker(languageTag: String = "en-IN"): Speaker {
    val context = LocalContext.current
    val speaker = remember { Speaker(context) }
    speaker.languageTag = languageTag
    DisposableEffect(Unit) {
        onDispose { speaker.shutdown() }
    }
    return speaker
}

/**
 * "Read this to me" button. Press once to hear it, press again to stop; the
 * speaker icon pulses and swaps to a stop icon while speaking.
 */
@Composable
fun SpeakButton(
    text: String,
    speaker: Speaker,
    modifier: Modifier = Modifier,
    label: String = "Read aloud",
) {
    var speaking by remember { mutableStateOf(false) }
    DisposableEffect(speaker) {
        val cb: (Boolean) -> Unit = { speaking = it }
        speaker.onSpeakingChanged(cb)
        onDispose { speaker.removeSpeakingListener(cb) }
    }

    val pulse by rememberInfiniteTransition(label = "pulse").animateFloat(
        initialValue = 1f,
        targetValue = 1.18f,
        animationSpec = infiniteRepeatable(tween(600), RepeatMode.Reverse),
        label = "pulseScale",
    )

    TextButton(
        onClick = { if (speaking) speaker.stop() else speaker.speak(text) },
        modifier = modifier,
    ) {
        Icon(
            if (speaking) Icons.Default.Stop else Icons.AutoMirrored.Filled.VolumeUp,
            contentDescription = label,
            modifier = Modifier
                .size(28.dp)
                .then(if (speaking) Modifier.scale(pulse) else Modifier),
        )
        Text("  $label", style = MaterialTheme.typography.labelMedium, fontSize = 18.sp)
    }
}
