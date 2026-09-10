"use client";

import Link from "next/link";
import { Home, RotateCcw } from "lucide-react";
import { SpeakButton } from "@/components/patient/SpeakButton";
import type { Adaptive } from "@/lib/use-game-session";
import { fmt, type Dict } from "@/lib/i18n";

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
      <div className="h-64 animate-pulse rounded-3xl border border-border bg-surface" />
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
    const praise = fmt(t.wellDoneToday, { name: patientName });
    return (
      <div className="space-y-6 text-center">
        <div className="text-6xl" aria-hidden>
          🌼
        </div>
        <h1 className="text-3xl font-bold">{praise}</h1>
        <p className="text-xl text-muted">{t.youFinished}</p>
        <div className="flex justify-center">
          <SpeakButton
            text={`${praise} ${t.youFinished}`}
            lang={speechTag}
            label={t.hearThis}
          />
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={onPlayAgain}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-6 text-2xl font-semibold text-primary-fg"
          >
            <RotateCcw className="h-7 w-7" /> {t.playAgain}
          </button>
          <Link
            href={homeHref}
            className="flex items-center justify-center gap-2 rounded-2xl border border-border px-6 py-5 text-xl font-medium"
          >
            <Home className="h-6 w-6" /> {t.goHome}
          </Link>
        </div>

        <details className="mt-4 rounded-xl border border-border bg-surface p-4 text-left text-sm text-muted">
          <summary className="cursor-pointer font-medium">
            {t.forYourCaregiver}
          </summary>
          <p className="mt-2">
            Effective accuracy: {(adaptive.effectiveAccuracy * 100).toFixed(0)}%.
          </p>
          <p className="mt-1">Adaptive engine: {adaptive.reason}</p>
        </details>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-navy">{title}</h1>
        {headerRight}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <p className="flex-1 text-lg text-muted">{instruction}</p>
        <SpeakButton text={instruction} lang={speechTag} label={t.hear} />
      </div>
      {children}
    </div>
  );
}
