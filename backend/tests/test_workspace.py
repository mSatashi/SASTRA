"""Contract tests with an explicitly mocked model; never calls or claims to test Vertex IAM."""
import io
import json
import os
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import patch

os.environ.setdefault("NO_GCE_CHECK", "true")

from fastapi.testclient import TestClient
from PIL import Image

from backend.app.main import app
from backend.app.api import workspace_routes
from backend.app.services.workspace_service import WorkspaceService


class ModelStub:
    is_ready = True
    model_name = "contract-test-stub"

    def __init__(self):
        self.report_prompt = ""
        self.raw = None
        self.grades = {"items": [
            {"number": 1, "answer": "A", "feedback": "Tepat.", "score": 25},
            {"number": 2, "answer": "Cahaya membantu fotosintesis.", "feedback": "Jelaskan energi.", "score": 15},
        ]}

    def generate_text(self, prompt, **kwargs):
        if self.raw is not None:
            return self.raw
        if "assessments" in prompt:
            self.report_prompt = prompt
            return json.dumps({"narrative": "Capaian dinilai dari bukti yang disetujui. Perlu latihan penalaran."})
        return json.dumps({"module": "Amati tanaman di tempat terang dan teduh, diskusikan, lalu refleksi.", "answerKey": [
            {"type": "multiple_choice", "question": "Sumber energi fotosintesis?", "options": ["A. Cahaya", "B. Batu", "C. Plastik", "D. Logam"], "correctAnswer": "A", "rubric": "Pilih A.", "max": 25},
            {"type": "essay", "question": "Mengapa cahaya dibutuhkan?", "options": [], "correctAnswer": "Energi untuk fotosintesis.", "rubric": "Jelaskan peran energi.", "max": 25},
        ]})

    def analyze_image_and_text(self, data, prompt, **kwargs):
        self.image_prompt = prompt
        return json.dumps(self.grades)


class WorkspaceContractTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="sastra-contract-")
        self.provider = ModelStub()
        self.service = WorkspaceService(Path(self.temp.name) / "test.sqlite3", self.provider)
        self.patch = patch.object(workspace_routes, "workspace_service", self.service)
        self.patch.start()
        self.client = TestClient(app)
        image = io.BytesIO()
        Image.new("RGB", (20, 20), "white").save(image, format="PNG")
        self.image = image.getvalue()

    def tearDown(self):
        self.client.close()
        self.patch.stop()
        self.temp.cleanup()

    def generate(self):
        response = self.client.post("/api/v1/assessment-versions/generate", json={
            "topic": "Fotosintesis", "objective": "Menjelaskan peran cahaya.", "duration": 40})
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()["contents"][0]

    def content(self):
        c = self.generate()
        response = self.client.post(f'/api/v1/assessment-versions/{c["id"]}/approve', json={"expectedVersion": c["version"]})
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()["contents"][0]

    def upload(self, c=None, **kwargs):
        c = c or self.content()
        return self.client.post("/api/v1/submissions", data={"studentId": "s1", "contentId": c["id"]},
                                files={"file": ("answer.png", kwargs.get("data", self.image), kwargs.get("mime", "image/png"))})

    def submission(self):
        response = self.upload()
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()["submissions"][0]

    def approve(self, s, **kwargs):
        return self.client.post(f'/api/v1/submissions/{s["id"]}/approve-grade', json={
            "expectedVersion": kwargs.get("version", s["version"]), "identityConfirmed": kwargs.get("confirmed", True),
            "gradeItems": kwargs.get("items", s["items"])})

    def report(self):
        response = self.client.post("/api/v1/reports/generate", json={"studentId": "s1"})
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()["reports"][0]

    def test_initial_api_workspace_has_no_fabricated_results(self):
        w = self.client.get("/api/v1/dashboard").json()
        self.assertTrue(w["rosterIsSample"])
        self.assertEqual(len(w["students"]), 8)
        for key in ("submissions", "contents", "reports"):
            self.assertEqual(w[key], [])

    def test_content_approval_is_versioned_and_survives_reopen(self):
        c = self.content()
        self.assertEqual(c["version"], 2)
        reopened = WorkspaceService(self.service.path, self.provider).read()
        self.assertEqual(reopened["contents"][0]["answerKey"][0]["correctAnswer"], "A")
        self.assertEqual(self.client.post(f'/api/v1/assessment-versions/{c["id"]}/approve', json={"expectedVersion": 1}).status_code, 409)

    def test_unavailable_ai_and_invalid_output_do_not_save_fake_results(self):
        self.provider.is_ready = False
        response = self.client.post("/api/v1/assessment-versions/generate", json={"topic": "Air", "objective": "Mengamati", "duration": 40})
        self.assertEqual(response.status_code, 503)
        self.provider.is_ready = True
        self.provider.raw = "not JSON"
        response = self.client.post("/api/v1/assessment-versions/generate", json={"topic": "Air", "objective": "Mengamati", "duration": 40})
        self.assertEqual(response.status_code, 502)
        self.assertEqual(self.service.read()["contents"], [])

    def test_teacher_must_approve_rubric_before_grading(self):
        self.assertEqual(self.upload(self.generate()).status_code, 422)

    def test_validates_file_bytes_before_model_call(self):
        c = self.content()
        with patch.object(self.provider, "analyze_image_and_text", side_effect=AssertionError("Must not call AI")):
            self.assertEqual(self.upload(c, data=b"not PNG").status_code, 422)
            self.assertEqual(self.upload(c, data=b"text", mime="text/plain").status_code, 422)
            self.assertEqual(self.upload(c, data=b"x" * (10 * 1024 * 1024 + 1)).status_code, 422)

    def test_ocr_uses_approved_key_preserves_asset_and_waits_for_teacher(self):
        s = self.submission()
        self.assertIn("Energi untuk fotosintesis", self.provider.image_prompt)
        self.assertEqual(s["status"], "AWAITING_REVIEW")
        self.assertFalse(s["identityConfirmed"])
        response = self.client.get(f'/api/v1/submissions/{s["id"]}/asset')
        self.assertEqual(response.content, self.image)
        self.assertEqual(response.headers["cache-control"], "no-store")
        self.assertEqual(self.client.post("/api/v1/reports/generate", json={"studentId": "s1"}).status_code, 422)

    def test_model_cannot_replace_rubric_maximum_or_missing_question(self):
        c = self.content()
        self.provider.grades["items"][0]["score"] = 999
        self.assertEqual(self.upload(c).status_code, 502)
        self.provider.grades["items"] = self.provider.grades["items"][:1]
        self.assertEqual(self.upload(c).status_code, 502)
        self.assertEqual(self.service.read()["submissions"], [])

    def test_approval_rejects_bad_scores_and_preserves_evidence(self):
        s = self.submission()
        self.assertEqual(self.approve(s, confirmed=False).status_code, 422)
        self.assertEqual(self.approve(s, items=[dict(i, score=999) for i in s["items"]]).status_code, 422)
        response = self.approve(s, items=[dict(i, score=20, max=999, answer="tampered") for i in s["items"]])
        self.assertEqual(response.status_code, 200)
        saved = response.json()["submissions"][0]
        self.assertEqual(saved["items"][0]["answer"], "A")
        self.assertEqual(saved["items"][0]["max"], 25)
        self.assertEqual(saved["items"][0]["score"], 20)
        self.assertEqual(self.approve(s).status_code, 409)

    def test_report_only_sees_approved_scores_and_stales_after_revision(self):
        s = self.submission()
        self.approve(s)
        self.upload(self.service.read()["contents"][0])
        r = self.report()
        self.assertEqual(r["average"], 80)
        self.assertEqual(self.provider.report_prompt.count('"status": "APPROVED"'), 1)
        saved = next(i for i in self.service.read()["submissions"] if i["id"] == s["id"])
        self.approve(saved)
        self.assertEqual(self.service.read()["reports"][0]["status"], "STALE")
        self.assertEqual(self.client.post(f'/api/v1/report-versions/{r["id"]}/finalize', json={"expectedVersion": r["version"], "narrative": "Reviewed"}).status_code, 409)

    def test_final_report_snapshot_and_grade_history_survive_later_revision(self):
        s = self.submission()
        self.approve(s)
        r = self.report()
        response = self.client.post(f'/api/v1/report-versions/{r["id"]}/finalize', json={"expectedVersion": 1, "narrative": "Sudah ditinjau guru."})
        self.assertEqual(response.status_code, 200)
        saved = self.service.read()["submissions"][0]
        self.approve(saved, items=[dict(i, score=10) for i in saved["items"]])
        w = self.service.read()
        self.assertEqual(w["reports"][0]["status"], "FINAL")
        self.assertEqual(w["reports"][0]["snapshot"], r["snapshot"])
        self.assertEqual(w["reports"][0]["average"], 80)
        self.assertEqual(w["submissions"][0]["history"][0]["version"], 2)

    def test_report_generation_rejects_grades_changed_during_model_call(self):
        s = self.submission()
        self.approve(s)
        def changing_model(prompt, **kwargs):
            current = self.service.read()["submissions"][0]
            self.approve(current)
            return json.dumps({"narrative": "Sudah berubah."})
        with patch.object(self.provider, "generate_text", side_effect=changing_model):
            self.assertEqual(self.client.post("/api/v1/reports/generate", json={"studentId": "s1"}).status_code, 409)
        self.assertEqual(self.service.read()["reports"], [])

    def test_spa_and_api_unknown_paths_have_distinct_responses(self):
        self.assertEqual(self.client.get("/api/v1/does-not-exist").status_code, 404)
        self.assertEqual(self.client.get("/healthz").status_code, 200)

    def test_concurrent_teacher_saves_allow_only_one_matching_version(self):
        s = self.submission()
        with ThreadPoolExecutor(max_workers=2) as pool:
            responses = list(pool.map(lambda _: self.approve(s), range(2)))
        self.assertEqual(sorted(r.status_code for r in responses), [200, 409])


if __name__ == "__main__":
    unittest.main()
