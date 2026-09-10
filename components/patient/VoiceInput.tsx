"use client";

import { Mic, Loader2 } from "lucide-react";
import { useEffect } from "react";
import {
  useSpeechRecognition,
  type RecognitionError,
} from "@/lib/use-speech-recognition";
import { useIsClient } from "@/lib/use-is-client";
import { cn } from "@/lib/utils";

const ERROR_TEXT: Record<RecognitionError, string> = {
  "not-supported": "Voice input is not available on this device.",
  "no-permission": "Please allow the microphone to use your voice.",
  "no-speech": "I did not hear anything. Try again.",
  network: "Voice needs a connection right now. You can tap instead.",
  aborted: "",
  unknown: "Voice did not work. You can tap instead.",
};

/**
 * A large press-to-talk button for the games that accept a spoken answer
 * (Word Garden, Song of the Hills). Uses the platform recognizer via
 * `useSpeechRecognition` — light on memory, offline on modern Android. When
 * voice is unavailable the button hides itself so the tap answers remain the
 * only path; nothing ever depends on voice alone.
 */
export function VoiceInput({
  lang = "en-IN",
  label = "Say the answer",
  listeningLabel = "Listening…",
  onResult,
  className,
}: {
  lang?: string;
  label?: string;
  listeningLabel?: string;
  onResult: (text: string) => void;
  className?: string;
}) {
  const { start, stop, listening, transcript, interim, error, supported, reset } =
    useSpeechRecognition({ lang });

  const mounted = useIsClient();

  // Hand the finished phrase up, then clear for the next turn.
  useEffect(() => {
    if (transcript && !listening) {
      onResult(transcript);
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, listening]);

  // Hide only once we're sure (post-mount) the device has no recognizer.
  if (mounted && !supported) return null;

  const msg = error ? ERROR_TEXT[error] : "";

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <button
        type="button"
        onClick={() => (listening ? stop() : (reset(), start()))}
        aria-pressed={listening}
        className={cn(
          "inline-flex items-center gap-3 rounded-2xl border px-6 py-4 text-xl font-semibold transition",
          listening
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-surface text-foreground",
        )}
      >
        {listening ? (
          <Loader2 className="h-7 w-7 animate-spin" />
        ) : (
          <Mic className="h-7 w-7" />
        )}
        {listening ? listeningLabel : label}
      </button>
      {(interim || msg) && (
        <p className="min-h-6 text-center text-base text-muted">
          {interim || msg}
        </p>
      )}
    </div>
  );
}
