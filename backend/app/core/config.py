from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "AIVOA Pharmaceutical Complaint Management System"
    VERSION: str = "1.0.0"
    API_VERSION: str = "v1"
    ENVIRONMENT: str = "development"
    API_V1_STR: str = "/api/v1"
    API_LEGACY_STR: str = "/api"
    
    # AI Engine Configuration
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "gemma2-9b-it"
    GROQ_FALLBACK_MODEL: str = "llama-3.3-70b-versatile"
    
    # AI Feature Flags
    AI_RISK_ASSESSMENT: bool = True
    AI_DUPLICATE_DETECTION: bool = True
    AI_SUMMARY: bool = True
    AI_COMPLETENESS: bool = True
    AI_DOCUMENT_EXTRACTION: bool = True
    AI_HUMAN_APPROVAL: bool = False
    
    # Database Configuration
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/aivoa_complaints"
    SQLITE_FALLBACK_URL: str = "sqlite:///./complaints.db"
    
    # Security & Limits
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".docx", ".txt", ".eml"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
