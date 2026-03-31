from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openai_api_key: str = ""
    groq_api_key: str = ""
    transcription_backend: str = "groq"  # groq | whisper | funasr
    cors_origins: list[str] = ["http://localhost:3000"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
