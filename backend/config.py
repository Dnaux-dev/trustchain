from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "TrustChain"
    APP_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # MongoDB
    MONGODB_URL: str
    DATABASE_NAME: str = "trustchain"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Squad API
    SQUAD_SECRET_KEY: str
    SQUAD_PUBLIC_KEY: str
    SQUAD_MERCHANT_ID: str
    SQUAD_BASE_URL: str = "https://sandbox-api-d.squadco.com"
    SQUAD_WEBHOOK_SECRET: str = ""

    # Biometric Engine
    BEHAVIORAL_SCORE_THRESHOLD: float = 70.0
    ENROLLMENT_SESSIONS_REQUIRED: int = 3
    MAX_PROFILE_VECTORS: int = 50

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
