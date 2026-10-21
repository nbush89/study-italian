-- Run once against your Neon database (Neon SQL editor or psql).

create table if not exists words (
  id             serial primary key,
  word           text not null,          -- include the article for nouns: "la chiave"
  part_of_speech text,
  meaning        text,                   -- empty = needs details; excluded from review
  notes          text,
  example        text,
  source         text,                   -- where you saw or heard it
  created_at     timestamptz not null default now()
);

create table if not exists cards (
  id               serial primary key,
  word_id          int not null references words(id) on delete cascade,
  direction        text not null check (direction in ('it_en', 'en_it')),
  box              smallint not null default 1 check (box between 1 and 5),
  due_at           timestamptz not null default now(),
  last_reviewed_at timestamptz,
  unique (word_id, direction)
);

create index if not exists cards_due_idx on cards (due_at);

create table if not exists reviews (
  id           serial primary key,
  card_id      int not null references cards(id) on delete cascade,
  correct      boolean not null,
  typed_answer text,
  practice     boolean not null default false,
  box_before   smallint not null,
  box_after    smallint not null,
  reviewed_at  timestamptz not null default now()
);

create index if not exists reviews_card_idx on reviews (card_id, reviewed_at);

-- Topics ---------------------------------------------------------------
-- Safe to re-run: every statement is idempotent. If your database already has
-- the tables above, running this whole file again just adds what's missing.

create table if not exists topics (
  id         serial primary key,
  name       text not null check (trim(name) <> ''),
  created_at timestamptz not null default now()
);

-- "Travel", "travel" and " travel " count as the same topic.
create unique index if not exists topics_name_key on topics (lower(trim(name)));

create table if not exists word_topics (
  word_id  int not null references words(id) on delete cascade,
  topic_id int not null references topics(id) on delete cascade,
  primary key (word_id, topic_id)
);

create index if not exists word_topics_topic_idx on word_topics (topic_id);

-- Starter list. Rename, delete or add more from the Topics page in the app.
insert into topics (name) values
  ('Greetings & basics'),
  ('Numbers & time'),
  ('Family & people'),
  ('Describing people'),
  ('Feelings'),
  ('Food & drink'),
  ('Cooking'),
  ('Eating out'),
  ('Shopping & money'),
  ('Clothing'),
  ('Home'),
  ('Around town'),
  ('Travel & transport'),
  ('Work & study'),
  ('Free time & hobbies'),
  ('Body & health'),
  ('Weather & nature'),
  ('Animals')
on conflict do nothing;
