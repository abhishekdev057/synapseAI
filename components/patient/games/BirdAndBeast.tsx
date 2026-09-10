"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { fmt } from "@/lib/i18n";
import { useGameSession } from "@/lib/use-game-session";
import {
  GameShell,
  scaleByDifficulty,
  type GameScreenProps,
} from "@/components/patient/games/GameShell";

const TARGETS = [
  { emoji: "🦏", key: "theRhino" },
  { emoji: "🦜", key: "theHornbill" },
] as const;

const DISTRACTORS = ["🐘", "🦌", "🐐", "🐓", "🐟", "🦉", "🐝", "🐢", "🐍", "🦆"];

function shuffle<T>(a: T[]): T[] {
  return [...a].sort(() => Math.random() - 0.5);
}

interface Tile {
  id: number;
  emoji: string;
  isTarget: boolean;
}

export function BirdAndBeast(props: GameScreenProps) {
  const { patientId, patientName, speechTag, dict: t } = props;
  const [difficulty, setDifficulty] = useState(props.initialDifficulty);
  const { phase, adaptive, finish, replay } = useGameSession({
    patientId,
    gameKey: "bird_and_beast",
    domain: "attention",
    initialDifficulty: props.initialDifficulty,
    initialReason: props.initialReason,
  });

  const [round, setRound] = useState(0);
  const total = scaleByDifficulty(difficulty, 9, 24);
  const targetCount = scaleByDifficulty(difficulty, 2, 6);

  const { tiles, target } = useMemo(() => {
    const tgt = TARGETS[round % TARGETS.length];
    const distractorPool = shuffle(DISTRACTORS.filter((d) => d !== tgt.emoji));
    const arr: Tile[] = [];
    for (let i = 0; i < total; i++) {
      const isTarget = i < targetCount;
      arr.push({
        id: i,
        emoji: isTarget ? tgt.emoji : distractorPool[i % distractorPool.length],
        isTarget,
      });
    }
    return { tiles: shuffle(arr), target: tgt };
  }, [round, total, targetCount]);

  const [found, setFound] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState(0);
  const [buzz, setBuzz] = useState<number | null>(null);
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, [round]);

  const settle = useCallback(
    (hits: number) => {
      finish({
        difficulty,
        accuracy: hits / (hits + wrong),
        roundsCompleted: targetCount,
        reactionTimeMs:
          (Date.now() - startedAt.current) / Math.max(1, targetCount),
      });
    },
    [difficulty, wrong, targetCount, finish],
  );

  const tap = (tile: Tile) => {
    if (found.has(tile.id)) return;
    if (tile.isTarget) {
      const next = new Set(found);
      next.add(tile.id);
      setFound(next);
      if (next.size === targetCount) setTimeout(() => settle(next.size), 350);
    } else {
      setWrong((w) => w + 1);
      setBuzz(tile.id);
      setTimeout(() => setBuzz((v) => (v === tile.id ? null : v)), 400);
    }
  };

  const handlePlayAgain = () => {
    setDifficulty(adaptive.next);
    setFound(new Set());
    setWrong(0);
    startedAt.current = Date.now();
    setRound((r) => r + 1);
    replay();
  };

  const targetWord = t[target.key];
  const cols = total <= 9 ? "grid-cols-3" : total <= 16 ? "grid-cols-4" : "grid-cols-5";

  return (
    <GameShell
      title={t.titleBirdBeast}
      instruction={fmt(t.instrBirdBeast, { target: `${target.emoji} ${targetWord}` })}
      speechTag={speechTag}
      patientName={patientName}
      dict={t}
      phase={phase}
      adaptive={adaptive}
      onPlayAgain={handlePlayAgain}
    >
      <div className="space-y-5">
        <div className={`sy-stagger grid ${cols} gap-2.5`}>
          {tiles.map((tile) => {
            const hit = found.has(tile.id);
            return (
              <button
                key={tile.id}
                onClick={() => tap(tile)}
                aria-label={hit ? "found" : "animal"}
                className={`sy-press relative flex aspect-square items-center justify-center rounded-3xl border-2 text-[2.2rem] transition ${
                  hit
                    ? "sy-pop-in border-primary bg-primary/15 shadow-[0_8px_22px_rgba(44,138,81,0.22)]"
                    : "sy-medallion border-transparent"
                } ${buzz === tile.id ? "animate-[pulse_0.4s] !border-status-red" : ""}`}
              >
                <span aria-hidden>{tile.emoji}</span>
                {hit && (
                  <span className="absolute -right-1.5 -top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-fg shadow">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-center text-lg font-medium text-muted">
          {fmt(t.roundProgress, { a: found.size, b: targetCount })}
        </p>
      </div>
    </GameShell>
  );
}
