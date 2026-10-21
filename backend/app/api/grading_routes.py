import json
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from ..models.schemas import VisionGradingResponse
from ..agents.vision_grader_agent import vision_grader_agent
from ..services.storage_service import storage_service

router = APIRouter(prefix="/grading", tags=["Vision OCR Grader"])

@router.post("/evaluate", response_model=VisionGradingResponse)
async def evaluate_submission(
    file: Optional[UploadFile] = File(None),
    student_id: Optional[str] = Form(None),
    student_name: str = Form("Ahmad Fauzi"),
    assignment_title: str = Form("Asesmen Formatif: Logika Komputasional"),
    subject: str = Form("Informatika"),
    answer_key_json: Optional[str] = Form(None)
):
    """Mengevaluasi lembar jawaban siswa dari upload foto/PDF dengan OCR dan rubrik penalaran."""
    try:
        image_bytes = b""
        mime_type = "image/jpeg"
        if file:
            image_bytes = await file.read()
            mime_type = file.content_type or "image/jpeg"

        custom_key = None
        if answer_key_json:
            try:
                custom_key = json.loads(answer_key_json)
            except Exception:
                pass

        result = vision_grader_agent.grade_submission(
            image_bytes=image_bytes,
            student_id=student_id,
            student_name=student_name,
            assignment_title=assignment_title,
            subject=subject,
            mime_type=mime_type,
            custom_answer_key=custom_key
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_gradings():
    """Mengambil riwayat koreksi lembar jawaban."""
    return storage_service.get_gradings()
