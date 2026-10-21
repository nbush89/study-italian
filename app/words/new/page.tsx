import { createWord } from "@/app/actions";
import WordForm from "@/components/WordForm";
import { getTopics, parseIds } from "@/lib/topics";

export const dynamic = "force-dynamic";

export default async function NewWordPage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string; topics?: string }>;
}) {
  const { added, topics: keep } = await searchParams;
  const topics = await getTopics();
  return (
    <>
      <h1>Add a word</h1>
      {added && <p className="notice">Saved <span lang="it">{added}</span>.</p>}
      {/* key resets the form after "Save and add another" */}
      <WordForm key={added ?? "new"} action={createWord} topics={topics} selectedTopicIds={parseIds(keep)} />
    </>
  );
}
