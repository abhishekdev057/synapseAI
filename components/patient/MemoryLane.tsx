"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye } from "lucide-react";
import { GameDone } from "@/components/patient/games/GameDone";
import { fmt, type Dict } from "@/lib/i18n";

/* Culturally-themed picture set for Memory Lane (NER motifs). */
const SYMBOLS = [
  "🦏", "🐘", "🍵", "🎋", "🏔️", "🛶", "🥭", "🌾",
  "🥁", "🌺", "🐓", "🏞️", "🫖", "🐟", "🌸", "🪷",
];

interface CardT {
  uid: number;
  symbol: string;
  matched: boolean;
}

function pairCountFor(difficulty: number): number {
  return Math.max(3, Math.min(10, 2 + Math.round(difficulty * 0.8)));
}

function buildDeck(difficulty: number): CardT[] {
  const pairs = pairCountFor(difficulty);
  const chosen = [...SYMBOLS].sort(() => Math.random() - 0.5).slice(0, pairs);
  const deck = chosen.flatMap((symbol, i) => [
    { uid: i * 2, symbol, matched: false },
    { uid: i * 2 + 1, symbol, matched: false },
  ]);
  return deck.sort(() => Math.random() - 0.5);
}

export function MemoryLane({
  patientId,
  patientName,
  speechTag,
  dict: t,
  initialDifficulty,
  initialReason,
}: {
  patientId: string;
  patientName: string;
  speechTag: string;
  dict: Dict;
  initialDifficulty: number;
  initialReason: string;
}) {
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [deck, setDeck] = useState<CardT[]>(() => buildDeck(initialDifficulty));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [phase, setPhase] = useState<"playing" | "done">("playing");
  const [adaptive, setAdaptive] = useState<{
    next: number;
    reason: string;
    effectiveAccuracy: number;
  }>({ next: initialDifficulty, reason: initialReason, effectiveAccuracy: 0 });
  const startedAt = useRef<number>(0);
  const saving = useRef(false);

  // Start the round clock on mount (kept out of render — Date.now is impure).
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const pairs = useMemo(() => deck.length / 2, [deck]);
  const matchedCount = deck.filter((c) => c.matched).length / 2;

  const resetRound = useCallback((d: number) => {
    setDeck(buildDeck(d));
    setFlipped([]);
    setAttempts(0);
    setHintsUsed(0);
    setShowAll(false);
    setPhase("playing");
    startedAt.current = Date.now();
    saving.current = false;
  }, []);

  function onFlip(uid: number) {
    if (phase !== "playing" || showAll) return;
    if (flipped.includes(uid) || flipped.length === 2) return;
    const card = deck.find((c) => c.uid === uid);
    if (!card || card.matched) return;

    const nextFlipped = [...flipped, uid];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      setAttempts((a) => a + 1);
      const [a, b] = nextFlipped.map((id) => deck.find((c) => c.uid === id)!);
      if (a.symbol === b.symbol) {
        setTimeout(() => {
          setDeck((prev) =>
            prev.map((c) =>
              c.symbol === a.symbol ? { ...c, matched: true } : c,
            ),
          );
          setFlipped([]);
        }, 350);
      } else {
        setTimeout(() => setFlipped([]), 900);
      }
    }
  }

  // Finish + persist the round.
  useEffect(() => {
    if (phase !== "playing" || matchedCount !== pairs || saving.current) return;
    saving.current = true;
    setPhase("done");

    const elapsedMs = Date.now() - startedAt.current;
    const accuracy = attempts > 0 ? Math.min(1, pairs / attempts) : 1;
    const body = {
      gameKey: "memory_lane",
      domain: "memory" as const,
      difficulty,
      accuracy: Number(accuracy.toFixed(3)),
      reactionTimeMs: Math.round(elapsedMs / pairs),
      hintsUsed,
      roundsCompleted: pairs,
      completed: true,
    };

    fetch(`/api/patients/${patientId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.adaptive) setAdaptive(data.adaptive);
      })
      .catch(() => {});
  }, [matchedCount, pairs, phase, attempts, difficulty, hintsUsed, patientId]);

  function hint() {
    if (showAll) return;
    setHintsUsed((h) => h + 1);
    setShowAll(true);
    setTimeout(() => setShowAll(false), 1600);
  }

  if (phase === "done") {
    return (
      <GameDone
        patientName={patientName}
        speechTag={speechTag}
        dict={t}
        adaptive={{
          next: adaptive.next,
          reason: adaptive.reason,
          effectiveAccuracy: adaptive.effectiveAccuracy,
        }}
        onPlayAgain={() => {
          setDifficulty(adaptive.next);
          resetRound(adaptive.next);
        }}
      />
    );
  }

  const cols = pairs <= 4 ? "grid-cols-2" : pairs <= 6 ? "grid-cols-3" : "grid-cols-4";

  return (
    <div className="sy-fade-rise space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[1.75rem] font-bold text-navy">Memory Lane</h1>
        <button
          onClick={hint}
          className="sy-press inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-base font-medium"
        >
          <Eye className="h-5 w-5" /> {t.showAll}
        </button>
      </div>
      <p className="rounded-2xl bg-surface/60 p-4 text-lg text-muted">
        {t.findTakeYourTime}
      </p>

      <div className={`sy-stagger grid ${cols} gap-3`}>
        {deck.map((c) => {
          const isUp = showAll || c.matched || flipped.includes(c.uid);
          return (
            <button
              key={c.uid}
              onClick={() => onFlip(c.uid)}
              aria-label={isUp ? c.symbol : "hidden card"}
              className={`sy-press flex aspect-square items-center justify-center rounded-3xl border-2 text-5xl transition ${
                isUp
                  ? "border-primary bg-primary/5 shadow-[0_8px_24px_rgba(44,138,81,0.18)]"
                  : "sy-medallion border-transparent"
              } ${c.matched ? "opacity-55" : ""} ${
                isUp && !c.matched ? "sy-pop-in" : ""
              }`}
            >
              <span aria-hidden>{isUp ? c.symbol : ""}</span>
            </button>
          );
        })}
      </div>

      <p className="text-center text-lg font-medium text-muted">
        {fmt(t.pairsFound, { a: matchedCount, b: pairs })}
      </p>
    </div>
  );
}
