from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .api.assessment_routes import router as assessment_router
from .api.grading_routes import router as grading_router
from .api.report_routes import router as report_router
from .api.student_routes import router as student_router
from .api.workspace_routes import router as workspace_router
from .services.gemini_service import AIServiceError
from .services.workspace_service import WorkspaceError
from fastapi.responses import JSONResponse, FileResponse

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API untuk SASTRA: Student Assessment, Tracker, and Report Assistance"
)

# Enable CORS for frontend Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000", "http://localhost:3000", "http://127.0.0.1:3001", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from pathlib import Path
from fastapi.staticfiles import StaticFiles

# Register routers
app.include_router(assessment_router, prefix=settings.API_PREFIX)
app.include_router(grading_router, prefix=settings.API_PREFIX)
app.include_router(report_router, prefix=settings.API_PREFIX)
app.include_router(student_router, prefix=settings.API_PREFIX)
app.include_router(workspace_router)


@app.exception_handler(AIServiceError)
@app.exception_handler(WorkspaceError)
async def workflow_error(request, exc):
    return JSONResponse(status_code=exc.status_code, content={"detail": str(exc)})


@app.get("/healthz")
def health():
    return {"status": "ok"}

# Cek folder static frontend dist untuk Cloud Run deployment
BASE_DIR = Path(__file__).resolve().parent.parent.parent
dist_dir = BASE_DIR / "frontend" / "dist"

if dist_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(dist_dir / "assets")), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def frontend(path: str):
        # Unknown API paths must return JSON errors rather than the SPA's HTML.
        if path == "api" or path.startswith("api/"):
            return JSONResponse(status_code=404, content={"detail": "API route not found"})
        candidate = (dist_dir / path).resolve()
        if candidate.is_relative_to(dist_dir.resolve()) and candidate.is_file():
            return FileResponse(candidate, headers={"Cache-Control": "no-store"})
        return FileResponse(dist_dir / "index.html", headers={"Cache-Control": "no-store"})
else:
    @app.get("/")
    def root():
        return {
            "app": "SASTRA API",
            "description": "Staf Asisten Guru Berbasis Agentic AI (Permendikdasmen No. 13 Tahun 2025)",
            "version": settings.VERSION,
            "docs_url": "/docs"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

