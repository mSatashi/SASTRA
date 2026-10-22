"""Offline protocol fixture process. Never used by the shipped server entry point."""
import os
import sys
from pathlib import Path

os.environ["NO_GCE_CHECK"] = "true"

from backend.app.services.workspace_service import WorkspaceService
from backend.mcp_sastra.server import create_server
from backend.mcp_sastra.tests.test_protocol import ModelDouble


if __name__ == "__main__":
    # Explicit temporary DB supplied by the test; this module is not a user demo.
    create_server(WorkspaceService(Path(sys.argv[1]), ModelDouble())).run(transport="stdio")
