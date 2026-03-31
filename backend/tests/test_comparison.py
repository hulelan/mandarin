from app.models.schemas import CharStatus
from app.services.comparison import compare_pronunciation, compute_score


def test_perfect_match():
    results = compare_pronunciation("你好", "你好")
    assert len(results) == 2
    assert all(r.status == CharStatus.correct for r in results)
    assert compute_score(results) == 1.0


def test_completely_wrong():
    results = compare_pronunciation("你好", "他们")
    assert len(results) == 2
    assert all(r.status == CharStatus.wrong for r in results)
    assert compute_score(results) == 0.0


def test_tone_wrong():
    # 妈 (ma1) vs 马 (ma3) — same initial+final, different tone
    results = compare_pronunciation("妈", "马")
    assert len(results) == 1
    assert results[0].status == CharStatus.tone_wrong


def test_partial_match():
    # "你好世界" but user only says "你好"
    results = compare_pronunciation("你好世界", "你好")
    assert len(results) == 4
    assert results[0].status == CharStatus.correct
    assert results[1].status == CharStatus.correct
    assert results[2].status == CharStatus.missed
    assert results[3].status == CharStatus.missed
    assert compute_score(results) == 0.5


def test_longer_sentence():
    results = compare_pronunciation("我是一个学生", "我是一个学生")
    assert len(results) == 6
    assert all(r.status == CharStatus.correct for r in results)
    assert compute_score(results) == 1.0


def test_empty_transcription():
    results = compare_pronunciation("你好", "")
    assert len(results) == 2
    assert all(r.status == CharStatus.missed for r in results)


def test_empty_expected():
    results = compare_pronunciation("", "你好")
    assert len(results) == 0


def test_with_punctuation():
    results = compare_pronunciation("你好，世界！", "你好世界")
    assert len(results) == 4
    assert all(r.status == CharStatus.correct for r in results)
