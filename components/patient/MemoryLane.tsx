"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, Home, RotateCcw } from "lucide-react";
import Link from "next/link";
import { SpeakButton } from "@/components/patient/SpeakButton";

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
  initialDifficulty,
  initialReason,
}: {
  patientId: string;
  patientName: string;
  speechTag: string;
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
      <div className="space-y-6 text-center">
        <div className="text-6xl" aria-hidden>
          🌼
        </div>
        <h1 className="text-3xl font-bold">Well done today, {patientName}.</h1>
        <p className="text-xl text-muted">
          You finished the game. Your family and doctor can see that you played.
        </p>
        <div className="flex justify-center">
          <SpeakButton
            text={`Well done today, ${patientName}. You finished the game.`}
            lang={speechTag}
            label="Hear this"
          />
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={() => {
              setDifficulty(adaptive.next);
              resetRound(adaptive.next);
            }}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-6 text-2xl font-semibold text-primary-fg"
          >
            <RotateCcw className="h-7 w-7" /> Play again
          </button>
          <Link
            href="/patient"
            className="flex items-center justify-center gap-2 rounded-2xl border border-border px-6 py-5 text-xl font-medium"
          >
            <Home className="h-6 w-6" /> Go home
          </Link>
        </div>

        <details className="mt-4 rounded-xl border border-border bg-surface p-4 text-left text-sm text-muted">
          <summary className="cursor-pointer font-medium">
            For your caregiver / doctor
          </summary>
          <p className="mt-2">
            Effective accuracy: {(adaptive.effectiveAccuracy * 100).toFixed(0)}%.
          </p>
          <p className="mt-1">Adaptive engine: {adaptive.reason}</p>
        </details>
      </div>
    );
  }

  const cols = pairs <= 4 ? "grid-cols-2" : pairs <= 6 ? "grid-cols-3" : "grid-cols-4";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Memory Lane</h1>
        <button
          onClick={hint}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-base font-medium"
        >
          <Eye className="h-5 w-5" /> Show all
        </button>
      </div>
      <p className="text-lg text-muted">
        Find the two cards that match. Take your time.
      </p>

      <div className={`grid ${cols} gap-3`}>
        {deck.map((c) => {
          const isUp = showAll || c.matched || flipped.includes(c.uid);
          return (
            <button
              key={c.uid}
              onClick={() => onFlip(c.uid)}
              aria-label={isUp ? c.symbol : "hidden card"}
              className={`flex aspect-square items-center justify-center rounded-2xl border text-5xl transition ${
                isUp
                  ? "border-primary bg-primary/5"
                  : "border-border bg-surface active:scale-95"
              } ${c.matched ? "opacity-60" : ""}`}
            >
              <span aria-hidden>{isUp ? c.symbol : ""}</span>
            </button>
          );
        })}
      </div>

      <p className="text-center text-lg text-muted">
        {matchedCount} of {pairs} pairs found
      </p>
    </div>
  );
}
