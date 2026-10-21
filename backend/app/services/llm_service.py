import logging
from typing import Optional, Dict, Any

from ..config import settings
from .gemini_service import gemini_service
from .ollama_service import ollama_service

logger = logging.getLogger(__name__)

SUPPORTED_PROVIDERS = ("gemini", "ollama")


class LLMService:
    """Lapisan perantara agar agent tidak bergantung pada satu penyedia model.

    Provider aktif dipilih lewat LLM_PROVIDER di .env (gemini | ollama) dan dapat
    diganti saat runtime dari UI. Bila provider aktif tidak siap, agent otomatis
    memakai simulator/fallback bawaan seperti sebelumnya.
    """

    def __init__(self):
        provider = (settings.LLM_PROVIDER or "gemini").lower()
        if provider not in SUPPORTED_PROVIDERS:
            logger.warning(f"LLM_PROVIDER '{provider}' tidak dikenal, memakai 'gemini'.")
            provider = "gemini"
        self.provider = provider
        logger.info(f"Provider LLM aktif: {self.provider}")

    @property
    def backend(self):
        return ollama_service if self.provider == "ollama" else gemini_service

    @property
    def is_ready(self) -> bool:
        return self.backend.is_ready

    @property
    def model_name(self) -> str:
        return self.backend.model_name

    def set_provider(self, provider: str) -> None:
        provider = provider.lower().strip()
        if provider not in SUPPORTED_PROVIDERS:
            raise ValueError(f"Provider harus salah satu dari: {', '.join(SUPPORTED_PROVIDERS)}")
        self.provider = provider
        logger.info(f"Provider LLM diganti menjadi: {self.provider}")

    def generate_text(self, prompt: str, system_instruction: Optional[str] = None, json_mode: bool = True) -> str:
        return self.backend.generate_text(prompt, system_instruction=system_instruction, json_mode=json_mode)

    def analyze_image_and_text(
        self,
        image_bytes: bytes,
        prompt: str,
        mime_type: str = "image/jpeg",
        system_instruction: Optional[str] = None,
    ) -> str:
        return self.backend.analyze_image_and_text(
            image_bytes, prompt, mime_type=mime_type, system_instruction=system_instruction
        )

    def status(self) -> Dict[str, Any]:
        return {
            "provider": self.provider,
            "ai_active": self.is_ready,
            "model_name": self.model_name,
            # dipertahankan untuk kompatibilitas frontend lama
            "gemini_active": gemini_service.is_ready,
            "gemini": {"active": gemini_service.is_ready, "model_name": gemini_service.model_name},
            "ollama": ollama_service.status() if self.provider == "ollama" else {
                "base_url": ollama_service.base_url,
                "model_name": ollama_service.model_name,
                "vision_model_name": ollama_service.vision_model_name,
            },
        }


llm_service = LLMService()
