from fastapi import APIRouter, File, Form, UploadFile

from app.models.schemas import EvaluationResponse
from app.services.comparison import compare_pronunciation, compute_score
from app.services.transcription.factory import create_transcription_service

router = APIRouter()

_transcription_service = None


def get_transcription_service():
    global _transcription_service
    if _transcription_service is None:
        _transcription_service = create_transcription_service()
    return _transcription_service


@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate(
    audio: UploadFile = File(...),
    sentence: str = Form(...),
):
    """Evaluate pronunciation by transcribing audio and comparing to expected text."""
    audio_bytes = await audio.read()

    service = get_transcription_service()
    transcription = await service.transcribe(audio_bytes, prompt=sentence)

    characters = compare_pronunciation(sentence, transcription)
    score = compute_score(characters)

    return EvaluationResponse(
        transcription=transcription,
        characters=characters,
        score=score,
    )
