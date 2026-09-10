package com.sigmafusion.synapse.ui.voice

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat

/**
 * Speech-to-text through the platform recognizer ([SpeechRecognizer]). This is
 * the right STT for very low-end devices: the model lives in a shared system
 * service (Google app / Samsung / device OEM), not in this process's heap, and
 * on modern Android it runs offline once the language pack is downloaded.
 *
 * A heavier on-device path (bundled Whisper) is described in
 * `docs/ANDROID_WHISPER.md`; [Transcriber] is the seam it would plug into.
 */
class VoiceRecognizer(context: Context) {

    private val appContext = context.applicationContext
    private var recognizer: SpeechRecognizer? = null

    val available: Boolean = SpeechRecognizer.isRecognitionAvailable(appContext)

    fun hasPermission(): Boolean =
        ContextCompat.checkSelfPermission(appContext, Manifest.permission.RECORD_AUDIO) ==
            PackageManager.PERMISSION_GRANTED

    /**
     * Listen for one phrase. [onPartial] fires with best-guess text as the
     * person speaks; [onResult] fires once with the final text; [onError] fires
     * with a short reason. All callbacks arrive on the main thread.
     */
    fun listen(
        languageTag: String,
        onPartial: (String) -> Unit = {},
        onResult: (String) -> Unit,
        onError: (String) -> Unit = {},
        onEnd: () -> Unit = {},
    ) {
        if (!available) {
            onError("unavailable"); onEnd(); return
        }
        if (!hasPermission()) {
            onError("no-permission"); onEnd(); return
        }
        recognizer?.destroy()
        val rec = SpeechRecognizer.createSpeechRecognizer(appContext)
        recognizer = rec

        rec.setRecognitionListener(object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {}
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {}
            override fun onBufferReceived(buffer: ByteArray?) {}
            override fun onEndOfSpeech() {}

            override fun onPartialResults(partialResults: Bundle?) {
                partialResults
                    ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    ?.firstOrNull()
                    ?.let(onPartial)
            }

            override fun onResults(results: Bundle?) {
                val text = results
                    ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    ?.firstOrNull()
                    .orEmpty()
                if (text.isBlank()) onError("no-speech") else onResult(text)
                onEnd()
            }

            override fun onError(error: Int) {
                onError(
                    when (error) {
                        SpeechRecognizer.ERROR_NO_MATCH,
                        SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "no-speech"
                        SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "no-permission"
                        SpeechRecognizer.ERROR_NETWORK,
                        SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "network"
                        else -> "failed"
                    },
                )
                onEnd()
            }

            override fun onEvent(eventType: Int, params: Bundle?) {}
        })

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(
                RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                RecognizerIntent.LANGUAGE_MODEL_FREE_FORM,
            )
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, languageTag)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
            }
        }
        rec.startListening(intent)
    }

    fun stop() {
        recognizer?.stopListening()
    }

    fun destroy() {
        recognizer?.destroy()
        recognizer = null
    }
}

@Composable
fun rememberVoiceRecognizer(): VoiceRecognizer {
    val context = LocalContext.current
    val rec = remember { VoiceRecognizer(context) }
    DisposableEffect(Unit) { onDispose { rec.destroy() } }
    return rec
}

/**
 * Press-to-talk button for the games that accept a spoken answer. Hides itself
 * when no recognizer is present, so tap answers are never gated on voice.
 * Requests the microphone the first time it is used.
 */
@Composable
fun VoiceInputButton(
    languageTag: String,
    label: String,
    listeningLabel: String,
    onResult: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val rec = rememberVoiceRecognizer()
    if (!rec.available) return

    var listening by remember { mutableStateOf(false) }
    var hint by remember { mutableStateOf("") }
    var wantStart by remember { mutableStateOf(false) }

    fun begin() {
        hint = ""
        listening = true
        rec.listen(
            languageTag = languageTag,
            onPartial = { hint = it },
            onResult = { onResult(it); hint = "" },
            onError = { hint = it },
            onEnd = { listening = false },
        )
    }

    val permLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { granted ->
        if (granted && wantStart) begin()
        wantStart = false
    }

    OutlinedButton(
        onClick = {
            if (listening) {
                rec.stop()
            } else if (rec.hasPermission()) {
                begin()
            } else {
                wantStart = true
                permLauncher.launch(Manifest.permission.RECORD_AUDIO)
            }
        },
        modifier = modifier,
    ) {
        Icon(
            if (listening) Icons.Default.MicOff else Icons.Default.Mic,
            contentDescription = label,
            modifier = Modifier.size(28.dp),
        )
        Text(
            "  " + if (listening) listeningLabel else label,
            style = MaterialTheme.typography.labelMedium,
        )
    }
    if (hint.isNotBlank()) {
        Text(
            hint,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}
