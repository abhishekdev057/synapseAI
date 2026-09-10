"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fmt } from "@/lib/i18n";
import { SpeakButton } from "@/components/patient/SpeakButton";
import { useGameSession } from "@/lib/use-game-session";
import {
  GameShell,
  scaleByDifficulty,
  type GameScreenProps,
} from "@/components/patient/games/GameShell";

/* Gentle folk-style couplets with one word to restore. NER nature imagery. */
interface Verse {
  before: string;
  answer: string;
  after: string;
  options: string[];
}

const VERSES: Verse[] = [
  {
    before: "The hornbill calls from the tall",
    answer: "tree",
    after: ", morning has come to the hills.",
    options: ["tree", "river", "drum"],
  },
  {
    before: "On the wide waters of Loktak the fishermen push their",
    answer: "boat",
    after: " at dawn.",
    options: ["boat", "cart", "plough"],
  },
  {
    before: "The Brahmaputra is wide and the",
    answer: "moon",
    after: " floats upon it like a lamp.",
    options: ["moon", "stone", "leaf"],
  },
  {
    before: "In Bihu the young ones dance while the elders keep the",
    answer: "beat",
    after: " on the dhol.",
    options: ["beat", "field", "gate"],
  },
  {
    before: "Tea leaves are green on the hill and the basket is on her",
    answer: "back",
    after: ".",
    options: ["back", "roof", "road"],
  },
  {
    before: "The living-root bridge holds strong across the running",
    answer: "stream",
    after: " below.",
    options: ["stream", "cloud", "market"],
  },
  {
    before: "When the rice is ripe the whole village goes to the",
    answer: "field",
    after: " together.",
    options: ["field", "temple", "school"],
  },
];

function shuffle<T>(a: T[]): T[] {
  return [...a].sort(() => Math.random() - 0.5);
}

export function SongOfTheHills(props: GameScreenProps) {
  const { patientId, patientName, speechTag, dict: t } = props;
  const [difficulty, setDifficulty] = useState(props.initialDifficulty);
  const { phase, adaptive, finish, replay } = useGameSession({
    patientId,
    gameKey: "song_of_the_hills",
    domain: "engagement",
    initialDifficulty: props.initialDifficulty,
    initialReason: props.initialReason,
  });

  const [round, setRound] = useState(0);
  const total = scaleByDifficulty(difficulty, 1, 4);
  const verses = useMemo(() => {
    void round; // re-shuffle on every new round, even at the same difficulty
    return shuffle(VERSES).slice(0, total);
  }, [round, total]);

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [firstTryRight, setFirstTryRight] = useState(0);
  const triedWrong = useRef(false);
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, [round]);

  const verse = verses[idx];
  const options = useMemo(() => shuffle(verse.options), [verse]);
  const lineText = `${verse.before} ... ${verse.after}`;

  const advance = useCallback(
    (rightOnFirst: number) => {
      if (idx + 1 >= verses.length) {
        finish({
          difficulty,
          accuracy: rightOnFirst / verses.length,
          roundsCompleted: verses.length,
          reactionTimeMs:
            (Date.now() - startedAt.current) / Math.max(1, verses.length),
        });
      } else {
        setIdx((i) => i + 1);
        setPicked(null);
        triedWrong.current = false;
      }
    },
    [idx, verses.length, difficulty, finish],
  );

  const choose = (word: string) => {
    if (picked === verse.answer) return; // already solved this verse
    setPicked(word);
    if (word === verse.answer) {
      const gained = triedWrong.current ? 0 : 1;
      const nextScore = firstTryRight + gained;
      setFirstTryRight(nextScore);
      setTimeout(() => advance(nextScore), 900);
    } else {
      triedWrong.current = true;
    }
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
      title={t.titleSongHills}
      instruction={t.instrSongHills}
      speechTag={speechTag}
      patientName={patientName}
      dict={t}
      phase={phase}
      adaptive={adaptive}
      onPlayAgain={handlePlayAgain}
    >
      <div className="space-y-6">
        <div className="rounded-3xl border border-border bg-tint-mint p-6 text-2xl leading-relaxed">
          {verse.before}{" "}
          <span className="mx-1 inline-block min-w-24 rounded-lg border-b-4 border-primary px-2 text-center font-bold text-primary">
            {picked === verse.answer ? verse.answer : "____"}
          </span>{" "}
          {verse.after}
        </div>

        <div className="flex justify-center">
          <SpeakButton text={lineText} lang={speechTag} label={t.hearTheLine} />
        </div>

        <div className="grid gap-3">
          {options.map((word) => {
            const chosen = picked === word;
            const right = chosen && word === verse.answer;
            const wrong = chosen && word !== verse.answer;
            return (
              <button
                key={word}
                onClick={() => choose(word)}
                className={`rounded-2xl border-2 px-6 py-5 text-2xl font-semibold transition ${
                  right
                    ? "border-primary bg-primary/15 text-primary"
                    : wrong
                      ? "border-status-red bg-status-red/10"
                      : "border-border bg-surface active:scale-95"
                }`}
              >
                {word}
              </button>
            );
          })}
        </div>

        {picked && (
          <p className="text-center text-lg font-medium text-muted">
            {picked === verse.answer ? t.goodChoice : t.tryAnother}
          </p>
        )}
        <p className="text-center text-lg text-muted">
          {fmt(t.roundProgress, { a: idx + 1, b: verses.length })}
        </p>
      </div>
    </GameShell>
  );
}
