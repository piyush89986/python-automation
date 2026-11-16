import os
from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    APP_NAME: str = "Multi-Tenant AI Chatbot Backend"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://instabotfr.vercel.app",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, tuple)):
            return list(v)
        return []

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/instabot_db"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    DATABASE_POOL_TIMEOUT: int = 30
    DATABASE_POOL_RECYCLE: int = 1800

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        # Convert standard postgres/postgresql uri to asyncpg driver if needed
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # Redis & Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Security & JWT
    JWT_SECRET_KEY: str = "insecure_dev_secret_key_change_in_production_1234567890abcdef"
    JWT_REFRESH_SECRET_KEY: str = "insecure_dev_refresh_key_change_in_production_abcdef123456"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14
    FIELD_ENCRYPTION_KEY: str = "k5L3UoW1iLXZw_56c7BwG2u-a1mE9FpG4oJk7N8bDcI="  # 32 url-safe base64 key

    # AI Providers
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    OPENAI_EMBEDDING_DIMENSIONS: int = 1536

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"

    LLM_TEMPERATURE: float = 0.1
    LLM_TIMEOUT_SECONDS: int = 15
    LLM_MAX_RETRIES: int = 2

    # Vector DB
    PINECONE_API_KEY: str = ""
    PINECONE_INDEX_NAME: str = "chatbot-kb"
    PINECONE_ENVIRONMENT: str = "us-east-1"
    RAG_TOP_K: int = 4
    RAG_SCORE_THRESHOLD: float = 0.72

    # Meta Graph API
    META_APP_ID: str = ""
    META_APP_SECRET: str = ""
    META_WEBHOOK_VERIFY_TOKEN: str = "verify_token_default"
    META_GRAPH_API_VERSION: str = "v21.0"
    META_GRAPH_API_BASE: str = "https://graph.facebook.com"

    # Super Admin Bootstrap
    FIRST_SUPER_ADMIN_EMAIL: str = "superadmin@example.com"
    FIRST_SUPER_ADMIN_PASSWORD: str = "SuperSecurePassword123!"


settings = Settings()
