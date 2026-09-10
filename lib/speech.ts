/**
 * Framework-free speech primitives shared by the patient app.
 *
 * Both text-to-speech and speech recognition here delegate to the platform's
 * own on-device engines (the browser's Web Speech API, which on Android/iOS is
 * the OS TTS + recognizer). That is the right choice for very low-end devices:
 * these are shared system services, not megabytes of model loaded into the
 * page's own heap, so they cost almost nothing and keep working offline once a
 * language pack is present.
 *
 * For NER languages with no system voice the caller should fall back to a
 * pre-recorded human clip (see the tiered voice plan in docs). An optional
 * Whisper path for capable devices lives in `lib/whisper.ts`.
 */

export function ttsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

type RecognitionCtor = new () => SpeechRecognition;

/** The vendor-prefixed constructor, if the browser has one. */
export function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function sttSupported(): boolean {
  return getRecognitionCtor() !== null;
}

/**
 * Voices load asynchronously in most browsers. Resolve once the list is
 * populated, or after a short timeout so callers never hang.
 */
export function loadVoices(timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!ttsSupported()) return resolve([]);
    const synth = window.speechSynthesis;
    const now = synth.getVoices();
    if (now.length) return resolve(now);

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      synth.removeEventListener("voiceschanged", finish);
      resolve(synth.getVoices());
    };
    synth.addEventListener("voiceschanged", finish);
    setTimeout(finish, timeoutMs);
  });
}

/** Primary subtag, lower-cased: "as-IN" -> "as", "en" -> "en". */
function primary(tag: string): string {
  return tag.toLowerCase().split(/[-_]/)[0];
}

/**
 * Best available voice for a BCP-47 tag:
 *   1. exact tag match (case-insensitive)
 *   2. same language, any region ("bn-BD" for "bn-IN")
 *   3. a voice the OS marked `default`
 *   4. the first voice, or null if there are none
 */
export function pickVoice(
  voices: SpeechSynthesisVoice[],
  tag: string,
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const want = tag.toLowerCase();
  const wantLang = primary(tag);

  return (
    voices.find((v) => v.lang.toLowerCase() === want) ??
    voices.find((v) => primary(v.lang) === wantLang) ??
    voices.find((v) => v.default) ??
    voices[0] ??
    null
  );
}

/** True when the OS actually has a voice for this language (not a fallback). */
export function hasNativeVoice(
  voices: SpeechSynthesisVoice[],
  tag: string,
): boolean {
  const wantLang = primary(tag);
  return voices.some((v) => primary(v.lang) === wantLang);
}
