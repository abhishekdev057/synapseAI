"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play } from "lucide-react";
import { fmt } from "@/lib/i18n";
import { useGameSession } from "@/lib/use-game-session";
import {
  GameShell,
  scaleByDifficulty,
  type GameScreenProps,
} from "@/components/patient/games/GameShell";

const GRID = 9; // 3×3 loom

function makeSequence(len: number): number[] {
  const cells = [...Array(GRID).keys()];
  cells.sort(() => Math.random() - 0.5);
  return cells.slice(0, Math.min(len, GRID));
}

export function PatternOfTheLoom(props: GameScreenProps) {
  const { patientId, patientName, speechTag, dict: t } = props;
  const [difficulty, setDifficulty] = useState(props.initialDifficulty);
  const { phase, adaptive, finish, replay } = useGameSession({
    patientId,
    gameKey: "pattern_of_the_loom",
    domain: "pattern_recognition",
    initialDifficulty: props.initialDifficulty,
    initialReason: props.initialReason,
  });

  const [round, setRound] = useState(0);
  const len = scaleByDifficulty(difficulty, 2, 6);
  const sequence = useMemo(() => {
    void round; // fresh pattern on every new round
    return makeSequence(len);
  }, [round, len]);

  const [lit, setLit] = useState<number | null>(null);
  const [mode, setMode] = useState<"watch" | "input">("watch");
  const [taps, setTaps] = useState<number[]>([]);
  const [replays, setReplays] = useState(0);
  const startedAt = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const playBack = useCallback(() => {
    clearTimers();
    // Defer every state change onto a timer so this stays a pure scheduler —
    // no synchronous setState when called from an effect.
    timers.current.push(
      setTimeout(() => {
        setMode("watch");
        setTaps([]);
        setLit(null);
      }, 0),
    );
    sequence.forEach((cell, i) => {
      timers.current.push(setTimeout(() => setLit(cell), i * 800 + 250));
      timers.current.push(setTimeout(() => setLit(null), i * 800 + 850));
    });
    timers.current.push(
      setTimeout(() => {
        setMode("input");
        startedAt.current = Date.now();
      }, sequence.length * 800 + 400),
    );
  }, [sequence]);

  // Auto-play whenever a new sequence is set.
  useEffect(() => {
    playBack();
    return clearTimers;
  }, [playBack]);

  const settle = useCallback(
    (finalTaps: number[]) => {
      const right = finalTaps.filter((c, i) => sequence[i] === c).length;
      finish({
        difficulty,
        accuracy: right / sequence.length,
        hintsUsed: replays,
        roundsCompleted: sequence.length,
        reactionTimeMs:
          (Date.now() - startedAt.current) / Math.max(1, sequence.length),
      });
    },
    [sequence, difficulty, replays, finish],
  );

  const tap = (cell: number) => {
    if (mode !== "input") return;
    const next = [...taps, cell];
    setTaps(next);
    setLit(cell);
    setTimeout(() => setLit((v) => (v === cell ? null : v)), 250);
    if (next.length === sequence.length) {
      setTimeout(() => settle(next), 300);
    }
  };

  const watchAgain = () => {
    setReplays((n) => n + 1);
    playBack();
  };

  const handlePlayAgain = () => {
    setDifficulty(adaptive.next);
    setReplays(0);
    setTaps([]);
    setRound((r) => r + 1);
    replay();
  };

  return (
    <GameShell
      title={t.titlePatternLoom}
      instruction={t.instrPatternLoom}
      speechTag={speechTag}
      patientName={patientName}
      dict={t}
      phase={phase}
      adaptive={adaptive}
      onPlayAgain={handlePlayAgain}
      headerRight={
        <button
          onClick={watchAgain}
          className="sy-press inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-base font-medium"
        >
          <Play className="h-5 w-5" /> {t.showAgain}
        </button>
      }
    >
      <div className="space-y-5">
        <p
          className={`rounded-2xl py-3 text-center text-xl font-semibold transition-colors ${
            mode === "watch"
              ? "bg-mustard/15 text-[color:var(--mustard)]"
              : "bg-primary/10 text-primary"
          }`}
        >
          {mode === "watch" ? t.watchCarefully : t.nowYourTurn}
        </p>
        <div className="mx-auto grid max-w-sm grid-cols-3 gap-3">
          {Array.from({ length: GRID }, (_, i) => {
            const isLit = lit === i;
            const done = taps.length > i;
            return (
              <button
                key={i}
                onClick={() => tap(i)}
                disabled={mode !== "input"}
                aria-label={`loom cell ${i + 1}`}
                className={`sy-press aspect-square rounded-2xl border-2 transition duration-200 ${
                  isLit
                    ? "scale-105 border-mustard bg-mustard shadow-[0_10px_28px_rgba(224,138,30,0.45)]"
                    : done
                      ? "border-primary bg-primary/15"
                      : "border-border bg-tint-lavender"
                }`}
                style={{
                  backgroundImage: isLit
                    ? undefined
                    : "repeating-linear-gradient(45deg, rgba(22,58,99,0.06) 0 6px, transparent 6px 12px)",
                }}
              />
            );
          })}
        </div>
        <p className="text-center text-lg text-muted">
          {fmt(t.roundProgress, { a: taps.length, b: sequence.length })}
        </p>
      </div>
    </GameShell>
  );
}
