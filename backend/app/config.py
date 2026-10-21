import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    PROJECT_NAME: str = "SASTRA API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Gemini API Key
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    
    # Storage Paths
    DATA_DIR: Path = BASE_DIR / "data"
    UPLOAD_DIR: Path = BASE_DIR / "data" / "uploads"
    SAMPLES_DIR: Path = BASE_DIR / "data" / "samples"
    DB_PATH: Path = BASE_DIR / "data" / "sastra.json"
    
    # Ensure directories exist
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

settings = Settings()
