import io

from openai import AsyncOpenAI

from app.config import settings
from app.services.transcription.base import TranscriptionService


class GroqWhisperTranscriptionService(TranscriptionService):
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1",
        )

    async def transcribe(self, audio_bytes: bytes, prompt: str = "") -> str:
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = "audio.wav"

        response = await self.client.audio.transcriptions.create(
            model="whisper-large-v3",
            file=audio_file,
            language="zh",
            prompt=prompt or None,
        )
        return response.text
