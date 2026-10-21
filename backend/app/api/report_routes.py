from fastapi import APIRouter, HTTPException
from ..models.schemas import SemesterReportRequest, SemesterReportResponse
from ..agents.report_agent import academic_report_agent
from ..services.storage_service import storage_service

router = APIRouter(prefix="/report", tags=["Semester Report & Tracker"])

@router.post("/generate", response_model=SemesterReportResponse)
async def generate_semester_report(req: SemesterReportRequest):
    """Menyusun narasi rapor akhir semester berdasarkan data capaian akumulatif siswa."""
    try:
        report = academic_report_agent.generate_semester_report(req)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_reports():
    """Mengambil arsip laporan rapor semester yang telah disusun."""
    return storage_service.get_reports()
