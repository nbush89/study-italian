import Link from "next/link";
import { getSql } from "@/lib/db";
import { getTopics } from "@/lib/topics";
import AutoSubmitSelect from "@/components/AutoSubmitSelect";
import Boxes from "@/components/Boxes";

export const dynamic = "force-dynamic";

export default async function WordsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; topic?: string }>;
}) {
  const { q = "", filter, topic = "" } = await searchParams;
  const query = q.trim();
  const incompleteOnly = filter === "incomplete";
  const like = `%${query}%`;

  // topic: "" = any, "none" = untagged, otherwise a topic id
  const untaggedOnly = topic === "none";
  const topicId = /^\d+$/.test(topic) ? Number(topic) : 0;

  const [rows, topics] = await Promise.all([
    getSql()`
      select w.id, w.word, w.meaning, w.part_of_speech,
        max(case when c.direction = 'it_en' then c.box end) as box_it_en,
        max(case when c.direction = 'en_it' then c.box end) as box_en_it,
        (select string_agg(t.name, ', ' order by lower(t.name))
           from word_topics wt join topics t on t.id = wt.topic_id
          where wt.word_id = w.id) as topic_names
      from words w
      left join cards c on c.word_id = w.id
      where (${query} = '' or w.word ilike ${like} or w.meaning ilike ${like})
        and (${incompleteOnly} = false or coalesce(trim(w.meaning), '') = '')
        and (${topicId}::int = 0 or exists (
              select 1 from word_topics wt where wt.word_id = w.id and wt.topic_id = ${topicId}::int))
        and (${untaggedOnly} = false or not exists (
              select 1 from word_topics wt where wt.word_id = w.id))
      group by w.id
      order by w.created_at desc
      limit 500
    `,
    getTopics(),
  ]);

  const params = (overrides: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const base: Record<string, string | null> = {
      q: query || null,
      filter: incompleteOnly ? "incomplete" : null,
      topic: topic || null,
      ...overrides,
    };
    for (const [k, v] of Object.entries(base)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/words?${s}` : "/words";
  };

  const filtered = Boolean(query || incompleteOnly || topic);

  return (
    <>
      <h1>Words</h1>

      <form className="search-form" role="search">
        <div className="search">
          <input type="search" name="q" defaultValue={query} placeholder="Search Italian or English" aria-label="Search words" />
          <button className="btn" type="submit">Search</button>
        </div>
        <AutoSubmitSelect name="topic" defaultValue={topic} aria-label="Topic">
          <option value="">All topics</option>
          {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          <option value="none">No topic yet</option>
        </AutoSubmitSelect>
        {incompleteOnly && <input type="hidden" name="filter" value="incomplete" />}
      </form>

      <div className="filters">
        <Link href={params({ filter: null })} aria-current={!incompleteOnly}>All</Link>
        <Link href={params({ filter: "incomplete" })} aria-current={incompleteOnly}>Missing a meaning</Link>
        <Link href="/topics" style={{ marginLeft: "auto" }}>Manage topics</Link>
      </div>

      {rows.length === 0 ? (
        <p className="muted">{filtered ? "No words match." : "No words yet."}</p>
      ) : (
        <ul className="word-list">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/words/${r.id}`}>
                <span>
                  <span className="w" lang="it">{r.word}</span>
                  <br />
                  {r.meaning ? <span className="m">{r.meaning}</span> : <span className="missing">No meaning yet</span>}
                  {r.topic_names && (<><br /><span className="tags">{r.topic_names}</span></>)}
                </span>
                <span style={{ display: "grid", gap: 6, alignContent: "center" }}>
                  {r.box_it_en != null && <Boxes box={Number(r.box_it_en)} label="Italian to English" />}
                  {r.box_en_it != null && <Boxes box={Number(r.box_en_it)} label="English to Italian" />}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
