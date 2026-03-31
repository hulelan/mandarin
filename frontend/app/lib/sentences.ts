/**
 * Split Chinese text into sentences on Chinese punctuation and newlines.
 * Keeps punctuation attached to the preceding sentence.
 */
export function splitSentences(text: string): string[] {
  // Split on Chinese sentence-ending punctuation (。！？) and newlines
  // The regex keeps the delimiter attached to the preceding text
  const raw = text.split(/(?<=[。！？\n])/);

  return raw
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Check if a character is a Chinese (CJK) character.
 */
export function isChineseChar(ch: string): boolean {
  const cp = ch.codePointAt(0);
  if (cp === undefined) return false;
  return (
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0x20000 && cp <= 0x2a6df)
  );
}

/**
 * Extract only Chinese characters from a string.
 */
export function extractChinese(text: string): string {
  return [...text].filter(isChineseChar).join("");
}
