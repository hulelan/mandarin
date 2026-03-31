import { pinyin } from "pinyin-pro";

export interface PinyinChar {
  char: string;
  pinyin: string;
  isChinese: boolean;
}

/**
 * Annotate a Chinese text string with pinyin for each character.
 * Non-Chinese characters get empty pinyin.
 */
export function annotatePinyin(text: string): PinyinChar[] {
  const pinyinResult = pinyin(text, {
    toneType: "symbol",
    type: "array",
  });

  const result: PinyinChar[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const cp = ch.codePointAt(0) ?? 0;
    const isChinese =
      (cp >= 0x4e00 && cp <= 0x9fff) ||
      (cp >= 0x3400 && cp <= 0x4dbf) ||
      (cp >= 0x20000 && cp <= 0x2a6df);

    result.push({
      char: ch,
      pinyin: isChinese && pinyinResult[i] ? pinyinResult[i] : "",
      isChinese,
    });
  }
  return result;
}
