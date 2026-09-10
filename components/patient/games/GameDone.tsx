"use client";

import Link from "next/link";
import { Home, RotateCcw } from "lucide-react";
import { SpeakButton } from "@/components/patient/SpeakButton";
import { Bloom } from "@/components/patient/Bloom";
import { fmt, type Dict } from "@/lib/i18n";
import type { Adaptive } from "@/lib/use-game-session";

/**
 * The single gentle completion screen shared by every game. A warm bloom
 * animation (offline Lottie, falls back to a drawn tick), the patient's name,
 * a read-aloud of the praise, then large "play again" / "go home" targets.
 * The adaptive-engine detail stays tucked away for caregivers.
 */
export function GameDone({
  patientName,
  speechTag,
  dict: t,
  adaptive,
  onPlayAgain,
  homeHref = "/patient",
}: {
  patientName: string;
  speechTag: string;
  dict: Dict;
  adaptive: Adaptive;
  onPlayAgain: () => void;
  homeHref?: string;
}) {
  const praise = fmt(t.wellDoneToday, { name: patientName });

  return (
    <div className="sy-fade-rise space-y-7 text-center">
      <div className="mx-auto flex h-44 w-44 items-center justify-center">
        <Bloom size={176} />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-navy">{praise}</h1>
        <p className="text-xl text-muted">{t.youFinished}</p>
      </div>

      <div className="flex justify-center">
        <SpeakButton
          text={`${praise} ${t.youFinished}`}
          lang={speechTag}
          label={t.hearThis}
        />
      </div>

      <div className="flex flex-col gap-3 pt-1">
        <button
          onClick={onPlayAgain}
          className="sy-press flex items-center justify-center gap-3 rounded-3xl bg-primary px-6 py-6 text-2xl font-bold text-primary-fg shadow-[0_10px_30px_rgba(44,138,81,0.3)]"
        >
          <RotateCcw className="h-7 w-7" /> {t.playAgain}
        </button>
        <Link
          href={homeHref}
          className="sy-press flex items-center justify-center gap-3 rounded-3xl border border-border bg-surface px-6 py-5 text-xl font-semibold"
        >
          <Home className="h-6 w-6" /> {t.goHome}
        </Link>
      </div>

      <details className="mx-auto max-w-md rounded-2xl border border-border bg-surface/70 p-4 text-left text-sm text-muted">
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
