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
        self.client = None
        
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.client = genai.GenerativeModel(model_name=self.model_name)
                logger.info(f"Gemini API berhasil diinisialisasi dengan model: {self.model_name}")
            except Exception as e:
                logger.warning(f"Gagal menginisialisasi Gemini client: {e}. Mengaktifkan mode simulator cerdas.")
                self.client = None
        else:
            logger.info("GEMINI_API_KEY belum disetel. Mengaktifkan mode demonstrasi cerdas bawaan.")

    def update_api_key(self, api_key: str):
        """Memperbarui API Key secara realtime dari frontend settings."""
        self.api_key = api_key.strip()
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.client = genai.GenerativeModel(model_name=self.model_name)
                return True
            except Exception as e:
                logger.error(f"Error update API key: {e}")
                return False
        self.client = None
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
                logger.error(f"Error pada Gemini generate_text: {e}")
        return ""

    def analyze_image_and_text(self, image_bytes: bytes, prompt: str, mime_type: str = "image/jpeg") -> str:
        if self.client:
            try:
                import google.generativeai as genai
                image_part = {
                    "mime_type": mime_type,
                    "data": image_bytes
                }
                response = self.client.generate_content([prompt, image_part])
                return response.text
            except Exception as e:
                logger.error(f"Error pada Gemini Vision analyze: {e}")
        return ""

gemini_service = GeminiService()
