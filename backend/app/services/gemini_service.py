"""Google Gen AI client shared by the existing agents and teacher workspace."""
import logging
from typing import Optional

from ..config import settings

logger = logging.getLogger(__name__)


class AIServiceError(RuntimeError):
    def __init__(self, message: str, status_code: int = 503):
        super().__init__(message)
        self.status_code = status_code


class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self.project_id = settings.GCP_PROJECT
        self.location = settings.GCP_LOCATION
        self.auth_mode = settings.GEMINI_AUTH_MODE
        self.mode = "unavailable"
        self.client = None
        self.last_error = ""
        self.last_request_succeeded = False
        self._initialize_client()

    def _initialize_client(self):
        if self.client:
            self.client.close()
        self.client = None
        self.mode = "unavailable"
        self.last_request_succeeded = False
        try:
            from google import genai
            from google.genai import types

            options = types.HttpOptions(api_version="v1", timeout=settings.GEMINI_TIMEOUT_MS)
            if self.auth_mode == "vertex":
                import google.auth
                credentials, _ = google.auth.default(
                    scopes=["https://www.googleapis.com/auth/cloud-platform"]
                )
                self.client = genai.Client(
                    vertexai=True, project=self.project_id, location=self.location,
                    credentials=credentials, http_options=options,
                )
                self.mode = "vertex"
            elif self.auth_mode == "api_key" and self.api_key:
                self.client = genai.Client(
                    vertexai=False, api_key=self.api_key, http_options=options,
                )
                self.mode = "api_key"
            else:
                raise ValueError("Invalid authentication mode or missing key")
            self.last_error = ""
        except Exception as exc:
            logger.warning("Gemini initialization unavailable (%s)", type(exc).__name__)
            self.last_error = (
                "Autentikasi Gemini belum siap. Untuk Vertex, siapkan ADC pada mesin "
                "backend atau gunakan service account Cloud Run yang memiliki akses model."
            )

    def update_api_key(self, api_key: str):
        # Explicit legacy setting; never silently switch away from Vertex after an error.
        self.api_key = api_key.strip()
        self.auth_mode = "api_key" if self.api_key else "vertex"
        self._initialize_client()
        return self.is_ready

    @property
    def is_ready(self) -> bool:
        # A configured client is not proof of a successful model request.
        return self.client is not None

    def _generate(self, contents, system_instruction, json_mode, response_schema=None):
        if not self.client:
            self._initialize_client()
        if not self.client:
            raise AIServiceError(self.last_error)
        from google.genai import types

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json" if json_mode else "text/plain",
                    response_json_schema=response_schema,
                    max_output_tokens=8192,
                ),
            )
            text = response.text
            if not text or not text.strip():
                raise AIServiceError("Model tidak mengembalikan jawaban. Coba ulangi.", 502)
            self.last_request_succeeded = True
            self.last_error = ""
            return text
        except AIServiceError:
            self.last_request_succeeded = False
            raise
        except Exception as exc:
            self.last_request_succeeded = False
            code = getattr(exc, "code", None)
            status = 429 if code == 429 else 503 if code in (401, 403) else 502
            self.last_error = (
                f"Panggilan Gemini gagal (kode {code or 'transport'}). "
                "Periksa ADC/service account, akses model, kuota, dan lokasi backend."
            )
            logger.warning("Gemini request failed (%s, code=%s)", type(exc).__name__, code)
            raise AIServiceError(self.last_error, status) from exc

    def generate_text(self, prompt: str, system_instruction: Optional[str] = None,
                      json_mode: bool = True, response_schema=None) -> str:
        return self._generate(prompt, system_instruction, json_mode, response_schema)

    def analyze_image_and_text(self, image_bytes: bytes, prompt: str,
                               mime_type: str = "image/jpeg",
                               system_instruction: Optional[str] = None, response_schema=None) -> str:
        from google.genai import types
        return self._generate(
            [types.Part.from_bytes(data=image_bytes, mime_type=mime_type), prompt],
            system_instruction, True, response_schema,
        )


gemini_service = GeminiService()
