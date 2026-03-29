from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/parking_db"
    SECRET_KEY: str = "super-secret-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    INSTANT_BOOKING_TTL_MINUTES: int = 30
    DEFAULT_SESSION_DURATION_HOURS: int = 3

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
