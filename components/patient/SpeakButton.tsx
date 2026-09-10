"use client";

import { Volume2, Square } from "lucide-react";
import { useEffect } from "react";
import { useSpeech } from "@/lib/use-speech";
import { useIsClient } from "@/lib/use-is-client";
import { cn } from "@/lib/utils";

/**
 * Voice-assisted "read this to me" control. Uses the platform's on-device
 * speech synthesis (see `lib/use-speech.ts`), so it works offline once the OS
 * has a voice for the language. NER languages with no system voice fall back to
 * the default voice — in the real app these strings are pre-recorded human
 * clips (see docs, tiered voice plan).
 *
 * Press once to hear it, press again to stop. The button animates while
 * speaking so it is obvious what is happening.
 */
export function SpeakButton({
  text,
  lang = "en-IN",
  label = "Read aloud",
  className,
  autoSpeak = false,
  iconOnly = false,
}: {
  text: string;
  lang?: string;
  label?: string;
  className?: string;
  /** Speak once automatically when mounted (e.g. a game round intro). */
  autoSpeak?: boolean;
  /** Show just the speaker icon; `label` still names it for screen readers. */
  iconOnly?: boolean;
}) {
  const { speak, stop, speaking, supported } = useSpeech();

  // Only trust `supported` after mount — the server can't know, and rendering
  // differently on the first client pass would be a hydration mismatch.
  const mounted = useIsClient();

  useEffect(() => {
    if (autoSpeak && mounted && supported && text.trim()) {
      const id = setTimeout(() => speak(text, { lang }), 350);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSpeak, mounted, supported, text, lang]);

  // Render the button by default; only hide it once we're sure (post-mount)
  // that this device can't synthesise speech.
  if (mounted && !supported) return null;

  return (
    <button
      type="button"
      onClick={() => (speaking ? stop() : speak(text, { lang }))}
      aria-label={label}
      aria-pressed={speaking}
      className={cn(
        className ??
          "inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-base font-medium",
        speaking && "border-primary text-primary",
      )}
    >
      {speaking ? (
        <Square className="h-5 w-5 fill-current" />
      ) : (
        <Volume2 className="h-5 w-5" />
      )}
      {!iconOnly && <span>{label}</span>}
      {speaking && (
        <span className="flex items-end gap-0.5" aria-hidden>
          <span className="h-2 w-1 animate-[pulse_0.9s_ease-in-out_infinite] rounded-full bg-current" />
          <span className="h-3 w-1 animate-[pulse_0.9s_ease-in-out_0.15s_infinite] rounded-full bg-current" />
          <span className="h-2 w-1 animate-[pulse_0.9s_ease-in-out_0.3s_infinite] rounded-full bg-current" />
        </span>
      )}
    </button>
  );
}
