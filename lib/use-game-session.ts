"use client";

import { useCallback, useRef, useState } from "react";
import type { DomainKey } from "@/lib/cognitive-domains";

export interface RoundResult {
  /** Level this round was actually played at (1–10). */
  difficulty: number;
  /** Fraction correct, 0..1. */
  accuracy: number;
  hintsUsed?: number;
  roundsCompleted?: number;
  /** Mean time per item, ms. Omitted when not meaningful. */
  reactionTimeMs?: number;
}

export interface Adaptive {
  next: number;
  reason: string;
  effectiveAccuracy: number;
}

type Phase = "playing" | "done";

/**
 * Shared "finish a round and persist it" logic for every game. Mirrors what
 * Memory Lane did inline: POST the round to the sessions API, which refreshes
 * the daily rollup and returns the next-difficulty decision. Offline, the POST
 * fails quietly and the game still completes — the native app is the one that
 * queues rounds for later sync.
 */
export function useGameSession({
  patientId,
  gameKey,
  domain,
  initialDifficulty,
  initialReason,
}: {
  patientId: string;
  gameKey: string;
  domain: DomainKey;
  initialDifficulty: number;
  initialReason: string;
}) {
  const [phase, setPhase] = useState<Phase>("playing");
  const [adaptive, setAdaptive] = useState<Adaptive>({
    next: initialDifficulty,
    reason: initialReason,
    effectiveAccuracy: 0,
  });
  const saving = useRef(false);

  const finish = useCallback(
    async (r: RoundResult) => {
      if (saving.current) return;
      saving.current = true;
      setPhase("done");

      const rt = Math.round(r.reactionTimeMs ?? 0);
      const body = {
        gameKey,
        domain,
        difficulty: Math.max(1, Math.min(10, Math.round(r.difficulty))),
        accuracy: Number(Math.max(0, Math.min(1, r.accuracy)).toFixed(3)),
        ...(rt > 0 ? { reactionTimeMs: rt } : {}),
        hintsUsed: Math.max(0, r.hintsUsed ?? 0),
        roundsCompleted: Math.max(0, r.roundsCompleted ?? 1),
        completed: true,
      };

      try {
        const res = await fetch(`/api/patients/${patientId}/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data?.adaptive) setAdaptive(data.adaptive as Adaptive);
      } catch {
        /* offline — round stays local, game still ends gracefully */
      }
    },
    [patientId, gameKey, domain],
  );

  const replay = useCallback(() => {
    saving.current = false;
    setPhase("playing");
  }, []);

  return { phase, adaptive, finish, replay };
}
