import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseModel):
    PROJECT_NAME: str = "VCamp Enterprise AI Platform"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    
    # Security & JWT
    JWT_SECRET_KEY: str = os.getenv("VCAMP_JWT_SECRET", "vcamp_super_secret_argon2id_jwt_key_2026_production")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/vcamp_enterprise.db")
    
    # Groq AI Credentials
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    GROQ_WHISPER_MODEL: str = os.getenv("GROQ_WHISPER_MODEL", "whisper-large-v3-turbo")
    
    # 3D Model Asset Upload Storage
    UPLOAD_DIR: Path = BASE_DIR / "uploads" / "companion_models"
    MAX_UPLOAD_SIZE_BYTES: int = 50 * 1024 * 1024  # 50MB
    
    # Sentiment Confidence Calibration
    SENTIMENT_CONFIDENCE_THRESHOLD: float = 0.55
    SENTIMENT_MODEL_VERSION: str = "vcamp-multilingual-v2.0"
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:1420",
        "http://127.0.0.1:1420",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "tauri://localhost",
        "*"
    ]

settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
