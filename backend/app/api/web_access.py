"""Shared team access for the public hackathon prototype, not teacher accounts."""
import hashlib
import hmac
import secrets
import threading
import time
from collections import deque
from urllib.parse import urlsplit

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from ..config import settings

router = APIRouter(prefix="/api/v1/session", tags=["Team access"])
COOKIE = "__Host-sastra_session"
LIFETIME = 8 * 60 * 60
_failures = deque()
_lock = threading.Lock()


def token():
    payload = f"{int(time.time()) + LIFETIME}.{secrets.token_urlsafe(18)}"
    signature = hmac.new(settings.WEB_ACCESS_CODE.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}.{signature}"


def authenticated(request):
    if not settings.WEB_PUBLIC_MODE:
        return True
    try:
        expires, nonce, signature = request.cookies.get(COOKIE, "").split(".")
        expiry = int(expires)
        if not time.time() < expiry <= time.time() + LIFETIME:
            return False
        payload = f"{expires}.{nonce}"
        expected = hmac.new(settings.WEB_ACCESS_CODE.encode(), payload.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(signature, expected)
    except (ValueError, TypeError):
        return False


async def access_boundary(request, call_next):
    if settings.WEB_PUBLIC_MODE:
        if len(settings.WEB_ACCESS_CODE) < 24:
            # No public app/API is served if the deployment omitted its secret.
            return JSONResponse(status_code=503, content={"detail": "Akses web belum dikonfigurasi."})
        path = request.url.path
        if path in ("/docs", "/redoc", "/openapi.json") or (path.startswith("/api/") and not path.startswith("/api/v1/")):
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        if request.method not in ("GET", "HEAD", "OPTIONS") and path.startswith("/api/"):
            origin = request.headers.get("origin")
            if origin:
                try:
                    parsed = urlsplit(origin)
                except ValueError:
                    return JSONResponse(status_code=403, content={"detail": "Origin permintaan tidak sesuai."})
                if parsed.scheme != "https" or parsed.netloc != request.headers.get("host"):
                    return JSONResponse(status_code=403, content={"detail": "Origin permintaan tidak sesuai."})
        public = path in ("/api/v1/session", "/api/v1/session/login", "/api/v1/session/logout")
        if path.startswith("/api/v1/") and not public and not authenticated(request):
            return JSONResponse(status_code=401, content={"detail": "Masuk menggunakan kode akses tim terlebih dahulu."})
    response = await call_next(request)
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    return response


class Login(BaseModel):
    code: str = Field(min_length=1, max_length=256)


@router.get("")
def session(request: Request):
    return {"required": settings.WEB_PUBLIC_MODE, "authenticated": authenticated(request)}


@router.post("/login")
def login(req: Login):
    if not settings.WEB_PUBLIC_MODE:
        return {"authenticated": True}
    with _lock:
        now = time.monotonic()
        while _failures and now - _failures[0] > 300:
            _failures.popleft()
        if len(_failures) >= 30:
            return JSONResponse(status_code=429, content={"detail": "Terlalu banyak percobaan. Coba lagi dalam 5 menit."})
        valid = hmac.compare_digest(hashlib.sha256(req.code.encode()).digest(), hashlib.sha256(settings.WEB_ACCESS_CODE.encode()).digest())
        if not valid:
            _failures.append(now)
            return JSONResponse(status_code=401, content={"detail": "Kode akses tidak sesuai."})
    response = JSONResponse({"authenticated": True})
    response.set_cookie(COOKIE, token(), max_age=LIFETIME, secure=True, httponly=True, samesite="strict", path="/")
    response.headers["Cache-Control"] = "no-store"
    return response


@router.post("/logout")
def logout():
    response = JSONResponse({"authenticated": False})
    response.delete_cookie(COOKIE, secure=True, httponly=True, samesite="strict", path="/")
    return response
