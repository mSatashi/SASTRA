import re
import time
import base64
import logging
from typing import Optional, List, Dict, Any

import requests

from ..config import settings

logger = logging.getLogger(__name__)

# Model reasoning (qwen3, deepseek-r1, dll.) kadang menyertakan blok <think>...</think>
_THINK_BLOCK = re.compile(r"<think>.*?</think>", re.DOTALL | re.IGNORECASE)


class OllamaService:
    """Klien REST untuk server Ollama lokal (https://ollama.com).

    Menggunakan endpoint /api/chat agar system prompt dan gambar (model vision
    seperti gemma3, llava, qwen2.5vl) dapat dikirim dalam satu format yang sama.
    """

    HEALTH_TTL_SECONDS = 15

    def __init__(self):
        self.base_url: str = settings.OLLAMA_BASE_URL
        self.model_name: str = settings.OLLAMA_MODEL
        self.vision_model_name: str = settings.OLLAMA_VISION_MODEL or settings.OLLAMA_MODEL
        self.timeout: int = settings.OLLAMA_TIMEOUT
        self.temperature: float = settings.OLLAMA_TEMPERATURE
        self.num_ctx: int = settings.OLLAMA_NUM_CTX
        self.keep_alive: str = settings.OLLAMA_KEEP_ALIVE

        self._last_check: float = 0.0
        self._reachable: bool = False
        self._available_models: List[str] = []
        self.last_error: Optional[str] = None

    # ------------------------------------------------------------------ #
    # Konfigurasi & kesehatan server
    # ------------------------------------------------------------------ #
    def configure(
        self,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        vision_model: Optional[str] = None,
    ) -> None:
        if base_url:
            self.base_url = base_url.strip().rstrip("/")
        if model:
            self.model_name = model.strip()
        if vision_model is not None:
            self.vision_model_name = vision_model.strip() or self.model_name
        self._last_check = 0.0  # paksa cek ulang
        self.check_health(force=True)

    def check_health(self, force: bool = False) -> bool:
        """Cek apakah server Ollama dapat dihubungi (hasil di-cache beberapa detik)."""
        now = time.time()
        if not force and now - self._last_check < self.HEALTH_TTL_SECONDS:
            return self._reachable

        self._last_check = now
        try:
            res = requests.get(f"{self.base_url}/api/tags", timeout=3)
            res.raise_for_status()
            self._available_models = [m.get("name", "") for m in res.json().get("models", [])]
            self._reachable = True
            self.last_error = None
            if not self._model_installed(self.model_name):
                self.last_error = (
                    f"Model '{self.model_name}' belum terpasang. Jalankan: ollama pull {self.model_name}"
                )
                logger.warning(self.last_error)
        except Exception as e:
            self._reachable = False
            self._available_models = []
            self.last_error = f"Server Ollama tidak dapat dihubungi di {self.base_url}: {e}"
            logger.warning(self.last_error)
        return self._reachable

    def _model_installed(self, name: str) -> bool:
        if not name:
            return False
        # "gemma3" cocok dengan "gemma3:latest"
        candidates = {name, f"{name}:latest"} if ":" not in name else {name}
        return any(m in candidates for m in self._available_models)

    @property
    def is_ready(self) -> bool:
        return self.check_health() and self._model_installed(self.model_name)

    def list_models(self) -> List[str]:
        self.check_health(force=True)
        return list(self._available_models)

    def status(self) -> Dict[str, Any]:
        reachable = self.check_health()
        return {
            "base_url": self.base_url,
            "model_name": self.model_name,
            "vision_model_name": self.vision_model_name,
            "reachable": reachable,
            "model_installed": self._model_installed(self.model_name),
            "vision_model_installed": self._model_installed(self.vision_model_name),
            "available_models": list(self._available_models),
            "error": self.last_error,
        }

    # ------------------------------------------------------------------ #
    # Inferensi
    # ------------------------------------------------------------------ #
    def _chat(
        self,
        model: str,
        prompt: str,
        system_instruction: Optional[str] = None,
        images: Optional[List[str]] = None,
        json_mode: bool = True,
    ) -> str:
        messages: List[Dict[str, Any]] = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        user_msg: Dict[str, Any] = {"role": "user", "content": prompt}
        if images:
            user_msg["images"] = images
        messages.append(user_msg)

        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "stream": False,
            "keep_alive": self.keep_alive,
            "options": {
                "temperature": self.temperature,
                # Output JSON agent cukup panjang; konteks default Ollama sering terlalu kecil
                "num_ctx": self.num_ctx,
            },
        }
        if json_mode:
            payload["format"] = "json"

        try:
            res = requests.post(f"{self.base_url}/api/chat", json=payload, timeout=self.timeout)
            if res.status_code == 404:
                self.last_error = f"Model '{model}' tidak ditemukan. Jalankan: ollama pull {model}"
                logger.error(self.last_error)
                return ""
            res.raise_for_status()
            content = res.json().get("message", {}).get("content", "")
            return _THINK_BLOCK.sub("", content).strip()
        except requests.exceptions.Timeout:
            self.last_error = f"Ollama timeout setelah {self.timeout} detik (model: {model})."
            logger.error(self.last_error)
        except Exception as e:
            self.last_error = f"Error pada Ollama chat: {e}"
            logger.error(self.last_error)
        return ""

    def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        json_mode: bool = True,
    ) -> str:
        return self._chat(self.model_name, prompt, system_instruction, json_mode=json_mode)

    def analyze_image_and_text(
        self,
        image_bytes: bytes,
        prompt: str,
        mime_type: str = "image/jpeg",
        system_instruction: Optional[str] = None,
    ) -> str:
        if not mime_type.startswith("image/"):
            # Ollama hanya menerima gambar (bukan PDF) -> agent akan memakai fallback.
            self.last_error = f"Ollama vision hanya mendukung gambar, bukan '{mime_type}'."
            logger.warning(self.last_error)
            return ""
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")
        return self._chat(
            self.vision_model_name,
            prompt,
            system_instruction,
            images=[image_b64],
            json_mode=True,
        )


ollama_service = OllamaService()
