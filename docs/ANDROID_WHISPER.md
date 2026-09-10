# On-device speech on Android — what ships, and the Whisper question

## What ships now

Both halves of voice run through the **platform's own on-device engines**:

| | API | Where the model lives | Offline? | RAM cost to our app |
|---|---|---|---|---|
| Text-to-speech | `android.speech.tts.TextToSpeech` (`ui/voice/Tts.kt`) | system TTS service | yes, once a language pack is installed | ~0 — it's a shared service |
| Speech-to-text | `android.speech.SpeechRecognizer` (`ui/voice/Recognizer.kt`) | system recognition service (Google app / OEM) | yes on modern Android with the language pack; falls back to network otherwise | ~0 — shared service, `EXTRA_PREFER_OFFLINE` set |

This is deliberately the right choice for the problem statement's target — cheap
Android tablets and phones with **100–500 MB of usable RAM**. The recognizer and
synthesiser run in a separate system process, so our app's heap is untouched and
the app keeps working when the device is under memory pressure.

For NER languages with no system voice (Meitei, Khasi, Nagamese, …) `Tts.kt`
degrades **requested language → Hindi → device default**, and the production
plan remains small **Piper** voices or **pre-recorded human clips** keyed to the
UI strings.

## Why a bundled Whisper / on-device LLM is *not* the baseline

The ask was "bundle Whisper (or a small LLM) so it runs on every device,
including 100–500 MB RAM ones." That target cannot be met:

- **whisper.cpp `tiny` (int8)** is ~75 MB of weights on disk and needs roughly
  **250–400 MB of working RAM** during inference. On a 500 MB *total* device the
  OS + zygote already hold most of that; the low-memory killer reaps the app or
  it ANRs mid-transcription.
- Bundling `ggml-tiny.bin` as an asset takes the debug APK from **18 MB → ~95 MB**,
  which then rides along to `public/downloads/synapse-patient.apk` and every
  patient's metered download — the opposite of what a low-connectivity NER
  deployment wants.
- A "small LLM" on-device (Gemma 3 270M, Qwen2.5-0.5B, TinyLlama) needs
  **300 MB – 1 GB** quantised. Same outcome, worse.

So Whisper is treated as an **opt-in enhancement for capable hardware
(≥ 2 GB RAM)**, never the thing every device loads.

## The seam it plugs into

`VoiceRecognizer.listen(...)` in `ui/voice/Recognizer.kt` is the single
call-site the games use for a spoken answer. A `NativeWhisperTranscriber` would
implement the same shape:

```
interface Transcriber {
    val ready: Boolean
    fun transcribe(pcm16: ShortArray, sampleRateHz: Int, languageTag: String): String
}
```

and `VoiceInputButton` would pick it over `SpeechRecognizer` only when

```
activityManager.memoryClass >= 192   // ~2 GB device
&& whisperModel.isDownloaded()       // fetched on Wi-Fi, on request — not bundled
```

### To finish the native path

1. Add `externalNativeBuild { cmake { … } }` + NDK to `app/build.gradle.kts`.
2. Vendor `whisper.cpp` (`ggml.c`, `whisper.cpp`, JNI glue) under
   `app/src/main/cpp/`, or depend on a maintained AAR once one is published to a
   CSP-allowed Maven repo.
3. Ship a **downloader** for `ggml-tiny-q5_1.bin` (~31 MB) to app-private
   storage, gated on Wi-Fi + the RAM check above. Do **not** put it in `assets/`.
4. Capture mic audio with `AudioRecord` at 16 kHz mono PCM16, feed 30 s windows
   to `whisper_full`, return the text through `Transcriber`.
5. Keep `SpeechRecognizer` as the automatic fallback for every device that
   fails the gate — which is the whole 100–500 MB tier.
