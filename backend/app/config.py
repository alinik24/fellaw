from __future__ import annotations

import json
from typing import List, Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ------------------------------------------------------------------ #
    # Application
    # ------------------------------------------------------------------ #
    APP_NAME: str = "fellaw"
    APP_VERSION: str = "1.0.0"

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
    # AI Provider Configuration
    # ------------------------------------------------------------------ #
    AI_PROVIDER: Literal["openai", "azure", "anthropic", "google", "cohere", "local"] = "openai"

    # Model Configuration
    CHAT_MODEL: str = "gpt-4-turbo-preview"
    CHAT_TEMPERATURE: float = 0.3
    CHAT_MAX_TOKENS: int = 2000

    EMBEDDING_MODEL: str = "text-embedding-3-large"
    EMBEDDING_DIMENSIONS: int = 1536

    # ------------------------------------------------------------------ #
    # OpenAI (Standard API)
    # ------------------------------------------------------------------ #
    OPENAI_API_KEY: str = ""
    OPENAI_ORG_ID: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"

    # ------------------------------------------------------------------ #
    # Azure OpenAI
    # ------------------------------------------------------------------ #
    AZURE_OPENAI_ENDPOINT: str = ""
    AZURE_OPENAI_API_KEY: str = ""
    AZURE_OPENAI_API_VERSION: str = "2024-02-15-preview"
    AZURE_CHAT_DEPLOYMENT: str = "gpt-4-turbo"

    AZURE_EMBEDDING_ENDPOINT: str = ""
    AZURE_EMBEDDING_API_KEY: str = ""
    AZURE_EMBEDDING_API_VERSION: str = "2024-02-15-preview"
    AZURE_EMBEDDING_DEPLOYMENT: str = "text-embedding-3-large"

    # ------------------------------------------------------------------ #
    # Anthropic Claude
    # ------------------------------------------------------------------ #
    ANTHROPIC_API_KEY: str = ""

    # ------------------------------------------------------------------ #
    # Google AI / Vertex AI
    # ------------------------------------------------------------------ #
    GOOGLE_API_KEY: str = ""
    GOOGLE_PROJECT_ID: str = ""
    GOOGLE_LOCATION: str = "us-central1"

    # ------------------------------------------------------------------ #
    # Cohere
    # ------------------------------------------------------------------ #
    COHERE_API_KEY: str = ""

    # ------------------------------------------------------------------ #
    # Local / Ollama
    # ------------------------------------------------------------------ #
    LOCAL_MODEL_URL: str = "http://localhost:11434"
    LOCAL_CHAT_MODEL: str = "llama3.1:8b"
    LOCAL_EMBEDDING_MODEL: str = "nomic-embed-text"

    # ------------------------------------------------------------------ #
    # Azure Document Intelligence
    # ------------------------------------------------------------------ #
    DOCINTEL_ENDPOINT: str = ""
    DOCINTEL_API_KEY: str = ""

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
        "http://localhost:8081",
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
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v  # type: ignore[return-value]

    # ------------------------------------------------------------------ #
    # Optional Features
    # ------------------------------------------------------------------ #
    LOG_LEVEL: str = "INFO"
    DEBUG: bool = False
    TESTING: bool = False

    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60

    CACHE_ENABLED: bool = False
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL: int = 3600

    # ------------------------------------------------------------------ #
    # Helper Methods
    # ------------------------------------------------------------------ #

    def get_chat_client_config(self) -> dict:
        """Get configuration for chat/completion client based on AI_PROVIDER."""
        if self.AI_PROVIDER == "openai":
            return {
                "provider": "openai",
                "api_key": self.OPENAI_API_KEY,
                "org_id": self.OPENAI_ORG_ID or None,
                "base_url": self.OPENAI_BASE_URL,
                "model": self.CHAT_MODEL,
                "temperature": self.CHAT_TEMPERATURE,
                "max_tokens": self.CHAT_MAX_TOKENS,
            }
        elif self.AI_PROVIDER == "azure":
            return {
                "provider": "azure",
                "api_key": self.AZURE_OPENAI_API_KEY,
                "endpoint": self.AZURE_OPENAI_ENDPOINT,
                "api_version": self.AZURE_OPENAI_API_VERSION,
                "deployment": self.AZURE_CHAT_DEPLOYMENT,
                "temperature": self.CHAT_TEMPERATURE,
                "max_tokens": self.CHAT_MAX_TOKENS,
            }
        elif self.AI_PROVIDER == "anthropic":
            return {
                "provider": "anthropic",
                "api_key": self.ANTHROPIC_API_KEY,
                "model": self.CHAT_MODEL,
                "temperature": self.CHAT_TEMPERATURE,
                "max_tokens": self.CHAT_MAX_TOKENS,
            }
        elif self.AI_PROVIDER == "google":
            return {
                "provider": "google",
                "api_key": self.GOOGLE_API_KEY,
                "project_id": self.GOOGLE_PROJECT_ID or None,
                "location": self.GOOGLE_LOCATION,
                "model": self.CHAT_MODEL,
                "temperature": self.CHAT_TEMPERATURE,
                "max_tokens": self.CHAT_MAX_TOKENS,
            }
        elif self.AI_PROVIDER == "cohere":
            return {
                "provider": "cohere",
                "api_key": self.COHERE_API_KEY,
                "model": self.CHAT_MODEL,
                "temperature": self.CHAT_TEMPERATURE,
                "max_tokens": self.CHAT_MAX_TOKENS,
            }
        elif self.AI_PROVIDER == "local":
            return {
                "provider": "local",
                "base_url": self.LOCAL_MODEL_URL,
                "model": self.LOCAL_CHAT_MODEL,
                "temperature": self.CHAT_TEMPERATURE,
                "max_tokens": self.CHAT_MAX_TOKENS,
            }
        else:
            raise ValueError(f"Unsupported AI provider: {self.AI_PROVIDER}")

    def get_embedding_client_config(self) -> dict:
        """Get configuration for embedding client based on AI_PROVIDER."""
        if self.AI_PROVIDER == "openai":
            return {
                "provider": "openai",
                "api_key": self.OPENAI_API_KEY,
                "base_url": self.OPENAI_BASE_URL,
                "model": self.EMBEDDING_MODEL,
                "dimensions": self.EMBEDDING_DIMENSIONS,
            }
        elif self.AI_PROVIDER == "azure":
            return {
                "provider": "azure",
                "api_key": self.AZURE_EMBEDDING_API_KEY,
                "endpoint": self.AZURE_EMBEDDING_ENDPOINT,
                "api_version": self.AZURE_EMBEDDING_API_VERSION,
                "deployment": self.AZURE_EMBEDDING_DEPLOYMENT,
                "dimensions": self.EMBEDDING_DIMENSIONS,
            }
        elif self.AI_PROVIDER == "cohere":
            return {
                "provider": "cohere",
                "api_key": self.COHERE_API_KEY,
                "model": self.EMBEDDING_MODEL,
                "dimensions": self.EMBEDDING_DIMENSIONS,
            }
        elif self.AI_PROVIDER == "google":
            return {
                "provider": "google",
                "api_key": self.GOOGLE_API_KEY,
                "model": self.EMBEDDING_MODEL,
                "dimensions": self.EMBEDDING_DIMENSIONS,
            }
        elif self.AI_PROVIDER == "local":
            return {
                "provider": "local",
                "base_url": self.LOCAL_MODEL_URL,
                "model": self.LOCAL_EMBEDDING_MODEL,
                "dimensions": self.EMBEDDING_DIMENSIONS,
            }
        else:
            raise ValueError(f"Unsupported AI provider for embeddings: {self.AI_PROVIDER}")


settings = Settings()
