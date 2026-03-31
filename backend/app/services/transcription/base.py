from abc import ABC, abstractmethod


class TranscriptionService(ABC):
    @abstractmethod
    async def transcribe(self, audio_bytes: bytes) -> str:
        """Transcribe audio bytes (WAV format) to Chinese text."""
        ...
