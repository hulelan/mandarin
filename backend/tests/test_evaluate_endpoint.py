"""Red-green tests for the /api/evaluate endpoint.

Tests the full pipeline: audio upload → transcription (mocked) → pinyin comparison → color-coded results.
"""

import io
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.schemas import CharStatus


@pytest.fixture
def client():
    return TestClient(app)


def fake_wav() -> bytes:
    """Minimal valid WAV header (no real audio needed since transcription is mocked)."""
    buf = io.BytesIO()
    # RIFF header
    buf.write(b"RIFF")
    buf.write((36).to_bytes(4, "little"))  # file size - 8
    buf.write(b"WAVE")
    # fmt chunk
    buf.write(b"fmt ")
    buf.write((16).to_bytes(4, "little"))
    buf.write((1).to_bytes(2, "little"))   # PCM
    buf.write((1).to_bytes(2, "little"))   # mono
    buf.write((16000).to_bytes(4, "little"))  # sample rate
    buf.write((32000).to_bytes(4, "little"))  # byte rate
    buf.write((2).to_bytes(2, "little"))   # block align
    buf.write((16).to_bytes(2, "little"))  # bits per sample
    # data chunk (empty)
    buf.write(b"data")
    buf.write((0).to_bytes(4, "little"))
    return buf.getvalue()


def evaluate(client, sentence: str, mock_transcription: str):
    """Helper: POST to /api/evaluate with mocked transcription."""
    with patch(
        "app.routers.evaluate.get_transcription_service"
    ) as mock_factory:
        mock_service = AsyncMock()
        mock_service.transcribe.return_value = mock_transcription
        mock_factory.return_value = mock_service

        response = client.post(
            "/api/evaluate",
            files={"audio": ("test.wav", fake_wav(), "audio/wav")},
            data={"sentence": sentence},
        )
    return response.json()


# --- GREEN: all correct ---

def test_all_green_simple(client):
    """Perfect pronunciation → all characters should be 'correct' (green)."""
    result = evaluate(client, "你好", "你好")
    assert result["score"] == 1.0
    for ch in result["characters"]:
        assert ch["status"] == "correct", f"{ch['char']} should be green"


def test_all_green_longer(client):
    """Full sentence, perfect match."""
    result = evaluate(client, "今天天气很好", "今天天气很好")
    assert result["score"] == 1.0
    assert len(result["characters"]) == 6
    assert all(ch["status"] == "correct" for ch in result["characters"])


# --- RED: wrong syllable ---

def test_all_red(client):
    """Completely wrong pronunciation → all 'wrong' (red)."""
    result = evaluate(client, "你好", "他们")
    assert result["score"] == 0.0
    for ch in result["characters"]:
        assert ch["status"] == "wrong", f"{ch['char']} should be red"


def test_red_partial(client):
    """First char correct, second char wrong syllable."""
    # 是 (shi4) vs 十 (shi2) — different tone, so tone_wrong
    # 人 (ren2) vs 大 (da4) — totally different, so wrong
    result = evaluate(client, "大人", "花鸟")
    assert all(ch["status"] == "wrong" for ch in result["characters"])


# --- ORANGE: tone wrong ---

def test_tone_wrong(client):
    """Same syllable, different tone → 'tone_wrong' (orange)."""
    # 妈 (ma1) vs 马 (ma3)
    result = evaluate(client, "妈", "马")
    assert len(result["characters"]) == 1
    assert result["characters"][0]["status"] == "tone_wrong"


def test_tone_wrong_multiple(client):
    """Multiple tone errors in a row."""
    # 妈妈 (ma1 ma1) → 马马 (ma3 ma3)
    result = evaluate(client, "妈妈", "马马")
    assert len(result["characters"]) == 2
    assert all(ch["status"] == "tone_wrong" for ch in result["characters"])


# --- GRAY: missed characters ---

def test_missed_characters(client):
    """User said fewer characters than expected → extras are 'missed' (gray)."""
    result = evaluate(client, "你好世界", "你好")
    assert len(result["characters"]) == 4
    assert result["characters"][0]["status"] == "correct"
    assert result["characters"][1]["status"] == "correct"
    assert result["characters"][2]["status"] == "missed"
    assert result["characters"][3]["status"] == "missed"
    assert result["score"] == 0.5


def test_all_missed(client):
    """User said nothing → all 'missed'."""
    result = evaluate(client, "你好", "")
    assert all(ch["status"] == "missed" for ch in result["characters"])
    assert result["score"] == 0.0


# --- MIXED results ---

def test_mixed_correct_and_wrong(client):
    """Mix of correct, tone_wrong, and wrong in one sentence."""
    # 我是学生 vs 我十雪声
    # 我 (wo3) vs 我 (wo3) → correct
    # 是 (shi4) vs 十 (shi2) → tone_wrong (same sh+i, different tone)
    # 学 (xue2) vs 雪 (xue3) → tone_wrong
    # 生 (sheng1) vs 声 (sheng1) → correct
    result = evaluate(client, "我是学生", "我十雪声")
    chars = {ch["char"]: ch["status"] for ch in result["characters"]}
    assert chars["我"] == "correct"
    assert chars["是"] == "tone_wrong"
    assert chars["学"] == "tone_wrong"
    assert chars["生"] == "correct"


# --- EDGE CASES ---

def test_punctuation_ignored(client):
    """Punctuation in expected text should not affect comparison."""
    result = evaluate(client, "你好！世界。", "你好世界")
    assert len(result["characters"]) == 4
    assert all(ch["status"] == "correct" for ch in result["characters"])


def test_response_shape(client):
    """Verify the response has all expected fields."""
    result = evaluate(client, "你好", "你好")
    assert "transcription" in result
    assert "characters" in result
    assert "score" in result
    assert result["transcription"] == "你好"
    for ch in result["characters"]:
        assert "char" in ch
        assert "expected_pinyin" in ch
        assert "actual_pinyin" in ch
        assert "status" in ch


def test_homophones_are_green(client):
    """Homophones (different char, same pinyin) should be 'correct'."""
    # 她 (ta1) vs 他 (ta1) — exact same pinyin
    result = evaluate(client, "她", "他")
    assert result["characters"][0]["status"] == "correct"
