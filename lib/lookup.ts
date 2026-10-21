const LEADING_ARTICLE = /^(?:(?:il|lo|la|i|gli|le|un|uno|una)\s+|l'|un')/i;

/** "la chiave" -> "chiave", "l'acqua" -> "acqua" */
export function withoutArticle(word: string): string {
  return word.trim().replace(/[’]/g, "'").replace(LEADING_ARTICLE, "").trim();
}

export function wordReferenceUrl(word: string): string {
  return `https://www.wordreference.com/iten/${encodeURIComponent(withoutArticle(word))}`;
}

export function wiktionaryUrl(word: string): string {
  return `https://en.wiktionary.org/wiki/${encodeURIComponent(withoutArticle(word))}#Italian`;
}
