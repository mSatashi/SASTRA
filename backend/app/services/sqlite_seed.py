"""Optional, pinned private backup used only when a new instance has no SQLite file."""
import hashlib
import json
import os
import sqlite3
import tempfile
import threading
from contextlib import closing
from pathlib import Path

_lock = threading.Lock()


def restore_seed(path, uri, generation, checksum, project):
    with _lock:
        if path.exists():
            return
        if not uri.startswith("gs://") or not generation or len(checksum) != 64:
            raise ValueError("SQLite seed requires a private GCS URI, generation and SHA-256")
        from google.cloud import storage
        bucket, object_name = uri[5:].split("/", 1)
        data = storage.Client(project=project).bucket(bucket).blob(object_name, generation=int(generation)).download_as_bytes(if_generation_match=int(generation), timeout=60)
        if hashlib.sha256(data).hexdigest() != checksum:
            raise ValueError("SQLite backup checksum mismatch")
        path.parent.mkdir(parents=True, exist_ok=True)
        handle, filename = tempfile.mkstemp(prefix=".sqlite-seed-", dir=path.parent)
        try:
            with os.fdopen(handle, "wb") as stream:
                stream.write(data)
            with closing(sqlite3.connect(filename)) as db:
                if db.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                    raise ValueError("SQLite backup integrity check failed")
                row = db.execute("SELECT data FROM workspace WHERE id=1").fetchone()
                if row is None or json.loads(row[0]).get("schema") != 1:
                    raise ValueError("Unsupported SQLite backup")
                db.execute("SELECT id,mime,data FROM assets LIMIT 0")
            os.replace(filename, path)
        finally:
            Path(filename).unlink(missing_ok=True)
