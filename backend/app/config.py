import os
import secrets
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent


def _load_dotenv() -> None:
    """Populate os.environ from .env without overriding explicit environment variables."""
    for candidate in (BASE_DIR / ".env", BASE_DIR.parent / ".env"):
        if not candidate.exists():
            continue
        try:
            for raw_line in candidate.read_text(encoding="utf-8").splitlines():
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, val = line.split("=", 1)
                key = key.strip()
                val = val.strip().strip('"').strip("'")
                if key:
                    os.environ.setdefault(key, val)
        except OSError:
            pass


_load_dotenv()


def _resolve_data_dir() -> Path:
    env_dir = os.getenv("VCAMP_DATA_DIR", "").strip()
    if env_dir:
        return Path(env_dir)
    if os.name == "nt" and os.getenv("VCAMP_DESKTOP_PORTABLE", "") != "1":
        appdata = os.getenv("APPDATA")
        if appdata and os.getenv("VCAMP_USE_LOCAL_DEV_DB", "1") != "1":
            return Path(appdata) / "VCamp" / "data"
    return BASE_DIR


DATA_DIR = _resolve_data_dir()
DATA_DIR.mkdir(parents=True, exist_ok=True)


def _load_or_create_jwt_secret() -> str:
    env_secret = os.getenv("VCAMP_JWT_SECRET", "").strip()
    if env_secret:
        return env_secret
    secret_file = DATA_DIR / ".vcamp_jwt_secret"
    if secret_file.exists():
        stored = secret_file.read_text(encoding="utf-8").strip()
        if len(stored) >= 32:
            return stored
    generated = secrets.token_urlsafe(48)
    try:
        secret_file.write_text(generated, encoding="utf-8")
    except OSError:
        pass
    return generated


class Settings(BaseModel):
    PROJECT_NAME: str = "VDart Companion (VCamp)"
    VERSION: str = "3.0.0"
    API_V1_STR: str = "/api"

    # Paths
    DATA_DIR: Path = DATA_DIR
    LOG_DIR: Path = DATA_DIR / "logs"
    BACKUP_DIR: Path = DATA_DIR / "backups"
    UPLOAD_DIR: Path = DATA_DIR / "uploads" / "companion_models"
    MAX_UPLOAD_SIZE_BYTES: int = 50 * 1024 * 1024  # 50MB

    # Security & JWT (never hardcoded in source)
    JWT_SECRET_KEY: str = _load_or_create_jwt_secret()
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{(DATA_DIR / 'vcamp_enterprise.db').as_posix()}",
    )

    # AI Provider Configuration (no hardcoded keys)
    AI_PROVIDER: str = os.getenv("VCAMP_AI_PROVIDER", "groq")  # groq | openai_compatible | offline
    AI_BASE_URL: str = os.getenv("VCAMP_AI_BASE_URL", "https://api.groq.com/openai/v1")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    GROQ_WHISPER_MODEL: str = os.getenv("GROQ_WHISPER_MODEL", "whisper-large-v3-turbo")

    # Sentiment & Privacy Guardrails
    SENTIMENT_CONFIDENCE_THRESHOLD: float = 0.55
    SENTIMENT_MODEL_VERSION: str = "vcamp-multilingual-v3.0"
    HR_MIN_AGGREGATION_THRESHOLD: int = int(os.getenv("VCAMP_HR_MIN_GROUP_SIZE", "3"))

    # Demo Seeding (disabled by default unless explicitly enabled for local testing)
    ENABLE_DEMO_ACCOUNTS: bool = os.getenv("VCAMP_ENABLE_DEMO_ACCOUNTS", "0") == "1"

    # Explicit CORS Origins (no wildcard when credentials are enabled)
    CORS_ORIGINS: list[str] = [
        "http://localhost:1420",
        "http://127.0.0.1:1420",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "tauri://localhost",
        "http://tauri.localhost",
        "https://tauri.localhost",
    ]


settings = Settings()
settings.LOG_DIR.mkdir(parents=True, exist_ok=True)
settings.BACKUP_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
