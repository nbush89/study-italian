"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { recordReview } from "@/app/actions";
import { checkAnswer, type CheckResult } from "@/lib/answer";
import type { ReviewCard } from "@/lib/types";
import Boxes from "./Boxes";
import SpeakButton from "./SpeakButton";

type QueueItem = ReviewCard & { retry: boolean };

const ACCENTS = ["à", "è", "é", "ì", "ò", "ù"];

export default function ReviewSession({
  cards,
  practice,
  moreHref,
}: {
  cards: ReviewCard[];
  practice: boolean;
  moreHref: string;
}) {
  const [queue, setQueue] = useState<QueueItem[]>(() => cards.map((c) => ({ ...c, retry: false })));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [tally, setTally] = useState({ right: 0, missed: 0 });
  const [saveFailed, setSaveFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const card = queue[index];
  const firstPassTotal = cards.length;

  if (!card) {
    return (
      <>
        <h1>Session done</h1>
        <p>
          {tally.right} right, {tally.missed} missed
          {tally.missed > 0 && ". Missed cards come back tomorrow."}
        </p>
        {saveFailed && <p className="error">Some answers didn&apos;t save. Check your connection and review again.</p>}
        <div className="stack">
          <Link href={moreHref} className="btn btn-primary btn-block">
            Review more
          </Link>
          <Link href="/" className="btn btn-block">Done</Link>
        </div>
      </>
    );
  }

  function grade(correct: boolean, typedAnswer: string | null) {
    if (!card.retry) {
      setTally((t) => (correct ? { ...t, right: t.right + 1 } : { ...t, missed: t.missed + 1 }));
      recordReview({ cardId: card.card_id, correct, typedAnswer, practice }).catch(() => setSaveFailed(true));
      // Missed cards get one more look at the end of this session (not scheduled again).
      if (!correct) setQueue((q) => [...q, { ...card, retry: true }]);
    }
    setIndex((i) => i + 1);
    setRevealed(false);
    setTyped("");
    setResult(null);
  }

  function check() {
    if (!typed.trim()) return;
    setResult(checkAnswer(typed, card.word));
    setRevealed(true);
  }

  function insertAccent(ch: string) {
    const el = inputRef.current;
    if (!el) return setTyped((t) => t + ch);
    const start = el.selectionStart ?? typed.length;
    const end = el.selectionEnd ?? typed.length;
    const next = typed.slice(0, start) + ch + typed.slice(end);
    setTyped(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + ch.length, start + ch.length);
    });
  }

  const isRecall = card.direction === "en_it";
  const doneCount = Math.min(index, firstPassTotal);

  return (
    <>
      <div className="progress" aria-hidden="true">
        <div style={{ width: `${(doneCount / Math.max(firstPassTotal, 1)) * 100}%` }} />
      </div>

      <div className="card">
        <div className="card-top">
          <span>
            {card.retry ? "One more look" : isRecall ? "Say it in Italian" : "What does it mean?"}
            {practice && !card.retry && " (practice)"}
          </span>
          <Boxes box={card.box} />
        </div>

        <div className="card-prompt">
          {isRecall ? (
            <>
              <div className="meaning">{card.meaning}</div>
              {card.part_of_speech && <div className="pos">{card.part_of_speech}</div>}
            </>
          ) : (
            <>
              <div className="word" lang="it">{card.word}</div>
              {card.part_of_speech && <div className="pos">{card.part_of_speech}</div>}
              <div><SpeakButton text={card.word} /></div>
            </>
          )}
        </div>

        {revealed && (
          <dl className="details">
            {isRecall ? (
              <>
                {result && (
                  <div className={`verdict ${result}`}>
                    {result === "correct" && "Correct"}
                    {result === "accent" && "Check the accents"}
                    {result === "wrong" && "Not quite"}
                  </div>
                )}
                {result !== "correct" && (
                  <div>
                    <dt>You typed</dt>
                    <dd className="typed-answer" lang="it">{typed}</dd>
                  </div>
                )}
                <div>
                  <dt>Answer</dt>
                  <dd className="word" lang="it" style={{ fontSize: "1.6rem" }}>{card.word}</dd>
                  <SpeakButton text={card.word} />
                </div>
              </>
            ) : (
              <div>
                <dt>Meaning</dt>
                <dd className="meaning">{card.meaning}</dd>
              </div>
            )}
            {card.notes && (<div><dt>Notes</dt><dd>{card.notes}</dd></div>)}
            {card.example && (<div><dt>Example</dt><dd className="example" lang="it">{card.example}</dd></div>)}
            {card.source && (<div><dt>Where you met it</dt><dd>{card.source}</dd></div>)}
          </dl>
        )}
      </div>

      <div className="actions">
        {isRecall && !revealed && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              check();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              lang="it"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              placeholder={card.part_of_speech === "noun" ? "Include the article" : "Type the Italian"}
              aria-label="Your answer"
            />
            <div className="accent-keys">
              {ACCENTS.map((a) => (
                <button key={a} type="button" onClick={() => insertAccent(a)} aria-label={`Insert ${a}`}>{a}</button>
              ))}
            </div>
            <div className="btn-row" style={{ marginTop: "0.75rem" }}>
              <button type="button" className="btn btn-quiet" onClick={() => { setResult("wrong"); setRevealed(true); }}>
                I don&apos;t know
              </button>
              <button type="submit" className="btn btn-primary" disabled={!typed.trim()}>Check</button>
            </div>
          </form>
        )}

        {isRecall && revealed && (
          result === "correct" ? (
            <button className="btn btn-primary btn-block" onClick={() => grade(true, typed)} autoFocus>Next</button>
          ) : (
            <div className="stack">
              <button className="btn btn-primary btn-block" onClick={() => grade(false, typed || null)} autoFocus>Next</button>
              {typed.trim() && (
                <button className="btn btn-quiet btn-block" onClick={() => grade(true, typed)}>
                  I had it right, count it as correct
                </button>
              )}
            </div>
          )
        )}

        {!isRecall && !revealed && (
          <button className="btn btn-primary btn-block" onClick={() => setRevealed(true)} autoFocus>
            Show meaning
          </button>
        )}

        {!isRecall && revealed && (
          <div className="btn-row">
            <button className="btn btn-miss" onClick={() => grade(false, null)}>Missed it</button>
            <button className="btn btn-right" onClick={() => grade(true, null)}>Got it</button>
          </div>
        )}

        {saveFailed && <p className="error">An answer didn&apos;t save. Check your connection.</p>}
      </div>
    </>
  );
}
