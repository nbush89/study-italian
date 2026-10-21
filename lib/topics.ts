import { getSql } from "@/lib/db";
import type { Topic } from "@/lib/types";

/**
 * Loose comparison key so near-duplicates are caught before they're saved:
 * "Food & Drink", "food and drinks" and "Food/drink" all become "food drink".
 */
export function topicKey(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w !== "and")
    .map((w) => (w.length > 3 && w.endsWith("ies") ? w.slice(0, -3) + "y" : w.length > 3 && /[^s]s$/.test(w) ? w.slice(0, -1) : w))
    .join(" ");
}

export async function getTopics(): Promise<Topic[]> {
  const rows = await getSql()`select id, name from topics order by lower(name)`;
  return rows.map((r) => ({ id: Number(r.id), name: String(r.name) }));
}

export async function getWordTopicIds(wordId: number): Promise<number[]> {
  const rows = await getSql()`select topic_id from word_topics where word_id = ${wordId}`;
  return rows.map((r) => Number(r.topic_id));
}

/** Parses "3,7" (from a URL) into [3, 7], dropping anything that isn't a positive integer. */
export function parseIds(value: string | undefined | null): number[] {
  if (!value) return [];
  return [...new Set(value.split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0))];
}
