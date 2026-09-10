/**
 * Static catalogue of cognitive domains and the culturally-themed games that
 * train them. Kept in one place so the patient app, the dashboards and the
 * seed script all agree on identifiers and labels.
 */

export type DomainKey =
  | "memory"
  | "attention"
  | "routine_recall"
  | "pattern_recognition"
  | "engagement"
  | "language";

export interface DomainMeta {
  key: DomainKey;
  label: string;
  /** Short description used on dashboards. */
  blurb: string;
}

export const DOMAINS: Record<DomainKey, DomainMeta> = {
  memory: {
    key: "memory",
    label: "Memory",
    blurb: "Episodic and autobiographical recall.",
  },
  attention: {
    key: "attention",
    label: "Attention & Concentration",
    blurb: "Sustained focus and response inhibition.",
  },
  routine_recall: {
    key: "routine_recall",
    label: "Daily Routine Recall",
    blurb: "Orientation to day, time and sequence of daily activities.",
  },
  pattern_recognition: {
    key: "pattern_recognition",
    label: "Pattern & Object Recognition",
    blurb: "Visuospatial memory and pattern completion.",
  },
  engagement: {
    key: "engagement",
    label: "Emotional & Mental Engagement",
    blurb: "Mood, participation and social-emotional connection.",
  },
  language: {
    key: "language",
    label: "Language & Fluency",
    blurb: "Naming and verbal fluency (supporting domain).",
  },
};

export const DOMAIN_LIST = Object.values(DOMAINS);

export interface GameMeta {
  key: string;
  title: string;
  domain: DomainKey;
  culturalTheme: string;
  clinicalBasis: string;
}

/** The seven-game suite. Only a subset is playable in the scaffold. */
export const GAMES: GameMeta[] = [
  {
    key: "memory_lane",
    title: "Memory Lane",
    domain: "memory",
    culturalTheme:
      "Family photos, NER landmarks (Kaziranga, Loktak, living-root bridges, Tawang) and festivals (Bihu, Hornbill, Chapchar Kut, Losar).",
    clinicalBasis: "Reminiscence therapy.",
  },
  {
    key: "market_basket",
    title: "Market Basket",
    domain: "attention",
    culturalTheme:
      "Buying local goods (rice, betel nut, bamboo shoot, Assam tea, jackfruit) at a virtual haat.",
    clinicalBasis: "n-back / working-memory span tasks.",
  },
  {
    key: "morning_routine",
    title: "Morning Routine",
    domain: "routine_recall",
    culturalTheme: "Sequencing everyday NER household activities; feeds the reminder system.",
    clinicalBasis: "Reality-orientation therapy.",
  },
  {
    key: "pattern_of_the_loom",
    title: "Pattern of the Loom",
    domain: "pattern_recognition",
    culturalTheme: "Reproducing Naga shawl, Mekhela Chador and Mizo puan motifs.",
    clinicalBasis: "Corsi block-tapping (spatial span).",
  },
  {
    key: "bird_and_beast",
    title: "Bird & Beast",
    domain: "attention",
    culturalTheme: "Spotting the hornbill or one-horned rhino among distractors.",
    clinicalBasis: "Visual search and Stroop-type inhibition.",
  },
  {
    key: "song_of_the_hills",
    title: "Song of the Hills",
    domain: "engagement",
    culturalTheme: "Hum-along, missing-lyric and rhythm-tap with regional folk songs.",
    clinicalBasis: "Music therapy.",
  },
  {
    key: "word_garden",
    title: "Word Garden",
    domain: "language",
    culturalTheme: "Category naming, picture naming and proverb completion in the patient's language.",
    clinicalBasis: "Semantic fluency and confrontation naming.",
  },
];

export const PLAYABLE_GAME_KEYS = ["memory_lane"] as const;

export function gameByKey(key: string): GameMeta | undefined {
  return GAMES.find((g) => g.key === key);
}
