from fastapi import APIRouter, HTTPException
from typing import Optional
from pydantic import BaseModel
from ..services.storage_service import storage_service
from ..services.gemini_service import gemini_service
from ..services.ollama_service import ollama_service
from ..services.llm_service import llm_service
from ..agents.orchestrator import orchestrator

router = APIRouter(prefix="/data", tags=["Data & Dashboard"])

class ApiKeyUpdate(BaseModel):
    api_key: str

class LLMConfigUpdate(BaseModel):
    provider: str  # "gemini" | "ollama"
    ollama_base_url: Optional[str] = None
    ollama_model: Optional[str] = None
    ollama_vision_model: Optional[str] = None

@router.get("/summary")
async def get_dashboard_summary():
    """Mengambil metrik ringkasan dashboard untuk guru."""
    return orchestrator.get_dashboard_summary()

@router.get("/classes")
async def get_classes():
    """Mengambil daftar kelas."""
    return storage_service.get_classes()

@router.get("/students")
async def get_students(class_id: Optional[str] = None):
    """Mengambil daftar siswa beserta rekap nilai harian/formatif/sumatif."""
    return storage_service.get_students(class_id=class_id)

@router.post("/update-key")
async def update_gemini_key(payload: ApiKeyUpdate):
    """Memperbarui Gemini API Key secara runtime dari UI Guru."""
    success = gemini_service.update_api_key(payload.api_key)
    return {"status": "success" if success else "error", "has_key": bool(gemini_service.client)}

@router.get("/status")
async def get_ai_status():
    """Mengecek status kesiapan provider AI aktif (Gemini / Ollama)."""
    return llm_service.status()

@router.post("/llm-config")
async def update_llm_config(payload: LLMConfigUpdate):
    """Mengganti provider LLM dan konfigurasi Ollama secara runtime dari UI Guru."""
    try:
        llm_service.set_provider(payload.provider)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if llm_service.provider == "ollama":
        ollama_service.configure(
            base_url=payload.ollama_base_url,
            model=payload.ollama_model,
            vision_model=payload.ollama_vision_model,
        )

    status = llm_service.status()
    return {"status": "success" if status["ai_active"] else "warning", **status}

@router.get("/ollama/models")
async def list_ollama_models(base_url: Optional[str] = None):
    """Daftar model yang sudah di-pull di server Ollama."""
    if base_url:
        ollama_service.configure(base_url=base_url)
    models = ollama_service.list_models()
    return {
        "reachable": ollama_service.status()["reachable"],
        "base_url": ollama_service.base_url,
        "models": models,
        "error": ollama_service.last_error,
    }
