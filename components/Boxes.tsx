import { MAX_BOX } from "@/lib/leitner";

/** Shows which Leitner box a card is in, as filled dots. */
export default function Boxes({ box, label }: { box: number; label?: string }) {
  return (
    <span className="boxes" role="img" aria-label={`${label ? label + ": " : ""}box ${box} of ${MAX_BOX}`}>
      {Array.from({ length: MAX_BOX }, (_, i) => (
        <span key={i} className={i < box ? "on" : undefined} />
      ))}
    </span>
  );
}
