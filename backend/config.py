from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).parent.parent / ".env",
        env_file_encoding="utf-8",
    )

    database_url: str
    secret_key: str
    access_token_expire_minutes: int
    refresh_token_expire_days: int
    uploads_dir: str
    model_path: str
    classes_path: str
    allowed_origins: str

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]


settings = Settings()
