"use client";

import { SpeakButton } from "@/components/patient/SpeakButton";
import { GameDone } from "@/components/patient/games/GameDone";
import type { Adaptive } from "@/lib/use-game-session";
import { type Dict } from "@/lib/i18n";

/** Props every game page passes to its client component. */
export interface GameScreenProps {
  patientId: string;
  patientName: string;
  speechTag: string;
  dict: Dict;
  initialDifficulty: number;
  initialReason: string;
}

/** Placeholder shown while a game's client-only board is coming up. */
export function GameLoading({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-navy">{title}</h1>
      <div className="sy-skeleton h-64 rounded-3xl border border-border" />
    </div>
  );
}

/** difficulty 1–10 → a bounded count, e.g. list length or grid size. */
export function scaleByDifficulty(
  difficulty: number,
  min: number,
  max: number,
): number {
  const d = Math.max(1, Math.min(10, difficulty));
  return Math.round(min + ((max - min) * (d - 1)) / 9);
}

/**
 * Shared chrome for every patient game: a calm header with a "hear the
 * instructions" button, and a single gentle completion screen. No timers, no
 * scores, no failure states — the same rules Memory Lane follows.
 */
export function GameShell({
  title,
  instruction,
  speechTag,
  patientName,
  dict: t,
  phase,
  adaptive,
  onPlayAgain,
  homeHref = "/patient",
  headerRight,
  children,
}: {
  title: string;
  instruction: string;
  speechTag: string;
  patientName: string;
  dict: Dict;
  phase: "playing" | "done";
  adaptive: Adaptive;
  onPlayAgain: () => void;
  homeHref?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  if (phase === "done") {
    return (
      <GameDone
        patientName={patientName}
        speechTag={speechTag}
        dict={t}
        adaptive={adaptive}
        onPlayAgain={onPlayAgain}
        homeHref={homeHref}
      />
    );
  }

  return (
    <div className="sy-fade-rise space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[1.75rem] font-bold leading-tight text-navy">
          {title}
        </h1>
        {headerRight}
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface/60 p-4">
        <p className="flex-1 text-lg text-muted">{instruction}</p>
        <SpeakButton text={instruction} lang={speechTag} label={t.hear} />
      </div>
      {children}
    </div>
  );
}
