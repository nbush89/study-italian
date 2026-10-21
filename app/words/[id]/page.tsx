import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteWord, resetProgress, updateWord } from "@/app/actions";
import Boxes from "@/components/Boxes";
import ConfirmButton from "@/components/ConfirmButton";
import WordForm from "@/components/WordForm";
import { getSql } from "@/lib/db";
import { wiktionaryUrl, wordReferenceUrl } from "@/lib/lookup";
import { getTopics, getWordTopicIds } from "@/lib/topics";
import type { Word } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function WordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const sql = getSql();
  const [wordRows, cardRows, missRows, topics, topicIds] = await Promise.all([
    sql`select * from words where id = ${id}`,
    sql`select direction, box, due_at from cards where word_id = ${id} order by direction`,
    sql`select count(*)::int as misses from reviews r join cards c on c.id = r.card_id
        where c.word_id = ${id} and r.correct = false`,
    getTopics(),
    getWordTopicIds(id),
  ]);
  if (wordRows.length === 0) notFound();
  const word = wordRows[0] as Word;

  return (
    <>
      <h1 lang="it" className="word" style={{ fontSize: "2rem" }}>{word.word}</h1>

      <div className="links">
        <a href={wordReferenceUrl(word.word)} target="_blank" rel="noreferrer">Check on WordReference</a>
        <a href={wiktionaryUrl(word.word)} target="_blank" rel="noreferrer">Wiktionary</a>
      </div>

      <ul className="facts">
        {cardRows.map((c) => (
          <li key={c.direction}>
            <span>{c.direction === "it_en" ? "Italian → English" : "English → Italian"}</span>
            <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span className="muted small">due {new Date(c.due_at).toLocaleDateString()}</span>
              <Boxes box={Number(c.box)} />
            </span>
          </li>
        ))}
        <li><span>Times missed</span><span>{Number(missRows[0].misses)}</span></li>
      </ul>

      <WordForm action={updateWord} word={word} topics={topics} selectedTopicIds={topicIds} />

      <div className="danger-zone">
        <form action={resetProgress}>
          <input type="hidden" name="id" value={word.id} />
          <ConfirmButton className="btn btn-quiet btn-block" message="Move both cards back to box 1 and make them due now?">
            Reset progress
          </ConfirmButton>
        </form>
        <form action={deleteWord}>
          <input type="hidden" name="id" value={word.id} />
          <ConfirmButton className="btn btn-danger btn-block" message="Delete this word and its review history?">
            Delete word
          </ConfirmButton>
        </form>
        <Link href="/words" className="btn btn-quiet btn-block">Back to words</Link>
      </div>
    </>
  );
}
