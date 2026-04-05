/**
 * Split Chinese text into chunks of 2-3 sentences.
 * Joins lines within paragraphs first (OCR often adds line breaks mid-sentence).
 * Keeps punctuation attached to the preceding sentence.
 */
export function splitSentences(text: string): string[] {
  // First: merge lines within paragraphs.
  // A double newline = paragraph break. Single newlines = OCR line wrapping.
  const paragraphs = text.split(/\n{2,}/);
  const merged = paragraphs
    .map((p) => p.replace(/\n/g, "").trim())
    .filter((p) => p.length > 0)
    .join("\n");

  // Split on Chinese sentence-ending punctuation (。！？)
  const raw = merged.split(/(?<=[。！？])/);
  const sentences = raw.map((s) => s.trim()).filter((s) => s.length > 0);

  // Group into chunks of 2-3 sentences for natural reading
  const chunks: string[] = [];
  let current = "";
  let count = 0;
  for (const s of sentences) {
    current += s;
    count++;
    if (count >= 2) {
      chunks.push(current);
      current = "";
      count = 0;
    }
  }
  if (current) chunks.push(current);

  return chunks;
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
