import Link from "next/link";
import { Lock } from "lucide-react";
import { GAMES, PLAYABLE_GAME_KEYS } from "@/lib/cognitive-domains";
import { resolvePatientId } from "@/lib/demo";

export const dynamic = "force-dynamic";

const playable = new Set<string>(PLAYABLE_GAME_KEYS);

const GAME_EMOJI: Record<string, string> = {
  memory_lane: "🖼️",
  market_basket: "🧺",
  morning_routine: "🌅",
  pattern_of_the_loom: "🧶",
  bird_and_beast: "🦏",
  song_of_the_hills: "🎵",
  word_garden: "🌱",
};

export default async function GamesList({
  searchParams,
}: PageProps<"/patient/games">) {
  const sp = await searchParams;
  const patientId = await resolvePatientId(sp);
  const q = patientId ? `?p=${patientId}` : "";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Play a game</h1>
      <ul className="space-y-4">
        {GAMES.map((g) => {
          const isPlayable = playable.has(g.key);
          const inner = (
            <>
              <span className="text-4xl" aria-hidden>
                {GAME_EMOJI[g.key] ?? "🎮"}
              </span>
              <div className="flex-1">
                <p className="text-2xl font-semibold">{g.title}</p>
                <p className="text-base text-muted">{g.culturalTheme}</p>
              </div>
              {!isPlayable && <Lock className="h-5 w-5 text-muted" />}
            </>
          );
          return (
            <li key={g.key}>
              {isPlayable ? (
                <Link
                  href={`/patient/games/${g.key.replace(/_/g, "-")}${q}`}
                  className="flex items-center gap-4 rounded-2xl border border-primary bg-primary/5 p-5"
                >
                  {inner}
                </Link>
              ) : (
                <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 opacity-70">
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-base text-muted">
        Only <strong>Memory Lane</strong> is playable in this scaffold. The rest
        show the planned suite.
      </p>
    </div>
  );
}
