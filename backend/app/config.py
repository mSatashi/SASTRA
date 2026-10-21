import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    PROJECT_NAME: str = "SASTRA API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Gemini & GCP Settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    GEMINI_AUTH_MODE: str = os.getenv("GEMINI_AUTH_MODE", "vertex")
    GCP_PROJECT: str = os.getenv("GCP_PROJECT", os.getenv("GOOGLE_CLOUD_PROJECT", "hackathon-primestep-02"))
    GCP_LOCATION: str = os.getenv("GCP_LOCATION", os.getenv("GOOGLE_CLOUD_LOCATION", "global"))
    GEMINI_TIMEOUT_MS: int = int(os.getenv("GEMINI_TIMEOUT_MS", "120000"))

    # Provider LLM aktif: "gemini" (cloud) atau "ollama" (lokal)
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini")

    # Ollama (LLM lokal)
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "gemma3:4b")
    # Model untuk Vision Grader (harus model multimodal: gemma3, llava, qwen2.5vl, llama3.2-vision)
    OLLAMA_VISION_MODEL: str = os.getenv("OLLAMA_VISION_MODEL", "")
    OLLAMA_TIMEOUT: int = int(os.getenv("OLLAMA_TIMEOUT", "300"))
    OLLAMA_TEMPERATURE: float = float(os.getenv("OLLAMA_TEMPERATURE", "0.4"))
    OLLAMA_NUM_CTX: int = int(os.getenv("OLLAMA_NUM_CTX", "8192"))
    OLLAMA_KEEP_ALIVE: str = os.getenv("OLLAMA_KEEP_ALIVE", "10m")
    
    # Storage Paths
    DATA_DIR: Path = BASE_DIR / "data"
    UPLOAD_DIR: Path = BASE_DIR / "data" / "uploads"
    SAMPLES_DIR: Path = BASE_DIR / "data" / "samples"
    DB_PATH: Path = BASE_DIR / "data" / "sastra.json"
    WORKSPACE_DB: Path = Path(os.getenv("SASTRA_WORKSPACE_DB", str(DATA_DIR / "workspace.sqlite3")))
    
    # Ensure directories exist
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

settings = Settings()
