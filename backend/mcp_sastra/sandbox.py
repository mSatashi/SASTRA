"""MCP's workspace lives in this checkout, independent of web/Cloud Run data."""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def database_path() -> Path:
    if os.getenv("K_SERVICE"):
        raise RuntimeError("This MCP entry point is local-only; Cloud Run execution is disabled.")
    path = (ROOT / "backend/data/mcp/workspace.sqlite3").resolve()
    if not path.is_relative_to(ROOT) or path.is_relative_to((ROOT / "backend/app").resolve()):
        raise RuntimeError("MCP data path must remain inside its isolated checkout.")
    # Do not allow a symlink/junction to route sandbox writes into the web database.
    expected_parent = ROOT / "backend/data/mcp"
    if expected_parent.resolve() != expected_parent or path != expected_parent / "workspace.sqlite3":
        raise RuntimeError("MCP data path cannot contain symlinks or junctions.")
    return path


def workspace():
    path = database_path()
    from backend.app.services.workspace_service import WorkspaceService
    return WorkspaceService(path=path)
