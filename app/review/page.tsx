import Link from "next/link";
import { getSql } from "@/lib/db";
import type { ReviewCard } from "@/lib/types";
import ReviewSession from "@/components/ReviewSession";

export const dynamic = "force-dynamic";

const SESSION_SIZE = 20;

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; topic?: string }>;
}) {
  const { mode, topic } = await searchParams;
  const practice = mode === "practice";
  const topicId = topic && /^\d+$/.test(topic) ? Number(topic) : 0;
  const sql = getSql();

  const topicRows = topicId ? await sql`select name from topics where id = ${topicId}` : [];
  const topicName: string | null = topicRows.length ? String(topicRows[0].name) : null;
  const inTopic = (extra: Record<string, string> = {}) => {
    const p = new URLSearchParams(extra);
    if (topicName) p.set("topic", String(topicId));
    const s = p.toString();
    return s ? `/review?${s}` : "/review";
  };

  // At most one direction per word per session, so one card doesn't give away the other.
  const rows = practice
    ? await sql`
        select * from (
          select distinct on (c.word_id)
            c.id as card_id, c.direction, c.box, w.id as word_id, w.word, w.part_of_speech,
            w.meaning, w.notes, w.example, w.source, c.last_reviewed_at
          from cards c join words w on w.id = c.word_id
          where coalesce(trim(w.meaning), '') <> ''
            and (${topicId}::int = 0 or exists (
                  select 1 from word_topics wt where wt.word_id = w.id and wt.topic_id = ${topicId}::int))
          order by c.word_id, c.box asc, c.last_reviewed_at asc nulls first, random()
        ) t
        order by t.box asc, t.last_reviewed_at asc nulls first, random()
        limit ${SESSION_SIZE}`
    : await sql`
        select * from (
          select distinct on (c.word_id)
            c.id as card_id, c.direction, c.box, w.id as word_id, w.word, w.part_of_speech,
            w.meaning, w.notes, w.example, w.source
          from cards c join words w on w.id = c.word_id
          where c.due_at <= now() and coalesce(trim(w.meaning), '') <> ''
            and (${topicId}::int = 0 or exists (
                  select 1 from word_topics wt where wt.word_id = w.id and wt.topic_id = ${topicId}::int))
          order by c.word_id, c.box asc, c.due_at asc, random()
        ) t
        order by random()
        limit ${SESSION_SIZE}`;

  const cards: ReviewCard[] = rows.map((r) => ({
    card_id: Number(r.card_id),
    direction: r.direction,
    box: Number(r.box),
    word_id: Number(r.word_id),
    word: r.word,
    part_of_speech: r.part_of_speech,
    meaning: r.meaning,
    notes: r.notes,
    example: r.example,
    source: r.source,
  }));

  if (cards.length === 0) {
    return (
      <>
        <h1>
          {practice ? "Nothing to practice" : "Nothing due"}
          {topicName && <> in {topicName}</>}
        </h1>
        <p>
          {practice
            ? topicName
              ? "No words with a meaning are tagged with this topic yet."
              : "Add words with a meaning to start practicing."
            : "Every card is scheduled for later."}
        </p>
        <div className="stack">
          {!practice && (
            <Link href={inTopic({ mode: "practice" })} className="btn btn-primary btn-block">Practice weakest words</Link>
          )}
          {topicName && <Link href="/review" className="btn btn-block">Review all topics</Link>}
          <Link href="/words/new" className="btn btn-block">Add a word</Link>
        </div>
      </>
    );
  }

  // key forces a fresh session when navigating between modes
  return (
    <>
      {topicName && <p className="muted small" style={{ marginBottom: "0.5rem" }}>Topic: {topicName}</p>}
      <ReviewSession
        key={`${practice ? "practice" : "due"}-${topicId}`}
        cards={cards}
        practice={practice}
        moreHref={inTopic(practice ? { mode: "practice" } : {})}
      />
    </>
  );
}
