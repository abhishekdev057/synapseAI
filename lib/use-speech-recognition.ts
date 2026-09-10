"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getRecognitionCtor } from "@/lib/speech";

export interface UseRecognitionOptions {
  /** BCP-47 tag, e.g. "hi-IN". */
  lang?: string;
  /** Keep listening until stopped. Default false (one phrase). */
  continuous?: boolean;
  /** Emit partial results while the person is still speaking. Default true. */
  interimResults?: boolean;
}

export type RecognitionError =
  | "not-supported"
  | "no-permission"
  | "no-speech"
  | "network"
  | "aborted"
  | "unknown";

interface UseRecognition {
  start: () => void;
  stop: () => void;
  abort: () => void;
  reset: () => void;
  listening: boolean;
  /** Everything recognised so far this session (final results joined). */
  transcript: string;
  /** The current partial phrase, not yet finalised. */
  interim: string;
  error: RecognitionError | null;
  supported: boolean;
}

/**
 * Speech-to-text via the platform recognizer (Android `SpeechRecognizer` /
 * iOS dictation / desktop browser engine). Cheap on memory because the model
 * lives in a system service, and on modern Android it runs offline once the
 * language pack is downloaded. Callers get a clean state machine; the noisy
 * vendor API stays in here.
 */
export function useSpeechRecognition(
  opts: UseRecognitionOptions = {},
): UseRecognition {
  const { lang = "en-IN", continuous = false, interimResults = true } = opts;

  const [supported] = useState(() => getRecognitionCtor() !== null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<RecognitionError | null>(null);

  const recRef = useRef<SpeechRecognition | null>(null);
  const wantStopRef = useRef(false);

  // (Re)build the recognizer when the config changes.
  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = continuous;
    rec.interimResults = interimResults;
    rec.maxAlternatives = 1;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let finalChunk = "";
      let partial = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalChunk += res[0].transcript;
        else partial += res[0].transcript;
      }
      if (finalChunk) {
        setTranscript((prev) => (prev ? `${prev} ${finalChunk}` : finalChunk).trim());
      }
      setInterim(partial);
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      const map: Record<string, RecognitionError> = {
        "not-allowed": "no-permission",
        "service-not-allowed": "no-permission",
        "no-speech": "no-speech",
        network: "network",
        aborted: "aborted",
      };
      setError(map[event.error] ?? "unknown");
    };

    rec.onend = () => {
      setInterim("");
      // Some engines stop on their own mid-phrase; restart unless the caller
      // asked us to stop.
      if (continuous && !wantStopRef.current) {
        try {
          rec.start();
          return;
        } catch {
          /* fall through to "not listening" */
        }
      }
      setListening(false);
    };

    recRef.current = rec;
    return () => {
      wantStopRef.current = true;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.abort();
      } catch {
        /* already dead */
      }
      recRef.current = null;
    };
  }, [lang, continuous, interimResults]);

  const start = useCallback(() => {
    if (!recRef.current) {
      setError("not-supported");
      return;
    }
    setError(null);
    setInterim("");
    wantStopRef.current = false;
    try {
      recRef.current.start();
      setListening(true);
    } catch {
      // start() throws if already running — treat as already listening.
      setListening(true);
    }
  }, []);

  const stop = useCallback(() => {
    wantStopRef.current = true;
    recRef.current?.stop();
    setListening(false);
  }, []);

  const abort = useCallback(() => {
    wantStopRef.current = true;
    recRef.current?.abort();
    setListening(false);
    setInterim("");
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setInterim("");
    setError(null);
  }, []);

  return {
    start,
    stop,
    abort,
    reset,
    listening,
    transcript,
    interim,
    error,
    supported,
  };
}
