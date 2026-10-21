import Link from "next/link";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const sql = getSql();
  const [stats] = await sql`
    select
      (select count(*) from cards c join words w on w.id = c.word_id
        where c.due_at <= now() and coalesce(trim(w.meaning), '') <> '')::int as due,
      (select count(*) from words)::int as total,
      (select count(*) from words where coalesce(trim(meaning), '') = '')::int as incomplete,
      (select count(*) from cards where box = 5)::int as top_box
  `;
  const byTopic = await sql`
    select t.id, t.name, count(distinct w.id)::int as due
    from topics t
    join word_topics wt on wt.topic_id = t.id
    join words w on w.id = wt.word_id
    join cards c on c.word_id = w.id
    where c.due_at <= now() and coalesce(trim(w.meaning), '') <> ''
    group by t.id
    order by lower(t.name)
  `;
  const due = Number(stats.due);
  const total = Number(stats.total);
  const incomplete = Number(stats.incomplete);

  if (total === 0) {
    return (
      <>
        <h1>Parole</h1>
        <p>No words yet. Add the first word you want to learn, and it will be ready to review right away.</p>
        <Link href="/words/new" className="btn btn-primary btn-block">Add a word</Link>
      </>
    );
  }

  return (
    <>
      <div className="due-count">{due}</div>
      <p className="muted">{due === 1 ? "card due for review" : "cards due for review"}</p>

      <div className="stack">
        {due > 0 ? (
          <Link href="/review" className="btn btn-primary btn-block">Start review</Link>
        ) : (
          <>
            <p>Nothing is due. Your next cards come back on their own schedule.</p>
            <Link href="/review?mode=practice" className="btn btn-block">Practice weakest words</Link>
          </>
        )}
        <Link href="/words/new" className="btn btn-block">Add a word</Link>
      </div>

      {byTopic.length > 0 && (
        <>
          <h2>Review one topic</h2>
          <ul className="facts" style={{ marginTop: 0 }}>
            {byTopic.map((t) => (
              <li key={t.id}>
                <Link href={`/review?topic=${t.id}`}>{t.name}</Link>
                <span className="muted small">{t.due} {t.due === 1 ? "word" : "words"} due</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <ul className="facts">
        <li><span>Words</span><span>{total}</span></li>
        <li><span>Cards in the top box</span><span>{Number(stats.top_box)}</span></li>
        {incomplete > 0 && (
          <li>
            <Link href="/words?filter=incomplete">Words missing a meaning</Link>
            <span>{incomplete}</span>
          </li>
        )}
      </ul>
    </>
  );
}
