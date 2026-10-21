"""Offline import into an empty cloud destination. Never exposed as a web route.

Run with ADC and the same cloud environment settings as the backend:
python -m backend.app.migrate_workspace --snapshot-dir /private/backup
The directory contains workspace.json, assets.json and <submission-id>.asset.
"""
import argparse
import hashlib
import json
from pathlib import Path

from .services.workspace_service import workspace_service


def import_backup(store, directory):
    directory = Path(directory).resolve()
    workspace = json.loads((directory / "workspace.json").read_text(encoding="utf-8"))
    manifest = json.loads((directory / "assets.json").read_text(encoding="utf-8"))
    if workspace.get("schema") != 1:
        raise ValueError("Unsupported backup schema")
    assets = []
    for item in manifest:
        asset_path = (directory / (item["id"] + ".asset")).resolve()
        if asset_path.parent != directory:
            raise ValueError("Invalid evidence identifier")
        data = asset_path.read_bytes()
        if hashlib.sha256(data).hexdigest() != item["sha256"]:
            raise ValueError("Backup evidence checksum mismatch")
        assets.append((item["id"], item["mime"], data))
    store.import_snapshot(workspace, assets)
    if store.read() != workspace:
        raise ValueError("Workspace verification failed after import")
    for asset_id, mime, data in assets:
        if store.asset(asset_id) != (mime, data):
            raise ValueError("Evidence verification failed after import")
    return {k: len(workspace[k]) for k in ("contents", "submissions", "reports")}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--snapshot-dir", required=True)
    args = parser.parse_args()
    store = workspace_service.store
    if store is None:
        parser.error("Set SASTRA_STORAGE_BACKEND=cloudsql; refusing to import into local SQLite")
    try:
        print("Imported and verified:", import_backup(store, args.snapshot_dir))
    finally:
        store.close()
