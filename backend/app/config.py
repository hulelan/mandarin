from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openai_api_key: str = ""
    groq_api_key: str = ""
    transcription_backend: str = "groq"  # groq | whisper | funasr
    cors_origins: str = "http://localhost:3000"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def cors_origin_list(self) -> list[str]:
        """Parse cors_origins as comma-separated or JSON list."""
        import json
        val = self.cors_origins.strip()
        if val.startswith("["):
            return json.loads(val)
        return [o.strip() for o in val.split(",") if o.strip()]


settings = Settings()
