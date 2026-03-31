from difflib import SequenceMatcher

from app.models.schemas import CharResult, CharStatus
from app.services.pinyin_service import decompose_pinyin, get_pinyin


def compare_pronunciation(
    expected_text: str, transcribed_text: str
) -> list[CharResult]:
    """Compare expected Chinese text against transcribed text, returning per-character results.

    Uses pinyin alignment to determine correctness at initial/final/tone levels.
    """
    expected = get_pinyin(expected_text)
    actual = get_pinyin(transcribed_text)

    if not expected:
        return []

    # Extract just the pinyin strings for alignment
    expected_py = [py for _, py in expected]
    actual_py = [py for _, py in actual]

    # Use SequenceMatcher to align the two pinyin sequences
    matcher = SequenceMatcher(None, expected_py, actual_py)
    opcodes = matcher.get_opcodes()

    results: list[CharResult] = []

    for tag, i1, i2, j1, j2 in opcodes:
        if tag == "equal":
            for k in range(i2 - i1):
                char, exp_py = expected[i1 + k]
                _, act_py = actual[j1 + k]
                results.append(CharResult(
                    char=char,
                    expected_pinyin=exp_py,
                    actual_pinyin=act_py,
                    status=CharStatus.correct,
                ))
        elif tag == "replace":
            # Pair up replacements one-to-one
            exp_count = i2 - i1
            act_count = j2 - j1
            pairs = min(exp_count, act_count)

            for k in range(pairs):
                char, exp_py = expected[i1 + k]
                _, act_py = actual[j1 + k]
                status = _classify(exp_py, act_py)
                results.append(CharResult(
                    char=char,
                    expected_pinyin=exp_py,
                    actual_pinyin=act_py,
                    status=status,
                ))

            # Remaining expected chars are missed
            for k in range(pairs, exp_count):
                char, exp_py = expected[i1 + k]
                results.append(CharResult(
                    char=char,
                    expected_pinyin=exp_py,
                    actual_pinyin=None,
                    status=CharStatus.missed,
                ))

            # Remaining actual chars are extra (we don't add these to results
            # since we report per expected character)

        elif tag == "delete":
            # Characters in expected but not in actual -> missed
            for k in range(i2 - i1):
                char, exp_py = expected[i1 + k]
                results.append(CharResult(
                    char=char,
                    expected_pinyin=exp_py,
                    actual_pinyin=None,
                    status=CharStatus.missed,
                ))

        elif tag == "insert":
            # Characters in actual but not in expected -> extra
            # We track these separately but don't add to per-expected-char results
            pass

    return results


def _classify(expected_py: str, actual_py: str) -> CharStatus:
    """Classify the difference between two pinyin syllables."""
    if expected_py == actual_py:
        return CharStatus.correct

    exp_ini, exp_fin, exp_tone = decompose_pinyin(expected_py)
    act_ini, act_fin, act_tone = decompose_pinyin(actual_py)

    # Same initial and final, different tone
    if exp_ini == act_ini and exp_fin == act_fin:
        # If either side is neutral tone (5), treat as correct —
        # neutral tone is often a transcription artifact (e.g., 的 de5 vs de2)
        if exp_tone == "5" or act_tone == "5":
            return CharStatus.correct
        return CharStatus.tone_wrong

    # Same initial, similar final (handle common Whisper confusions)
    # e.g., "de" vs "di" — same initial, finals differ only slightly
    if exp_ini == act_ini and exp_fin and act_fin:
        # If one side is neutral tone, be lenient on the final too
        if exp_tone == "5" or act_tone == "5":
            return CharStatus.tone_wrong

    return CharStatus.wrong


def compute_score(results: list[CharResult]) -> float:
    """Compute overall score as fraction of characters correct (0.0 to 1.0)."""
    if not results:
        return 1.0
    correct = sum(1 for r in results if r.status == CharStatus.correct)
    return correct / len(results)
