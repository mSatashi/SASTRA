"""Opt-in real PostgreSQL/GCS integration test; dedicated *_test database only.

Set SASTRA_CLOUD_TEST_DATABASE plus GCP_SQL_* / GCP_ASSET_BUCKET and ADC.
Default unit-test runs skip this file. Each run uses its own object prefix.
"""
import copy
import os
import unittest
import uuid
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch


@unittest.skipUnless(os.getenv("SASTRA_CLOUD_TEST_DATABASE"), "Requires dedicated cloud test database")
class CloudPersistenceTest(unittest.TestCase):
    def test_transactions_evidence_and_reopen(self):
        from backend.app.services.cloud_workspace_store import CloudWorkspaceStore
        from backend.app.services.workspace_service import seed_workspace
        database = os.environ["SASTRA_CLOUD_TEST_DATABASE"]
        self.assertTrue(database.endswith("_test"), "Never run against application database")
        prefix = "validation/" + uuid.uuid4().hex
        kwargs = dict(instance=os.environ["GCP_SQL_INSTANCE"], database=database,
            user=os.environ["GCP_SQL_USER"], password=os.environ["GCP_SQL_PASSWORD"],
            bucket=os.environ["GCP_ASSET_BUCKET"], project=os.environ.get("GCP_PROJECT"),
            object_prefix=prefix, seed=seed_workspace)
        store = CloudWorkspaceStore(**kwargs)
        try:
            baseline = store.read()
            def increment(w):
                w["counter"] = w.get("counter", 0) + 1
            with ThreadPoolExecutor(max_workers=3) as pool:
                list(pool.map(lambda _: store.mutate(increment), range(6)))
            self.assertEqual(store.read().get("counter"), baseline.get("counter", 0) + 6)
            before = copy.deepcopy(store.read())
            def fail(w):
                w["reports"] = [{"bad": True}]
                raise ValueError("Rejected teacher write")
            with self.assertRaises(ValueError):
                store.mutate(fail)
            self.assertEqual(store.read(), before)
            with patch.object(store.bucket, "blob", side_effect=RuntimeError("GCS unavailable")):
                with self.assertRaises(RuntimeError):
                    store.mutate(increment, asset=(uuid.uuid4().hex, "image/png", b"test"))
            self.assertEqual(store.read(), before)
            asset_id = uuid.uuid4().hex
            store.mutate(increment, asset=(asset_id, "image/png", b"exact test evidence"))
            after = store.read()
            store.close()
            store = CloudWorkspaceStore(**kwargs)
            self.assertEqual(store.read(), after)
            self.assertEqual(store.asset(asset_id), ("image/png", b"exact test evidence"))
        finally:
            # Test evidence is private and retained for diagnostics, isolated by prefix.
            store.close()
