export type CheckResult = "correct" | "accent" | "wrong";

function normalize(s: string): string {
  return s
    .normalize("NFC")
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/'\s+/g, "'") // "l' acqua" -> "l'acqua"
    .replace(/\s+/g, " ")
    .trim();
}

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Exact match after normalizing case/spacing/apostrophes. Accent-only differences are reported separately. */
export function checkAnswer(typed: string, expected: string): CheckResult {
  const t = normalize(typed);
  const e = normalize(expected);
  if (t === e) return "correct";
  if (stripAccents(t) === stripAccents(e)) return "accent";
  return "wrong";
}
