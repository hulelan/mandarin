from app.config import settings
from app.services.transcription.base import TranscriptionService


def create_transcription_service() -> TranscriptionService:
    backend = settings.transcription_backend

    if backend == "groq":
        from app.services.transcription.groq_whisper import GroqWhisperTranscriptionService
        return GroqWhisperTranscriptionService()

    if backend == "whisper":
        from app.services.transcription.whisper import WhisperTranscriptionService
        return WhisperTranscriptionService()

    if backend == "funasr":
        from app.services.transcription.funasr_backend import FunASRTranscriptionService
        return FunASRTranscriptionService()

    raise ValueError(f"Unknown transcription backend: {backend}")
