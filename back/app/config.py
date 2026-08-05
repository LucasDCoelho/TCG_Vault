from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "RabbitLab TCG Vault"
    database_url: str = "sqlite:///./tcgvault.db"
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7

    # Cookie de sessão (HttpOnly). SameSite=None + Secure exigidos em produção
    # (front em domínio diferente do back). Em LAN local (http://IP), use
    # COOKIE_SECURE=false e COOKIE_SAMESITE=lax no .env.
    cookie_name: str = "access_token"
    cookie_secure: bool = True
    cookie_samesite: str = "none"

    google_client_id: str | None = None
    google_client_secret: str | None = None
    google_redirect_uri: str = "http://localhost:8000/auth/callback"
    frontend_url: str = "http://localhost:4200"

    ocr_provider: str = "none"  # google | tesseract | none
    google_api_key: str | None = None

    scryfall_base: str = "https://api.scryfall.com"
    upload_dir: str = "./uploads"
    max_upload_mb: int = 10

    @property
    def google_enabled(self) -> bool:
        return bool(self.google_client_id and self.google_client_secret)

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024


settings = Settings()
