from fastapi import APIRouter, HTTPException
from ..models.schemas import AssessmentGenerateRequest, AssessmentPackageResponse
from ..agents.assessment_agent import assessment_agent
from ..services.storage_service import storage_service

router = APIRouter(prefix="/assessment", tags=["Assessment Studio"])

@router.post("/generate", response_model=AssessmentPackageResponse)
async def generate_assessment(req: AssessmentGenerateRequest):
    """Menghasilkan modul ajar mendalam, pertanyaan pemantik, kuis PG + Esai, dan LKPD."""
    try:
        package = assessment_agent.generate_assessment(req)
        return package
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_assessments():
    """Mengambil daftar asesmen yang pernah dibuat."""
    return storage_service.get_assessments()
