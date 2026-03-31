import io
import tempfile

from app.services.transcription.base import TranscriptionService


class FunASRTranscriptionService(TranscriptionService):
    def __init__(self):
        try:
            from funasr import AutoModel
        except ImportError:
            raise ImportError(
                "FunASR not installed. Install with: pip install funasr torch torchaudio"
            )
        self.model = AutoModel(model="paraformer-zh", device="cpu")

    async def transcribe(self, audio_bytes: bytes, prompt: str = "") -> str:
        # FunASR needs a file path, so write to a temp file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as f:
            f.write(audio_bytes)
            f.flush()
            result = self.model.generate(input=f.name)

        if result and len(result) > 0:
            return result[0]["text"]
        return ""
