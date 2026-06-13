from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, AnyHttpUrl
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )

    # App
    APP_NAME: str = "Hostel Management System"
    DEBUG: bool = False

    # Database
    DATABASE_URL: PostgresDsn

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # CORS
    ALLOWED_ORIGINS: list[AnyHttpUrl] = ["http://localhost:8000"]


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()