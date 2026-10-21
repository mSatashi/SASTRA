import os
os.environ.setdefault("NO_GCE_CHECK", "true")

import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.config import settings
from backend.app.api import web_access


class PublicWebAccessTest(unittest.TestCase):
    def setUp(self):
        self.mode = patch.object(settings, "WEB_PUBLIC_MODE", True)
        self.secret = patch.object(settings, "WEB_ACCESS_CODE", "test-only-access-code-32-characters")
        self.mode.start()
        self.secret.start()
        web_access._failures.clear()
        self.client = TestClient(app, base_url="https://sastra.test")

    def tearDown(self):
        self.client.close()
        self.secret.stop()
        self.mode.stop()
        web_access._failures.clear()

    def login(self):
        return self.client.post("/api/v1/session/login", json={"code": settings.WEB_ACCESS_CODE}, headers={"Origin": "https://sastra.test"})

    def test_anonymous_api_is_blocked_and_session_does_not_reveal_secret(self):
        self.assertEqual(self.client.get("/api/v1/dashboard").status_code, 401)
        self.assertEqual(self.client.get("/api/v1/status").status_code, 401)
        session = self.client.get("/api/v1/session")
        self.assertEqual(session.json(), {"required": True, "authenticated": False})
        self.assertNotIn(settings.WEB_ACCESS_CODE, session.text)

    def test_login_issues_secure_cookie_and_enables_api(self):
        response = self.login()
        self.assertEqual(response.status_code, 200)
        cookie = response.headers["set-cookie"]
        for flag in ("Secure", "HttpOnly", "SameSite=strict", "Path=/", "__Host-sastra_session"):
            self.assertIn(flag, cookie)
        self.assertTrue(self.client.get("/api/v1/session").json()["authenticated"])
        self.assertEqual(self.client.get("/api/v1/dashboard").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/status").status_code, 200)

    def test_bad_code_and_tampered_cookie_cannot_access_api(self):
        self.assertEqual(self.client.post("/api/v1/session/login", json={"code": "wrong"}).status_code, 401)
        self.login()
        self.assertEqual(self.client.get("/api/v1/dashboard", headers={"Cookie": f"{web_access.COOKIE}=9999999999.fake.fakesignature"}).status_code, 401)

    def test_legacy_configuration_and_docs_are_not_public_even_after_login(self):
        self.login()
        for path in ("/docs", "/redoc", "/openapi.json", "/api/data/status", "/api/data/llm-config"):
            self.assertEqual(self.client.get(path).status_code, 404)

    def test_cross_origin_login_and_writes_are_rejected(self):
        response = self.client.post("/api/v1/session/login", json={"code": settings.WEB_ACCESS_CODE}, headers={"Origin": "https://other.test"})
        self.assertEqual(response.status_code, 403)
        self.login()
        self.assertEqual(self.client.post("/api/v1/reports/generate", json={"studentId": "s1"}, headers={"Origin": "https://other.test"}).status_code, 403)

    def test_logout_clears_access_and_missing_deployment_secret_fails_closed(self):
        self.login()
        self.client.post("/api/v1/session/logout")
        self.assertEqual(self.client.get("/api/v1/dashboard").status_code, 401)
        with patch.object(settings, "WEB_ACCESS_CODE", ""):
            self.assertEqual(self.client.get("/").status_code, 503)

    def test_failed_login_attempts_are_rate_limited(self):
        for _ in range(30):
            self.assertEqual(self.client.post("/api/v1/session/login", json={"code": "wrong"}).status_code, 401)
        self.assertEqual(self.login().status_code, 429)


if __name__ == "__main__":
    unittest.main()
