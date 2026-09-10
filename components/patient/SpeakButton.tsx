"use client";

import { Volume2 } from "lucide-react";
import { useCallback } from "react";

/**
 * Voice-assisted interaction. Uses the browser's built-in speech synthesis so
 * it works offline once voices are installed. `lang` is a BCP-47 tag; NER
 * languages without a system voice fall back to the default voice — in the
 * real app these are pre-recorded human clips (see docs, tiered voice plan).
 */
export function SpeakButton({
  text,
  lang = "en-IN",
  label = "Read aloud",
  className,
}: {
  text: string;
  lang?: string;
  label?: string;
  className?: string;
}) {
  const speak = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }, [text, lang]);

  return (
    <button
      type="button"
      onClick={speak}
      className={
        className ??
        "inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-base font-medium"
      }
      aria-label={label}
    >
      <Volume2 className="h-5 w-5" /> {label}
    </button>
  );
}
