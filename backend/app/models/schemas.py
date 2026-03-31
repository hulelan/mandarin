from enum import Enum

from pydantic import BaseModel


class CharStatus(str, Enum):
    correct = "correct"
    tone_wrong = "tone_wrong"
    wrong = "wrong"
    missed = "missed"
    extra = "extra"


class CharResult(BaseModel):
    char: str
    expected_pinyin: str
    actual_pinyin: str | None = None
    status: CharStatus


class EvaluationResponse(BaseModel):
    transcription: str
    characters: list[CharResult]
    score: float  # 0-1, fraction of characters correct
