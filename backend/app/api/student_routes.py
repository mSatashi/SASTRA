from fastapi import APIRouter
from typing import Optional
from pydantic import BaseModel
from ..services.storage_service import storage_service
from ..services.gemini_service import gemini_service
from ..agents.orchestrator import orchestrator

router = APIRouter(prefix="/data", tags=["Data & Dashboard"])

class ApiKeyUpdate(BaseModel):
    api_key: str

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
    """Mengecek status kesiapan Gemini AI."""
    return {
        "gemini_active": bool(gemini_service.client),
        "model_name": gemini_service.model_name
    }
