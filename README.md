# Parole — Italian vocabulary review

A small personal app: add Italian words with your own meanings and notes, then review them with Leitner-box spaced repetition.

Stack: Next.js (App Router) + TypeScript, Neon Postgres via `@neondatabase/serverless`, deployed on Vercel. No other services.

## Setup

1. **Database.** In your Neon project, open the SQL editor and run `db/schema.sql`. The file is safe to re-run: after pulling schema changes (like topics), run the whole file again and it only adds what's missing.
2. **Environment.** Copy `.env.example` to `.env.local` and fill in:
   - `DATABASE_URL`: the pooled Neon connection string
   - `APP_USER` / `APP_PASSWORD`: the login for the app (HTTP basic auth over the whole site)
3. **Run locally.** `npm install`, then `npm run dev`.
4. **Deploy.** Import the repo in Vercel and add the same three environment variables. On your phone, open the site and use "Add to Home Screen."

## How scheduling works

Each word gets two cards, Italian → English and English → Italian, scheduled separately.

| Box | Comes back after |
|-----|------------------|
| 1   | 1 day            |
| 2   | 2 days           |
| 3   | 4 days           |
| 4   | 8 days           |
| 5   | 16 days          |

- New cards start in box 1 and are due immediately.
- Correct: move up one box (box 5 stays at 5).
- Missed: back to box 1, due tomorrow. It also gets one more look at the end of the current session; that second look isn't recorded.
- Practice mode (when nothing is due): pulls your lowest-box cards. A correct answer doesn't change the schedule; a miss still sends the card to box 1.
- A session shows at most one card per word, so one direction doesn't give away the other.

Intervals live in `lib/leitner.ts` (`BOX_INTERVAL_DAYS`). To make misses gentler, change the `!correct` branch to `Math.max(box - 1, 1)`.

## Topics

Words can be tagged with any number of topics (travel, cooking…) picked from a fixed list, so there's no "Food" vs "food" vs "Foods" drift. Manage the list on the Topics page (linked from Words and from the word form). New or renamed topics are rejected if they match an existing one ignoring capitals, accents, plurals and "&" vs "and".

- Words page: filter by topic, or "No topic yet" to find untagged words.
- Home: "Review one topic" lists topics with words due; that session (and practice mode) is limited to the topic.
- "Save and add another" keeps the same topics ticked for the next word.
- Deleting a topic removes the tag only; words and their progress stay.

## Answer checking (English → Italian)

`lib/answer.ts` compares your typed answer to the saved word, ignoring case, extra spaces, and curly vs straight apostrophes. An accent-only difference shows "Check the accents" and counts as a miss. If you typed something valid that differs from what you saved (a synonym, a typo you'd forgive), use "I had it right, count it as correct."

## Files

- `db/schema.sql`: tables `words`, `cards`, `reviews`, `topics`, `word_topics`
- `app/topics/page.tsx` + `lib/topics.ts`: topic list, duplicate check
- `app/actions.ts`: server actions (create/update/delete word, reset progress, record review)
- `app/review/page.tsx` + `components/ReviewSession.tsx`: review flow
- `app/words/…`: word list, add, edit
- `middleware.ts`: basic auth
