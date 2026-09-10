"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fmt } from "@/lib/i18n";
import { SpeakButton } from "@/components/patient/SpeakButton";
import { VoiceInput } from "@/components/patient/VoiceInput";
import { useGameSession } from "@/lib/use-game-session";
import {
  GameShell,
  scaleByDifficulty,
  type GameScreenProps,
} from "@/components/patient/games/GameShell";

/* Picture-naming: a familiar thing, its word, and near neighbours. */
interface Pic {
  emoji: string;
  word: string;
  options: string[];
}

const PICS: Pic[] = [
  { emoji: "🐘", word: "Elephant", options: ["Elephant", "Buffalo", "Horse"] },
  { emoji: "🍵", word: "Tea", options: ["Tea", "Milk", "Water"] },
  { emoji: "🌾", word: "Rice", options: ["Rice", "Wheat", "Grass"] },
  { emoji: "🐟", word: "Fish", options: ["Fish", "Frog", "Snake"] },
  { emoji: "🎋", word: "Bamboo", options: ["Bamboo", "Sugarcane", "Reed"] },
  { emoji: "🌺", word: "Flower", options: ["Flower", "Leaf", "Fruit"] },
  { emoji: "🥁", word: "Drum", options: ["Drum", "Bell", "Flute"] },
  { emoji: "🏔️", word: "Mountain", options: ["Mountain", "River", "Cloud"] },
  { emoji: "🛶", word: "Boat", options: ["Boat", "Cart", "Bridge"] },
  { emoji: "🥭", word: "Mango", options: ["Mango", "Orange", "Guava"] },
];

function shuffle<T>(a: T[]): T[] {
  return [...a].sort(() => Math.random() - 0.5);
}

export function WordGarden(props: GameScreenProps) {
  const { patientId, patientName, speechTag, dict: t } = props;
  const [difficulty, setDifficulty] = useState(props.initialDifficulty);
  const { phase, adaptive, finish, replay } = useGameSession({
    patientId,
    gameKey: "word_garden",
    domain: "language",
    initialDifficulty: props.initialDifficulty,
    initialReason: props.initialReason,
  });

  const [round, setRound] = useState(0);
  const total = scaleByDifficulty(difficulty, 2, 5);
  const pics = useMemo(() => {
    void round; // re-shuffle on every new round, even at the same difficulty
    return shuffle(PICS).slice(0, total);
  }, [round, total]);

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [firstTryRight, setFirstTryRight] = useState(0);
  const triedWrong = useRef(false);
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, [round]);

  const pic = pics[idx];
  const options = useMemo(() => shuffle(pic.options), [pic]);
  const solved = picked === pic.word;

  const advance = useCallback(
    (score: number) => {
      if (idx + 1 >= pics.length) {
        finish({
          difficulty,
          accuracy: score / pics.length,
          roundsCompleted: pics.length,
          reactionTimeMs:
            (Date.now() - startedAt.current) / Math.max(1, pics.length),
        });
      } else {
        setIdx((i) => i + 1);
        setPicked(null);
        triedWrong.current = false;
      }
    },
    [idx, pics.length, difficulty, finish],
  );

  const submit = useCallback(
    (word: string) => {
      if (solved) return;
      setPicked(word);
      if (word.toLowerCase() === pic.word.toLowerCase()) {
        const gained = triedWrong.current ? 0 : 1;
        const next = firstTryRight + gained;
        setFirstTryRight(next);
        setTimeout(() => advance(next), 900);
      } else {
        triedWrong.current = true;
      }
    },
    [solved, pic.word, triedWrong, firstTryRight, advance],
  );

  const onVoice = (text: string) => {
    const said = text.toLowerCase();
    const match = pic.options.find((o) => said.includes(o.toLowerCase()));
    submit(match ?? text);
  };

  const handlePlayAgain = () => {
    setDifficulty(adaptive.next);
    setIdx(0);
    setPicked(null);
    setFirstTryRight(0);
    triedWrong.current = false;
    startedAt.current = Date.now();
    setRound((r) => r + 1);
    replay();
  };

  return (
    <GameShell
      title={t.titleWordGarden}
      instruction={t.instrWordGarden}
      speechTag={speechTag}
      patientName={patientName}
      dict={t}
      phase={phase}
      adaptive={adaptive}
      onPlayAgain={handlePlayAgain}
    >
      <div className="space-y-6">
        <div className="sy-card flex flex-col items-center gap-3 bg-gradient-to-br from-tint-sky to-tint-lavender p-8">
          <span
            className="sy-medallion sy-pop-in flex h-40 w-40 items-center justify-center text-[5.5rem]"
            aria-hidden
          >
            {pic.emoji}
          </span>
          {solved && (
            <span className="sy-pop-in text-3xl font-extrabold text-primary">
              {pic.word}
            </span>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          <VoiceInput
            lang={speechTag}
            label={t.sayTheWord}
            onResult={onVoice}
          />
          <p className="text-base text-muted">{t.orTapAnswer}</p>
        </div>

        <div className="sy-stagger grid gap-3">
          {options.map((word) => {
            const chosen = picked === word;
            const right = chosen && word.toLowerCase() === pic.word.toLowerCase();
            const wrong = chosen && !right;
            return (
              <div key={word} className="flex items-stretch gap-2">
                <button
                  onClick={() => submit(word)}
                  className={`sy-press flex-1 rounded-2xl border-2 px-6 py-5 text-left text-2xl font-bold transition ${
                    right
                      ? "sy-pop-in border-primary bg-primary/15 text-primary shadow-[0_8px_22px_rgba(44,138,81,0.2)]"
                      : wrong
                        ? "border-status-red bg-status-red/10"
                        : "sy-medallion border-transparent"
                  }`}
                >
                  {word}
                </button>
                <SpeakButton
                  text={word}
                  lang={speechTag}
                  label={t.hear}
                  iconOnly
                  className="sy-press inline-flex items-center rounded-2xl border border-border bg-surface px-4 text-muted"
                />
              </div>
            );
          })}
        </div>

        {picked && (
          <p className="text-center text-lg font-medium text-muted">
            {solved ? t.goodChoice : t.tryAnother}
          </p>
        )}
        <p className="text-center text-lg text-muted">
          {fmt(t.roundProgress, { a: idx + 1, b: pics.length })}
        </p>
      </div>
    </GameShell>
  );
}
