import Link from "next/link";
import { PARTS_OF_SPEECH, type Topic, type Word } from "@/lib/types";

type Props = {
  action: (fd: FormData) => Promise<void>;
  word?: Word;
  topics: Topic[];
  selectedTopicIds?: number[];
};

export default function WordForm({ action, word, topics, selectedTopicIds = [] }: Props) {
  const editing = Boolean(word);
  const selected = new Set(selectedTopicIds);
  return (
    <form action={action} className="form">
      {word && <input type="hidden" name="id" value={word.id} />}

      <div className="field">
        <label htmlFor="word">Italian</label>
        <input id="word" name="word" type="text" required autoFocus={!editing}
          autoCapitalize="none" autoCorrect="off" spellCheck={false} lang="it"
          defaultValue={word?.word ?? ""} />
        <span className="hint">For nouns, include the article: la chiave, l&apos;acqua</span>
      </div>

      <div className="field">
        <label htmlFor="part_of_speech">Part of speech</label>
        <select id="part_of_speech" name="part_of_speech" defaultValue={word?.part_of_speech ?? ""}>
          <option value="">Not set</option>
          {PARTS_OF_SPEECH.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="field">
        <label htmlFor="meaning">Meaning</label>
        <input id="meaning" name="meaning" type="text" defaultValue={word?.meaning ?? ""} />
        <span className="hint">Leave empty to fill in later. Words without a meaning aren&apos;t reviewed.</span>
      </div>

      <fieldset className="field topics-field">
        <legend>Topics</legend>
        {topics.length === 0 ? (
          <span className="hint">No topics yet. <Link href="/topics">Add some</Link>.</span>
        ) : (
          <div className="chips">
            {topics.map((t) => (
              <label key={t.id} className="chip">
                <input type="checkbox" name="topic" value={t.id} defaultChecked={selected.has(t.id)} />
                <span>{t.name}</span>
              </label>
            ))}
          </div>
        )}
        <span className="hint">Pick any that fit. <Link href="/topics">Manage topics</Link></span>
      </fieldset>

      <div className="field">
        <label htmlFor="notes">Usage notes</label>
        <textarea id="notes" name="notes" defaultValue={word?.notes ?? ""}
          placeholder="Auxiliary, preposition it takes, irregular forms…" />
      </div>

      <div className="field">
        <label htmlFor="example">Example sentence</label>
        <textarea id="example" name="example" lang="it" defaultValue={word?.example ?? ""} />
      </div>

      <div className="field">
        <label htmlFor="source">Where you saw or heard it</label>
        <input id="source" name="source" type="text" defaultValue={word?.source ?? ""} />
      </div>

      {editing ? (
        <button type="submit" className="btn btn-primary btn-block">Save changes</button>
      ) : (
        <div className="stack">
          <button type="submit" name="intent" value="another" className="btn btn-primary btn-block">
            Save and add another
          </button>
          <button type="submit" name="intent" value="done" className="btn btn-block">Save</button>
        </div>
      )}
    </form>
  );
}
