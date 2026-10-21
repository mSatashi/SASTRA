"""Durable workspace transactions in PostgreSQL; immutable evidence in private GCS.

The JSONB workspace preserves the existing API contract. A row lock serializes
teacher updates across Cloud Run instances; model calls stay outside that lock.
"""
import hashlib
import json
import threading

from google.cloud import storage
from google.cloud.sql.connector import Connector
from sqlalchemy import create_engine, text



class CloudWorkspaceStore:
    def __init__(self, *, instance, database, user, password, bucket, seed,
                 project=None, credentials=None, object_prefix="answers"):
        if not all((instance, database, user, password, bucket)):
            raise ValueError("Cloud storage requires SQL instance/database/user/password and an asset bucket")
        self.connector = Connector(credentials=credentials, refresh_strategy="LAZY")
        self.engine = create_engine(
            "postgresql+pg8000://",
            creator=lambda: self.connector.connect(instance, "pg8000", user=user,
                password=password, db=database, timeout=30),
            pool_size=2, max_overflow=1, pool_timeout=30, pool_recycle=1800, pool_pre_ping=True,
        )
        self.bucket = storage.Client(project=project, credentials=credentials).bucket(bucket)
        self.seed = seed
        self.prefix = object_prefix
        self._initialized = False
        self._init_lock = threading.Lock()

    def _initialize(self):
        with self._init_lock:
            if self._initialized:
                return
            with self.engine.begin() as db:
                # Concurrent first starts serialize the schema bootstrap too.
                db.execute(text("SELECT pg_advisory_xact_lock(73627301)"))
                db.execute(text("CREATE TABLE IF NOT EXISTS workspace (id INTEGER PRIMARY KEY CHECK(id=1), data JSONB NOT NULL)"))
                db.execute(text("CREATE TABLE IF NOT EXISTS assets (id TEXT PRIMARY KEY, mime TEXT NOT NULL, object_name TEXT NOT NULL, generation BIGINT NOT NULL, sha256 TEXT NOT NULL)"))
                db.execute(text("INSERT INTO workspace VALUES (1, CAST(:data AS JSONB)) ON CONFLICT (id) DO NOTHING"), {"data": json.dumps(self.seed())})
            self._initialized = True

    def read(self):
        self._initialize()
        with self.engine.connect() as db:
            return db.execute(text("SELECT data FROM workspace WHERE id=1")).scalar_one()

    def _put_asset(self, asset):
        asset_id, mime, data = asset
        blob = self.bucket.blob(f"{self.prefix}/{asset_id}")
        blob.upload_from_string(data, content_type=mime, if_generation_match=0, timeout=60)
        return {"id": asset_id, "mime": mime, "object_name": blob.name,
                "generation": int(blob.generation), "sha256": hashlib.sha256(data).hexdigest()}

    def mutate(self, change, asset=None):
        self._initialize()
        metadata = self._put_asset(asset) if asset else None
        # An object may be orphaned on a failed transaction; never delete it here.
        # A lost connection during COMMIT can mean PostgreSQL committed successfully.
        with self.engine.begin() as db:
            w = db.execute(text("SELECT data FROM workspace WHERE id=1 FOR UPDATE")).scalar_one()
            change(w)
            if metadata:
                db.execute(text("INSERT INTO assets (id,mime,object_name,generation,sha256) VALUES (:id,:mime,:object_name,:generation,:sha256)"), metadata)
            db.execute(text("UPDATE workspace SET data=CAST(:data AS JSONB) WHERE id=1"), {"data": json.dumps(w, ensure_ascii=False)})
        return w

    def asset(self, asset_id):
        self._initialize()
        with self.engine.connect() as db:
            row = db.execute(text("SELECT mime,object_name,generation,sha256 FROM assets WHERE id=:id"), {"id": asset_id}).mappings().first()
        if not row:
            return None
        blob = self.bucket.blob(row["object_name"], generation=row["generation"])
        data = blob.download_as_bytes(if_generation_match=row["generation"], timeout=60)
        if hashlib.sha256(data).hexdigest() != row["sha256"]:
            raise ValueError("Stored evidence checksum mismatch")
        return row["mime"], data

    def import_snapshot(self, workspace, assets):
        """Offline migration only: refuses to replace existing application data."""
        self._initialize()
        existing = self.read()
        if any(existing.get(k) for k in ("contents", "submissions", "reports", "activities")):
            raise ValueError("Destination contains data; import aborted")
        if {a[0] for a in assets} != {s["id"] for s in workspace["submissions"]}:
            raise ValueError("Migration requires evidence for every submission")
        metadata = [self._put_asset(a) for a in assets]
        with self.engine.begin() as db:
            existing = db.execute(text("SELECT data FROM workspace WHERE id=1 FOR UPDATE")).scalar_one()
            if any(existing.get(k) for k in ("contents", "submissions", "reports", "activities")):
                raise ValueError("Destination contains data; import aborted")
            for item in metadata:
                db.execute(text("INSERT INTO assets (id,mime,object_name,generation,sha256) VALUES (:id,:mime,:object_name,:generation,:sha256)"), item)
            db.execute(text("UPDATE workspace SET data=CAST(:data AS JSONB) WHERE id=1"), {"data": json.dumps(workspace, ensure_ascii=False)})

    def close(self):
        self.engine.dispose()
        self.connector.close()
