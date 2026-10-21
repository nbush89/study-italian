import Link from "next/link";
import { createTopic, deleteTopic, renameTopic } from "@/app/actions";
import ConfirmButton from "@/components/ConfirmButton";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string; error?: string }>;
}) {
  const { added, error } = await searchParams;
  const rows = await getSql()`
    select t.id, t.name, count(wt.word_id)::int as words
    from topics t
    left join word_topics wt on wt.topic_id = t.id
    group by t.id
    order by lower(t.name)
  `;

  return (
    <>
      <h1>Topics</h1>
      {added && <p className="notice">Added {added}.</p>}
      {error && <p className="error" role="alert" style={{ marginTop: 0, marginBottom: "1rem" }}>{error}</p>}

      <form action={createTopic} className="search">
        <input type="text" name="name" placeholder="New topic" aria-label="New topic name" required />
        <button className="btn" type="submit">Add</button>
      </form>
      <p className="muted small">Names that differ only by capitals, plurals or &ldquo;&amp;&rdquo; vs &ldquo;and&rdquo; are treated as the same topic.</p>

      {rows.length === 0 ? (
        <p className="muted">No topics yet.</p>
      ) : (
        <ul className="topic-list">
          {rows.map((t) => (
            <li key={t.id}>
              <div className="topic-row">
                <Link href={`/words?topic=${t.id}`}>{t.name}</Link>
                <span className="muted small">{t.words} {t.words === 1 ? "word" : "words"}</span>
              </div>
              <details>
                <summary>Edit</summary>
                <form action={renameTopic} className="search">
                  <input type="hidden" name="id" value={t.id} />
                  <input type="text" name="name" defaultValue={t.name} aria-label={`Rename ${t.name}`} required />
                  <button className="btn" type="submit">Rename</button>
                </form>
                <form action={deleteTopic}>
                  <input type="hidden" name="id" value={t.id} />
                  <ConfirmButton
                    className="btn btn-danger btn-quiet"
                    message={`Delete "${t.name}"? Its ${t.words} words stay; they just lose this tag.`}
                  >
                    Delete topic
                  </ConfirmButton>
                </form>
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
