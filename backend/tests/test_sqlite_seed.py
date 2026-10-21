import hashlib
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from backend.app.services.sqlite_seed import restore_seed
from backend.app.services.workspace_service import WorkspaceService


class SQLiteSeedTest(unittest.TestCase):
    def test_verified_seed_restores_data_and_preserves_existing_database(self):
        with tempfile.TemporaryDirectory() as directory:
            source, destination = Path(directory) / "source.db", Path(directory) / "restored.db"
            service = WorkspaceService(source)
            service.mutate(lambda w: w.update(reports=[{"id": "saved-report"}]))
            data = source.read_bytes()
            client = Mock()
            client.return_value.bucket.return_value.blob.return_value.download_as_bytes.return_value = data
            with patch("google.cloud.storage.Client", client):
                restore_seed(destination, "gs://private/backup.db", "123", hashlib.sha256(data).hexdigest(), "project")
                self.assertEqual(WorkspaceService(destination).read(), service.read())
                restore_seed(destination, "gs://private/backup.db", "123", "bad", "project")
            self.assertEqual(client.call_count, 1)

    def test_corrupt_seed_never_creates_empty_database(self):
        with tempfile.TemporaryDirectory() as directory:
            destination = Path(directory) / "restored.db"
            with patch("google.cloud.storage.Client") as client:
                client.return_value.bucket.return_value.blob.return_value.download_as_bytes.return_value = b"corrupt"
                with self.assertRaises(ValueError):
                    restore_seed(destination, "gs://private/backup.db", "123", "0" * 64, "project")
            self.assertFalse(destination.exists())
