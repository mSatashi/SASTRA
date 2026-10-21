import os
import json
import base64
import logging
from typing import Dict, Any, Optional
from ..config import settings

logger = logging.getLogger(__name__)

import os
import json
import base64
import logging
from typing import Dict, Any, Optional
from ..config import settings

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
        self.model_name = settings.GEMINI_MODEL
        self.project_id = settings.GCP_PROJECT
        self.location = settings.GCP_LOCATION
        self.mode = None  # "vertex", "api_key", or "simulator"
        self.client = None

        self._initialize_client()

    def _initialize_client(self):
        """Inisialisasi client: mengutamakan Vertex AI (ADC), lalu API key, atau simulator."""
        # 1. Coba inisialisasi Vertex AI via ADC (Default GCP / Cloud Run)
        try:
            import vertexai
            from vertexai.generative_models import GenerativeModel
            
            vertexai.init(project=self.project_id, location=self.location)
            self.client = GenerativeModel(self.model_name)
            self.mode = "vertex"
            logger.info(f"Gemini berhasil diinisialisasi via Vertex AI (ADC) [Project: {self.project_id}, Region: {self.location}, Model: {self.model_name}]")
            return
        except Exception as vertex_err:
            logger.info(f"Vertex AI via ADC belum aktif atau gagal diinisialisasi: {vertex_err}")

        # 2. Coba pakai API Key jika tersedia
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.client = genai.GenerativeModel(model_name=self.model_name)
                self.mode = "api_key"
                logger.info(f"Gemini API berhasil diinisialisasi dengan API Key [Model: {self.model_name}]")
                return
            except Exception as api_err:
                logger.warning(f"Gagal menginisialisasi Gemini API Key: {api_err}")

        # 3. Fallback: Simulator mode
        self.client = None
        self.mode = "simulator"
        logger.info("Mengaktifkan mode demonstrasi cerdas bawaan (simulator).")

    def update_api_key(self, api_key: str):
        """Memperbarui API Key secara realtime dari frontend settings."""
        self.api_key = api_key.strip()
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.client = genai.GenerativeModel(model_name=self.model_name)
                self.mode = "api_key"
                return True
            except Exception as e:
                logger.error(f"Error update API key: {e}")
                return False
        # Kembalikan ke re-init (akan coba Vertex AI kembali)
        self._initialize_client()
        return True

    def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        if self.client:
            try:
                full_prompt = prompt
                if system_instruction:
                    full_prompt = f"System Instruction:\n{system_instruction}\n\nUser Request:\n{prompt}"
                
                response = self.client.generate_content(full_prompt)
                return response.text
            except Exception as e:
                logger.error(f"Error pada Gemini generate_text ({self.mode}): {e}")
        return ""

    def analyze_image_and_text(self, image_bytes: bytes, prompt: str, mime_type: str = "image/jpeg") -> str:
        if self.client:
            try:
                if self.mode == "vertex":
                    from vertexai.generative_models import Part
                    image_part = Part.from_data(data=image_bytes, mime_type=mime_type)
                    response = self.client.generate_content([image_part, prompt])
                    return response.text
                elif self.mode == "api_key":
                    image_part = {
                        "mime_type": mime_type,
                        "data": image_bytes
                    }
                    response = self.client.generate_content([prompt, image_part])
                    return response.text
            except Exception as e:
                logger.error(f"Error pada Gemini Vision analyze ({self.mode}): {e}")
        return ""

gemini_service = GeminiService()
