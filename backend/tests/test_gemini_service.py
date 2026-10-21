"""Real SDK serialization over a mocked HTTP transport; no Google network requests."""
import base64
import json
import os
import unittest
from unittest.mock import patch

os.environ.setdefault("NO_GCE_CHECK", "true")

import httpx
from google import genai
from google.oauth2.credentials import Credentials
from google.auth.exceptions import DefaultCredentialsError
from backend.app.services.gemini_service import AIServiceError, GeminiService


class GeminiSDKTest(unittest.TestCase):
    def setUp(self):
        self.requests = []
        self.code = 200
        def respond(request):
            self.requests.append(request)
            if self.code != 200:
                return httpx.Response(self.code, json={"error": {"code": self.code, "message": "private diagnostic", "status": "PERMISSION_DENIED"}})
            return httpx.Response(200, json={"candidates": [{"content": {"role": "model", "parts": [{"text": '{"answer":"ok"}'}]}, "finishReason": "STOP"}]})
        original_client = genai.Client
        def client(**kwargs):
            kwargs["http_options"] = kwargs["http_options"].model_copy(update={"client_args": {"transport": httpx.MockTransport(respond)}})
            return original_client(**kwargs)
        self.auth = patch("google.auth.default", return_value=(Credentials(token="mock-transport-only"), "hackathon-primestep-02"))
        self.sdk = patch("google.genai.Client", side_effect=client)
        self.auth.start()
        self.sdk.start()
        self.service = GeminiService()
        self.assertEqual(self.service.mode, "vertex")

    def tearDown(self):
        if self.service.client:
            self.service.client.close()
        self.sdk.stop()
        self.auth.stop()

    def test_uses_global_vertex_project_and_json_system_instruction(self):
        self.assertEqual(self.service.generate_text("test", system_instruction="Be precise"), '{"answer":"ok"}')
        request = self.requests[-1]
        self.assertIn("/v1/projects/hackathon-primestep-02/locations/global/publishers/google/models/gemini-3.8-flash:generateContent", str(request.url))
        payload = json.loads(request.content)
        self.assertEqual(payload["generationConfig"]["responseMimeType"], "application/json")
        self.assertIn("Be precise", str(payload["systemInstruction"]))
        self.assertTrue(self.service.last_request_succeeded)

    def test_serializes_image_and_pdf_as_inline_data(self):
        for mime in ("image/png", "application/pdf"):
            self.service.analyze_image_and_text(b"synthetic file", "Grade", mime_type=mime)
            payload = json.loads(self.requests[-1].content)
            data = payload["contents"][0]["parts"][0]["inlineData"]
            self.assertEqual(data.get("mimeType", data.get("mime_type")), mime)
            self.assertEqual(base64.b64decode(data["data"]), b"synthetic file")

    def test_permission_failure_returns_actionable_error_without_fallback(self):
        self.code = 403
        with self.assertRaises(AIServiceError) as failure:
            self.service.generate_text("test")
        self.assertEqual(failure.exception.status_code, 503)
        self.assertNotIn("private diagnostic", str(failure.exception))
        self.assertFalse(self.service.last_request_succeeded)

    def test_missing_adc_does_not_implicitly_use_a_developer_api_key(self):
        self.service.api_key = "unused-test-value"
        with patch("google.auth.default", side_effect=DefaultCredentialsError("missing")):
            self.service._initialize_client()
        self.assertIsNone(self.service.client)
        self.assertEqual(self.service.mode, "unavailable")


if __name__ == "__main__":
    unittest.main()
