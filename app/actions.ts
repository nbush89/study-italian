"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSql } from "@/lib/db";
import { schedule } from "@/lib/leitner";
import { topicKey } from "@/lib/topics";

function field(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function idFrom(fd: FormData): number {
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid id");
  return id;
}

/** Topic checkboxes on the word form all share name="topic". */
function topicIdsFrom(fd: FormData): number[] {
  const ids = fd.getAll("topic").map(Number).filter((n) => Number.isInteger(n) && n > 0);
  return [...new Set(ids)];
}

export async function createWord(fd: FormData) {
  const word = field(fd, "word");
  if (!word) throw new Error("Word is required");
  const sql = getSql();

  const topicIds = topicIdsFrom(fd);

  // Insert the word, both cards and its topics in one statement.
  await sql`
    with w as (
      insert into words (word, part_of_speech, meaning, notes, example, source)
      values (${word}, ${field(fd, "part_of_speech")}, ${field(fd, "meaning")},
              ${field(fd, "notes")}, ${field(fd, "example")}, ${field(fd, "source")})
      returning id
    ),
    c as (
      insert into cards (word_id, direction)
      select w.id, d from w, unnest(array['it_en', 'en_it']) as d
    )
    insert into word_topics (word_id, topic_id)
    select w.id, t from w, unnest(${topicIds}::int[]) as t
  `;

  revalidatePath("/", "layout");
  if (fd.get("intent") === "another") {
    // Keep the same topics ticked for the next word, since words tend to come in batches.
    const keep = topicIds.length ? `&topics=${topicIds.join(",")}` : "";
    redirect(`/words/new?added=${encodeURIComponent(word)}${keep}`);
  }
  redirect("/words");
}

export async function updateWord(fd: FormData) {
  const id = idFrom(fd);
  const word = field(fd, "word");
  if (!word) throw new Error("Word is required");
  const sql = getSql();

  const topicIds = topicIdsFrom(fd);

  await sql.transaction([
    sql`
      update words set
        word = ${word},
        part_of_speech = ${field(fd, "part_of_speech")},
        meaning = ${field(fd, "meaning")},
        notes = ${field(fd, "notes")},
        example = ${field(fd, "example")},
        source = ${field(fd, "source")}
      where id = ${id}
    `,
    sql`delete from word_topics where word_id = ${id} and not (topic_id = any(${topicIds}::int[]))`,
    sql`insert into word_topics (word_id, topic_id)
        select ${id}, t from unnest(${topicIds}::int[]) as t
        on conflict do nothing`,
  ]);

  revalidatePath("/", "layout");
  redirect("/words");
}

export async function deleteWord(fd: FormData) {
  const id = idFrom(fd);
  await getSql()`delete from words where id = ${id}`;
  revalidatePath("/", "layout");
  redirect("/words");
}

export async function resetProgress(fd: FormData) {
  const id = idFrom(fd);
  await getSql()`update cards set box = 1, due_at = now() where word_id = ${id}`;
  revalidatePath("/", "layout");
  redirect(`/words/${id}`);
}

export async function recordReview(input: {
  cardId: number;
  correct: boolean;
  typedAnswer: string | null;
  practice: boolean;
}): Promise<{ boxAfter: number }> {
  const sql = getSql();
  const rows = await sql`select box from cards where id = ${input.cardId}`;
  if (rows.length === 0) throw new Error("Card not found");

  const boxBefore = Number(rows[0].box);
  const next = schedule(boxBefore, input.correct, input.practice);
  const boxAfter = next ? next.box : boxBefore;

  await sql.transaction([
    next
      ? sql`update cards set box = ${next.box}, due_at = ${next.dueAt.toISOString()}, last_reviewed_at = now()
            where id = ${input.cardId}`
      : sql`update cards set last_reviewed_at = now() where id = ${input.cardId}`,
    sql`insert into reviews (card_id, correct, typed_answer, practice, box_before, box_after)
        values (${input.cardId}, ${input.correct}, ${input.typedAnswer}, ${input.practice}, ${boxBefore}, ${boxAfter})`,
  ]);

  return { boxAfter };
}

// Topics -----------------------------------------------------------------

function topicError(message: string): never {
  redirect(`/topics?error=${encodeURIComponent(message)}`);
}

/** Returns the existing topic that a new name would duplicate, if any. */
async function findDuplicateTopic(name: string, exceptId: number | null): Promise<string | null> {
  const rows = await getSql()`select id, name from topics`;
  const key = topicKey(name);
  const match = rows.find((r) => Number(r.id) !== exceptId && topicKey(String(r.name)) === key);
  return match ? String(match.name) : null;
}

export async function createTopic(fd: FormData) {
  const name = field(fd, "name");
  if (!name) topicError("Enter a topic name.");
  const dup = await findDuplicateTopic(name, null);
  if (dup) topicError(`You already have "${dup}".`);

  await getSql()`insert into topics (name) values (${name})`;
  revalidatePath("/", "layout");
  redirect(`/topics?added=${encodeURIComponent(name)}`);
}

export async function renameTopic(fd: FormData) {
  const id = idFrom(fd);
  const name = field(fd, "name");
  if (!name) topicError("Enter a topic name.");
  const dup = await findDuplicateTopic(name, id);
  if (dup) topicError(`You already have "${dup}".`);

  await getSql()`update topics set name = ${name} where id = ${id}`;
  revalidatePath("/", "layout");
  redirect("/topics");
}

/** Removes the topic and its tags. The words themselves are kept. */
export async function deleteTopic(fd: FormData) {
  const id = idFrom(fd);
  await getSql()`delete from topics where id = ${id}`;
  revalidatePath("/", "layout");
  redirect("/topics");
}
