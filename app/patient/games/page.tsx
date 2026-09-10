import Link from "next/link";
import { Lock } from "lucide-react";
import { GAMES, PLAYABLE_GAME_KEYS } from "@/lib/cognitive-domains";
import { resolvePatientId } from "@/lib/demo";
import { resolvePatientLang } from "@/lib/patient-lang";

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
  const { dict: t } = await resolvePatientLang();

  const TINTS = [
    "bg-tint-peach",
    "bg-tint-cream",
    "bg-tint-lavender",
    "bg-tint-mint",
    "bg-tint-sky",
    "bg-tint-rose",
  ];

  return (
    <div className="sy-fade-rise space-y-6">
      <h1 className="text-3xl font-bold text-navy">{t.playAGame}</h1>
      <ul className="sy-stagger space-y-4">
        {GAMES.map((g, i) => {
          const isPlayable = playable.has(g.key);
          const tint = TINTS[i % TINTS.length];
          const inner = (
            <>
              <span
                className="sy-medallion flex h-16 w-16 shrink-0 items-center justify-center text-3xl"
                aria-hidden
              >
                {GAME_EMOJI[g.key] ?? "🎮"}
              </span>
              <div className="flex-1">
                <p className="text-2xl font-bold text-navy">{g.title}</p>
                <p className="text-base text-muted">{g.culturalTheme}</p>
              </div>
              {!isPlayable && (
                <Lock className="h-5 w-5 text-muted" aria-label={t.locked} />
              )}
            </>
          );
          return (
            <li key={g.key}>
              {isPlayable ? (
                <Link
                  href={`/patient/games/${g.key.replace(/_/g, "-")}${q}`}
                  className={`sy-press flex items-center gap-4 rounded-3xl border border-border ${tint} p-5 shadow-[0_6px_20px_rgba(22,58,99,0.06)]`}
                >
                  {inner}
                </Link>
              ) : (
                <div
                  className={`flex items-center gap-4 rounded-3xl border border-border ${tint} p-5 opacity-60`}
                >
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-center text-base text-muted">{t.takeYourTime}</p>
    </div>
  );
}
