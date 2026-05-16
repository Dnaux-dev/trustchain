import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    SECRET_KEY: str = "dev-secret-key-change-in-production-minimum-32-chars"
    MONGODB_URL: str = ""
    DATABASE_NAME: str = "trustchain"
    SQUAD_SECRET_KEY: str = ""
    SQUAD_PUBLIC_KEY: str = ""
    SQUAD_MERCHANT_ID: str = ""
    SQUAD_BASE_URL: str = "https://sandbox-api-d.squadco.com"
    DEBUG: bool = True
    ENROLLMENT_SESSIONS_REQUIRED: int = 3
    ALERT_EMAIL: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"
        # Don't crash if .env file doesn't exist
        env_file_encoding = "utf-8"


# Safe instantiation — never crashes
try:
    settings = Settings()
except Exception as e:
    print(f"[TrustChain] Warning: Settings error: {e}. Using defaults.")
    settings = Settings.model_construct(
        SECRET_KEY=os.getenv("SECRET_KEY", "dev-secret-key-change-in-production"),
        MONGODB_URL=os.getenv("MONGODB_URL", ""),
        DATABASE_NAME=os.getenv("DATABASE_NAME", "trustchain"),
        SQUAD_SECRET_KEY=os.getenv("SQUAD_SECRET_KEY", ""),
        SQUAD_PUBLIC_KEY=os.getenv("SQUAD_PUBLIC_KEY", ""),
        SQUAD_MERCHANT_ID=os.getenv("SQUAD_MERCHANT_ID", ""),
        SQUAD_BASE_URL=os.getenv("SQUAD_BASE_URL", "https://sandbox-api-d.squadco.com"),
        DEBUG=True,
        ENROLLMENT_SESSIONS_REQUIRED=3,
        ALERT_EMAIL="",
    )
