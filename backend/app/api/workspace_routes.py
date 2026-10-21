from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import Response

from ..models.workspace import ContentInput, ExternalContentInput, FinalizeInput, GradeInput, ReportInput, VersionInput
from ..services.workspace_service import workspace_service
from ..services.gemini_service import gemini_service
from ..services.llm_service import llm_service
from ..services.presentation_service import PresentationInput, PresentationService

router = APIRouter(prefix="/api/v1", tags=["Teacher Workspace"])


@router.get("/assessment-versions/{content_id}/presentations")
def list_presentations(content_id: str):
    return PresentationService(workspace_service).list_for(content_id)


@router.post("/assessment-versions/{content_id}/presentations")
def generate_presentation(content_id: str, req: PresentationInput):
    return PresentationService(workspace_service).generate(content_id, req)


@router.get("/presentations/{presentation_id}/file")
def download_presentation(presentation_id: str):
    data = PresentationService(workspace_service).download(presentation_id)
    return Response(data, media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
                    headers={"Content-Disposition": 'attachment; filename="SASTRA-materi.pptx"', "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"})


@router.get("/dashboard")
def dashboard():
    return workspace_service.read()


@router.get("/status")
def status():
    return {"provider": llm_service.provider, "clientConfigured": llm_service.is_ready,
            "lastRequestSucceeded": gemini_service.last_request_succeeded if llm_service.provider == "gemini" else None,
            "model": llm_service.model_name, "authMode": gemini_service.mode,
            "project": gemini_service.project_id, "location": gemini_service.location}


@router.post("/assessment-versions/generate")
def generate_content(req: ContentInput):
    return workspace_service.generate_content(req)


@router.post("/assessment-versions/import")
def import_content(req: ExternalContentInput):
    return workspace_service.import_content(req)


@router.post("/assessment-versions/{content_id}/approve")
def approve_content(content_id: str, req: VersionInput):
    return workspace_service.approve_content(content_id, req.expectedVersion)


@router.post("/submissions")
async def upload(file: UploadFile = File(...), studentId: str = Form(...),
                 contentId: str = Form(...), title: str = Form("")):
    # Bound the read before invoking a model. CPU/network work runs in a worker thread.
    from starlette.concurrency import run_in_threadpool
    data = await file.read(10 * 1024 * 1024 + 1)
    await file.close()
    return await run_in_threadpool(workspace_service.upload, studentId, contentId,
                                  file.filename, file.content_type, data)


@router.get("/submissions/{submission_id}/asset")
def asset(submission_id: str):
    mime, data = workspace_service.asset(submission_id)
    return Response(data, media_type=mime, headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"})


@router.post("/submissions/{submission_id}/approve-grade")
def approve_grade(submission_id: str, req: GradeInput):
    return workspace_service.approve_grade(submission_id, req)


@router.post("/reports/generate")
def generate_report(req: ReportInput):
    return workspace_service.generate_report(req.studentId, req.model_dump(exclude={"studentId"}))


@router.post("/report-versions/{report_id}/finalize")
def finalize_report(report_id: str, req: FinalizeInput):
    return workspace_service.finalize_report(report_id, req)
