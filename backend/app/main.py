from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .api.assessment_routes import router as assessment_router
from .api.grading_routes import router as grading_router
from .api.report_routes import router as report_router
from .api.student_routes import router as student_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API untuk SASTRA: Student Assessment, Tracker, and Report Assistance"
)

# Enable CORS for frontend Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

# Cek folder static frontend dist untuk Cloud Run deployment
BASE_DIR = Path(__file__).resolve().parent.parent.parent
dist_dir = BASE_DIR / "frontend" / "dist"

if dist_dir.exists():
    app.mount("/", StaticFiles(directory=str(dist_dir), html=True), name="static")
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

