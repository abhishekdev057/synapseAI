"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadVoices, pickVoice, ttsSupported } from "@/lib/speech";

export interface SpeakOptions {
  /** BCP-47 tag, e.g. "as-IN". */
  lang?: string;
  /** 0.1–2. Default 0.9 — a touch slow, easier for older ears. */
  rate?: number;
  pitch?: number;
  /** Called once the utterance finishes or is cancelled. */
  onEnd?: () => void;
}

interface UseSpeech {
  speak: (text: string, opts?: SpeakOptions) => void;
  stop: () => void;
  speaking: boolean;
  /** True only when the browser can synthesise speech at all. */
  supported: boolean;
}

/**
 * Text-to-speech for read-aloud buttons. Wraps `speechSynthesis` with the
 * rough edges handled:
 *   - waits for voices to load before choosing one
 *   - picks the closest voice for the requested language
 *   - keeps a `speaking` flag for the UI
 *   - works around the Chrome/Safari bug where long utterances stall after
 *     ~15s by nudging `resume()` on a timer while speaking
 *   - cancels any in-flight speech on unmount
 */
export function useSpeech(): UseSpeech {
  const [supported] = useState(ttsSupported);
  const [speaking, setSpeaking] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const keepAlive = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!supported) return;
    let alive = true;
    loadVoices().then((v) => {
      if (alive) voicesRef.current = v;
    });
    return () => {
      alive = false;
      window.speechSynthesis.cancel();
      if (keepAlive.current) clearInterval(keepAlive.current);
    };
  }, [supported]);

  const stopKeepAlive = useCallback(() => {
    if (keepAlive.current) {
      clearInterval(keepAlive.current);
      keepAlive.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    stopKeepAlive();
    setSpeaking(false);
  }, [supported, stopKeepAlive]);

  const speak = useCallback(
    (text: string, opts: SpeakOptions = {}) => {
      if (!supported || !text.trim()) return;
      const synth = window.speechSynthesis;
      synth.cancel(); // never queue — replace

      const u = new SpeechSynthesisUtterance(text);
      u.lang = opts.lang ?? "en-IN";
      u.rate = opts.rate ?? 0.9;
      u.pitch = opts.pitch ?? 1;
      const voice = pickVoice(voicesRef.current, u.lang);
      if (voice) u.voice = voice;

      u.onstart = () => {
        setSpeaking(true);
        stopKeepAlive();
        keepAlive.current = setInterval(() => {
          // Safari/Chrome pause long speech; resume() is a harmless no-op
          // when nothing is paused.
          synth.resume();
        }, 8000);
      };
      const end = () => {
        setSpeaking(false);
        stopKeepAlive();
        opts.onEnd?.();
      };
      u.onend = end;
      u.onerror = end;

      synth.speak(u);
    },
    [supported, stopKeepAlive],
  );

  return { speak, stop, speaking, supported };
}
