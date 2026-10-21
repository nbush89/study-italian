export type Direction = "it_en" | "en_it";

export type Word = {
  id: number;
  word: string;
  part_of_speech: string | null;
  meaning: string | null;
  notes: string | null;
  example: string | null;
  source: string | null;
  created_at: string;
};

export type Topic = {
  id: number;
  name: string;
};

export type ReviewCard = {
  card_id: number;
  direction: Direction;
  box: number;
  word_id: number;
  word: string;
  part_of_speech: string | null;
  meaning: string;
  notes: string | null;
  example: string | null;
  source: string | null;
};

export const PARTS_OF_SPEECH = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "pronoun",
  "conjunction",
  "phrase",
  "other",
] as const;
