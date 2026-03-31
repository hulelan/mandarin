from abc import ABC, abstractmethod


class TranscriptionService(ABC):
    @abstractmethod
    async def transcribe(self, audio_bytes: bytes, prompt: str = "") -> str:
        """Transcribe audio bytes (WAV format) to Chinese text.

        Args:
            audio_bytes: Raw WAV audio.
            prompt: Optional text hint to bias transcription toward expected characters.
        """
        ...
