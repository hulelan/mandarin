import re
import unicodedata

from pypinyin import Style, pinyin


def is_chinese_char(ch: str) -> bool:
    """Check if a character is a CJK unified ideograph."""
    cp = ord(ch)
    return (
        (0x4E00 <= cp <= 0x9FFF)
        or (0x3400 <= cp <= 0x4DBF)
        or (0x20000 <= cp <= 0x2A6DF)
        or (0x2A700 <= cp <= 0x2B73F)
        or (0x2B740 <= cp <= 0x2B81F)
        or (0xF900 <= cp <= 0xFAFF)
        or (0x2F800 <= cp <= 0x2FA1F)
    )


def get_pinyin(text: str) -> list[tuple[str, str]]:
    """Convert Chinese text to list of (character, pinyin_with_tone_number) pairs.

    Only Chinese characters are included; punctuation, whitespace, and
    non-Chinese characters (letters, digits) are skipped.
    Example: "你好" -> [("你", "ni3"), ("好", "hao3")]
    """
    # Extract only Chinese characters, preserving their order
    chinese_chars = [ch for ch in text if is_chinese_char(ch)]
    if not chinese_chars:
        return []

    # Get pinyin for just the Chinese characters (avoids alignment issues
    # with mixed content like "CA985经过" where pypinyin passes through "ca985")
    chinese_text = "".join(chinese_chars)
    py = pinyin(chinese_text, style=Style.TONE3, heteronym=False)

    result = []
    for ch, syllable_list in zip(chinese_chars, py):
        result.append((ch, syllable_list[0].lower()))

    return result


def decompose_pinyin(py: str) -> tuple[str, str, str]:
    """Decompose a pinyin syllable into (initial, final, tone).

    Example: "zhong1" -> ("zh", "ong", "1")
             "ai4"    -> ("", "ai", "4")
             "de"     -> ("d", "e", "5")  (neutral tone)
    """
    # Extract tone number (last char if digit, else neutral tone 5)
    if py and py[-1].isdigit():
        tone = py[-1]
        base = py[:-1]
    else:
        tone = "5"
        base = py

    # Chinese initials in order of length (check longer ones first)
    initials = [
        "zh", "ch", "sh",
        "b", "p", "m", "f",
        "d", "t", "n", "l",
        "g", "k", "h",
        "j", "q", "x",
        "z", "c", "s",
        "r", "y", "w",
    ]

    for ini in initials:
        if base.startswith(ini):
            final = base[len(ini):]
            return (ini, final, tone)

    # No initial (e.g., "a", "o", "e", "ai", "ou")
    return ("", base, tone)
