"""Local MCP wrapper around the shared web presentation design engine."""
from backend.app.services.presentation_designer import DesignPlan, DesignSlide, DesignItem
from backend.app.services.presentation_designer import DesignerService as SharedDesignerService
from backend.app.services.presentation_designer import run_renderer, normalize_package
from .sandbox import database_path


class DesignerService(SharedDesignerService):
    def design(self, *args, **kwargs):
        database_path()
        return super().design(*args, **kwargs)

    def preview(self, *args, **kwargs):
        database_path()
        return super().preview(*args, **kwargs)
