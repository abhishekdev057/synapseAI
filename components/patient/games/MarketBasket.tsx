"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Check, Eye, ShoppingBasket } from "lucide-react";
import { fmt } from "@/lib/i18n";
import { SpeakButton } from "@/components/patient/SpeakButton";
import { useGameSession } from "@/lib/use-game-session";
import {
  GameShell,
  scaleByDifficulty,
  type GameScreenProps,
} from "@/components/patient/games/GameShell";

/* A virtual haat: local goods, emoji + plain name. */
const GOODS: { emoji: string; name: string }[] = [
  { emoji: "🍚", name: "Rice" },
  { emoji: "🍵", name: "Assam tea" },
  { emoji: "🎋", name: "Bamboo shoot" },
  { emoji: "🌰", name: "Betel nut" },
  { emoji: "🐟", name: "Fish" },
  { emoji: "🥚", name: "Eggs" },
  { emoji: "🌶️", name: "Chillies" },
  { emoji: "🫚", name: "Ginger" },
  { emoji: "🎃", name: "Pumpkin" },
  { emoji: "🍊", name: "Oranges" },
  { emoji: "🥛", name: "Milk" },
  { emoji: "🧂", name: "Salt" },
  { emoji: "🥔", name: "Potatoes" },
  { emoji: "🍌", name: "Bananas" },
];

function shuffle<T>(a: T[]): T[] {
  return [...a].sort(() => Math.random() - 0.5);
}

export function MarketBasket(props: GameScreenProps) {
  const { patientId, patientName, speechTag, dict: t } = props;
  const [difficulty, setDifficulty] = useState(props.initialDifficulty);
  const { phase, adaptive, finish, replay } = useGameSession({
    patientId,
    gameKey: "market_basket",
    domain: "attention",
    initialDifficulty: props.initialDifficulty,
    initialReason: props.initialReason,
  });

  const [round, setRound] = useState(0); // bump to rebuild
  const listSize = scaleByDifficulty(difficulty, 3, 8);

  const { list, stall } = useMemo(() => {
    void round; // rebuild the basket on every new round
    const picked = shuffle(GOODS).slice(0, listSize);
    const distractorCount = Math.min(6, GOODS.length - picked.length);
    const distractors = shuffle(
      GOODS.filter((g) => !picked.includes(g)),
    ).slice(0, distractorCount);
    return { list: picked, stall: shuffle([...picked, ...distractors]) };
  }, [round, listSize]);

  const wanted = useMemo(() => new Set(list.map((g) => g.name)), [list]);

  const [step, setStep] = useState<"study" | "shop">("study");
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [peeks, setPeeks] = useState(0);
  const [showList, setShowList] = useState(false);
  const startedAt = useRef(0);

  const listText = `${t.thingsToBuy}: ${list.map((g) => g.name).join(", ")}`;

  const goShopping = useCallback(() => {
    setStep("shop");
    startedAt.current = Date.now();
  }, []);

  const toggle = (name: string) => {
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const peek = () => {
    setPeeks((p) => p + 1);
    setShowList(true);
    setTimeout(() => setShowList(false), 1800);
  };

  const done = () => {
    const correct = [...chosen].filter((n) => wanted.has(n)).length;
    const wrong = [...chosen].filter((n) => !wanted.has(n)).length;
    const accuracy = wanted.size
      ? Math.max(0, (correct - wrong) / wanted.size)
      : 1;
    const elapsed = Date.now() - startedAt.current;
    finish({
      difficulty,
      accuracy,
      hintsUsed: peeks,
      roundsCompleted: wanted.size,
      reactionTimeMs: elapsed / Math.max(1, wanted.size),
    });
  };

  const handlePlayAgain = () => {
    setDifficulty(adaptive.next);
    setStep("study");
    setChosen(new Set());
    setPeeks(0);
    setShowList(false);
    setRound((r) => r + 1);
    replay();
  };

  return (
    <GameShell
      title={t.titleMarketBasket}
      instruction={t.instrMarketBasket}
      speechTag={speechTag}
      patientName={patientName}
      dict={t}
      phase={phase}
      adaptive={adaptive}
      onPlayAgain={handlePlayAgain}
    >
      {step === "study" ? (
        <div className="space-y-5">
          <div className="rounded-3xl border border-border bg-tint-cream p-5">
            <p className="mb-3 text-lg font-semibold">{t.thingsToBuy}</p>
            <ul className="space-y-2">
              {list.map((g) => (
                <li key={g.name} className="flex items-center gap-3 text-xl">
                  <span className="text-3xl" aria-hidden>
                    {g.emoji}
                  </span>
                  {g.name}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SpeakButton
              text={listText}
              lang={speechTag}
              label={t.hearThis}
              autoSpeak
            />
            <button
              onClick={goShopping}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-4 text-xl font-semibold text-primary-fg"
            >
              <ShoppingBasket className="h-6 w-6" /> {t.goToMarket}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {stall.map((g) => {
              const picked = chosen.has(g.name);
              const reveal = showList && wanted.has(g.name);
              return (
                <button
                  key={g.name}
                  onClick={() => toggle(g.name)}
                  aria-pressed={picked}
                  className={`relative flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border text-4xl transition ${
                    picked
                      ? "border-primary bg-primary/10"
                      : "border-border bg-surface active:scale-95"
                  } ${reveal ? "ring-2 ring-mustard" : ""}`}
                >
                  <span aria-hidden>{g.emoji}</span>
                  <span className="text-sm font-medium">{g.name}</span>
                  {picked && (
                    <Check className="absolute right-1 top-1 h-5 w-5 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={peek}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-base font-medium"
            >
              <Eye className="h-5 w-5" /> {t.showAgain}
            </button>
            <button
              onClick={done}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-4 text-xl font-semibold text-primary-fg"
            >
              <Check className="h-6 w-6" /> {t.done}
            </button>
          </div>
          <p className="text-center text-lg text-muted">
            {fmt(t.roundProgress, { a: chosen.size, b: wanted.size })}
          </p>
        </div>
      )}
    </GameShell>
  );
}
