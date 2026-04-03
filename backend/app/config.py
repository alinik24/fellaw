from __future__ import annotations

import json
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),  # look in project root first, then CWD
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ------------------------------------------------------------------ #
    # Database
    # ------------------------------------------------------------------ #
    DATABASE_URL: str = (
        "postgresql+asyncpg://fellaw:fellaw_secure_2024@postgres:5432/fellaw_db"
    )

    # ------------------------------------------------------------------ #
    # Auth / JWT
    # ------------------------------------------------------------------ #
    SECRET_KEY: str = "fellaw-secret-key-2024-very-long-and-secure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # ------------------------------------------------------------------ #
    # Azure OpenAI – West Europe  (chat completions)
    # ------------------------------------------------------------------ #
    AZURE_WEU_ENDPOINT: str = ""
    AZURE_WEU_KEY: str = ""
    AZURE_WEU_API_VERSION: str = "2025-01-01-preview"
    AZURE_CHAT_MODEL: str = "gpt-4.1-mini"

    # ------------------------------------------------------------------ #
    # Azure OpenAI – Sweden Central  (embeddings)
    # ------------------------------------------------------------------ #
    AZURE_SE_ENDPOINT: str = ""
    AZURE_SE_KEY: str = ""
    AZURE_SE_API_VERSION: str = "2025-04-01-preview"
    AZURE_EMBEDDING_MODEL: str = "text-embedding-3-large"
    AZURE_EMBEDDING_DIMENSIONS: int = 1536

    # ------------------------------------------------------------------ #
    # Azure Document Intelligence
    # ------------------------------------------------------------------ #
    DOCINTEL_ENDPOINT: str = ""
    DOCINTEL_KEY: str = ""

    # ------------------------------------------------------------------ #
    # File uploads
    # ------------------------------------------------------------------ #
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: str = "50MB"

    @property
    def max_file_size_bytes(self) -> int:
        """Return MAX_FILE_SIZE as integer bytes."""
        raw = self.MAX_FILE_SIZE.upper().strip()
        if raw.endswith("MB"):
            return int(raw[:-2]) * 1024 * 1024
        if raw.endswith("KB"):
            return int(raw[:-2]) * 1024
        if raw.endswith("GB"):
            return int(raw[:-2]) * 1024 * 1024 * 1024
        return int(raw)

    # ------------------------------------------------------------------ #
    # CORS
    # ------------------------------------------------------------------ #
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:80",
        "http://frontend:80",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: object) -> List[str]:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("["):
                return json.loads(v)
            # comma-separated fallback
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v  # type: ignore[return-value]

    # ------------------------------------------------------------------ #
    # Application metadata
    # ------------------------------------------------------------------ #
    APP_NAME: str = "fellaw"
    APP_VERSION: str = "1.0.0"


settings = Settings()
