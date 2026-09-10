"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Eye, Undo2, X } from "lucide-react";
import { fmt } from "@/lib/i18n";
import { useGameSession } from "@/lib/use-game-session";
import {
  GameShell,
  scaleByDifficulty,
  type GameScreenProps,
} from "@/components/patient/games/GameShell";

/* Canonical order of a NER morning. Trimmed to length by difficulty. */
const STEPS: { emoji: string; label: string }[] = [
  { emoji: "🛏️", label: "Wake up" },
  { emoji: "🚰", label: "Wash your face" },
  { emoji: "🪥", label: "Brush your teeth" },
  { emoji: "🙏", label: "Morning prayer" },
  { emoji: "🍵", label: "Make tea" },
  { emoji: "🍽️", label: "Eat breakfast" },
  { emoji: "💊", label: "Take your medicine" },
];

function shuffle<T>(a: T[]): T[] {
  return [...a].sort(() => Math.random() - 0.5);
}

export function MorningRoutine(props: GameScreenProps) {
  const { patientId, patientName, speechTag, dict: t } = props;
  const [difficulty, setDifficulty] = useState(props.initialDifficulty);
  const { phase, adaptive, finish, replay } = useGameSession({
    patientId,
    gameKey: "morning_routine",
    domain: "routine_recall",
    initialDifficulty: props.initialDifficulty,
    initialReason: props.initialReason,
  });

  const [round, setRound] = useState(0);
  const count = scaleByDifficulty(difficulty, 3, STEPS.length);

  const canonical = useMemo(() => STEPS.slice(0, count), [count]);
  const pool = useMemo(() => {
    void round; // re-shuffle the chips on every new round
    return shuffle(canonical);
  }, [round, canonical]);

  const [placed, setPlaced] = useState<string[]>([]);
  const [peeks, setPeeks] = useState(0);
  const [reveal, setReveal] = useState(false);
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, [round]);

  const remaining = pool.filter((s) => !placed.includes(s.label));

  const place = (label: string) => {
    if (placed.includes(label)) return;
    const next = [...placed, label];
    setPlaced(next);
    if (next.length === canonical.length) {
      setTimeout(() => settle(next), 400);
    }
  };

  const undo = () => setPlaced((p) => p.slice(0, -1));

  const peek = () => {
    setPeeks((n) => n + 1);
    setReveal(true);
    setTimeout(() => setReveal(false), 2000);
  };

  const settle = useCallback(
    (order: string[]) => {
      const rightSpots = order.filter(
        (label, i) => canonical[i]?.label === label,
      ).length;
      const accuracy = rightSpots / canonical.length;
      finish({
        difficulty,
        accuracy,
        hintsUsed: peeks,
        roundsCompleted: canonical.length,
        reactionTimeMs:
          (Date.now() - startedAt.current) / Math.max(1, canonical.length),
      });
    },
    [canonical, difficulty, peeks, finish],
  );

  const handlePlayAgain = () => {
    setDifficulty(adaptive.next);
    setPlaced([]);
    setPeeks(0);
    setReveal(false);
    startedAt.current = Date.now();
    setRound((r) => r + 1);
    replay();
  };

  return (
    <GameShell
      title={t.titleMorningRoutine}
      instruction={t.instrMorningRoutine}
      speechTag={speechTag}
      patientName={patientName}
      dict={t}
      phase={phase}
      adaptive={adaptive}
      onPlayAgain={handlePlayAgain}
    >
      <div className="space-y-5">
        {/* Ordered slots */}
        <ol className="space-y-2.5">
          {canonical.map((_, i) => {
            const label = placed[i];
            const step = label
              ? canonical.find((s) => s.label === label)
              : undefined;
            const correct = reveal ? canonical[i].label === label : undefined;
            return (
              <li
                key={i}
                className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-xl transition ${
                  step
                    ? "sy-pop-in border-primary bg-primary/5"
                    : "border-dashed border-border bg-surface/50"
                }`}
              >
                <span
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base font-bold ${
                    step ? "bg-primary text-primary-fg" : "bg-border text-muted"
                  }`}
                >
                  {i + 1}
                </span>
                {step ? (
                  <>
                    <span
                      className="sy-medallion inline-flex h-11 w-11 items-center justify-center text-2xl"
                      aria-hidden
                    >
                      {step.emoji}
                    </span>
                    <span className="flex-1 font-medium">{step.label}</span>
                    {reveal &&
                      (correct ? (
                        <Check className="h-6 w-6 text-primary" strokeWidth={3} />
                      ) : (
                        <X className="h-6 w-6 text-status-red" strokeWidth={3} />
                      ))}
                  </>
                ) : (
                  <span className="text-muted">…</span>
                )}
              </li>
            );
          })}
        </ol>

        {/* Remaining chips */}
        {remaining.length > 0 && (
          <div className="sy-stagger flex flex-wrap gap-3">
            {remaining.map((s) => (
              <button
                key={s.label}
                onClick={() => place(s.label)}
                className="sy-press inline-flex items-center gap-2 rounded-2xl border-2 border-border bg-surface px-4 py-3 text-lg font-semibold"
              >
                <span className="text-2xl" aria-hidden>
                  {s.emoji}
                </span>
                {s.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={peek}
            className="sy-press inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-base font-medium"
          >
            <Eye className="h-5 w-5" /> {t.showAgain}
          </button>
          {placed.length > 0 && (
            <button
              onClick={undo}
              className="sy-press inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-base font-medium"
            >
              <Undo2 className="h-5 w-5" /> {t.undo}
            </button>
          )}
          <p className="text-lg font-medium text-muted">
            {fmt(t.roundProgress, { a: placed.length, b: canonical.length })}
          </p>
        </div>
      </div>
    </GameShell>
  );
}
