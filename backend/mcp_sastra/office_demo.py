"""Local evaluation of upstream Office MCP, isolated from SASTRA's web app.

Run with this checkout's MCP v2 Python. The upstream MCP v1 server runs in a
separate venv. Gemini supplies structured lesson text, never paths or code.
"""
import argparse
import asyncio
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated

import httpx
from mcp import Client, StdioServerParameters
from pydantic import BaseModel, ConfigDict, Field, StringConstraints

UPSTREAM = "https://github.com/gawirable/office-mcp"
REVISION = "cf210cb6581f33cf3ceb57cf1defff4fc58d050b"
ROOT = Path(__file__).resolve().parents[2]
LAB = ROOT.parent / "SASTRA-OFFICE-MCP-LAB"
MODEL = "gemini-3.8-flash"
PROJECT = "hackathon-primestep-02"
Short = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=48)]
Sentence = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=140)]
ILLUSTRATION = ROOT / "examples/mcp/plant-illustration.png"
SOURCE = (
    "IPAS kelas IV: tumbuhan membuat makanan berupa gula melalui fotosintesis. "
    "Air diserap akar. Karbon dioksida berasal dari udara. Klorofil menangkap energi "
    "cahaya. Fotosintesis menghasilkan gula dan oksigen. Cahaya adalah sumber energi, "
    "bukan bahan makanan. Tumbuhan menggunakan gula untuk tumbuh. Ajak siswa "
    "mengamati daun dan mendiskusikan kebutuhan tanaman, tanpa mengklaim pengamatan "
    "warna daun saja sebagai pembuktian fotosintesis."
)


class Section(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: Short
    points: list[Sentence] = Field(min_length=3, max_length=3)


class Lesson(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: Short
    subtitle: Sentence
    sections: list[Section] = Field(min_length=5, max_length=5)


def check_install():
    if os.getenv("K_SERVICE"):
        raise RuntimeError("Office MCP evaluation is local-only; Cloud Run is refused.")
    # Fixed sibling lab: never the primary checkout, web DB or production runtime.
    if LAB.resolve() != LAB.absolute() or LAB.is_symlink():
        raise RuntimeError("Lab path must not resolve through a symlink or junction.")
    upstream = LAB / "upstream"
    commit = subprocess.run(["git", "-C", str(upstream), "rev-parse", "HEAD"],
                            capture_output=True, text=True, check=True).stdout.strip()
    if commit != REVISION:
        raise RuntimeError("Unexpected Office MCP revision; review before upgrading.")
    python = LAB / ".venv" / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
    if not python.is_file():
        raise RuntimeError("Install the separate Office MCP venv first; see docs/OFFICE_MCP_EVALUATION.md.")
    return upstream, python


def live_lesson():
    """One bounded Vertex request, using an existing gcloud login in memory.

    Does not create ADC, write tokens, change CLI configuration, deploy, or
    contact SASTRA production. There is deliberately no mock/fallback content.
    """
    gcloud = shutil.which("gcloud") or str(Path(os.environ.get("LOCALAPPDATA", "")) /
        "Google/Cloud SDK/google-cloud-sdk/bin/gcloud.cmd")
    auth = subprocess.run([gcloud, "auth", "print-access-token"], capture_output=True,
                          text=True, timeout=60)
    if auth.returncode or not auth.stdout.strip():
        raise RuntimeError("gcloud authentication unavailable; run gcloud auth login and retry.")
    prompt = (
        "Susun materi 6 slide berbahasa Indonesia untuk IPAS kelas IV, topik fotosintesis. "
        "Judul utama maksimal 32 karakter. Aplikasi membuat sampul dari title/subtitle. "
        "Buat tepat 5 sections berurutan: tujuan belajar; proses fotosintesis; bahan dan hasil; "
        "aktivitas mengamati; latihan refleksi. Tiap section tepat 3 points yang berbeda. "
        "Pada section proses, tulis poin maksimal 75 karakter agar cocok di samping diagram. "
        "Untuk section terakhir, ketiga poin berupa pertanyaan tanpa kunci jawaban. "
        "Poin section lain maksimal 115 karakter. Judul section maksimal 36 karakter. "
        "Jangan mengulang poin yang sama antarslide, jangan gunakan markdown atau bullet simbol. "
        "Hanya gunakan fakta sumber berikut, jangan mengarang hasil eksperimen: " + SOURCE
    )
    endpoint = (f"https://aiplatform.googleapis.com/v1/projects/{PROJECT}/locations/global/"
                f"publishers/google/models/{MODEL}:generateContent")
    response = httpx.post(endpoint, headers={"Authorization": "Bearer " + auth.stdout.strip()},
        json={"contents": [{"role": "user", "parts": [{"text": prompt}]}],
              "generationConfig": {"responseMimeType": "application/json",
                  "responseJsonSchema": Lesson.model_json_schema(), "maxOutputTokens": 6000}},
        timeout=120)
    # Never dump headers, request objects, credentials or token-bearing errors.
    if response.status_code != 200:
        raise RuntimeError(f"Vertex request failed (HTTP {response.status_code}); no fake output was substituted.")
    result = response.json()
    parts = result.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    raw = "".join(part.get("text", "") for part in parts if not part.get("thought"))
    lesson = Lesson.model_validate_json(raw)
    points = [p.casefold() for section in lesson.sections for p in section.points]
    if len(points) != len(set(points)):
        raise RuntimeError("Gemini repeated a point; review content before creating slides.")
    return lesson, {"provider": "Vertex AI", "model": result.get("modelVersion", MODEL),
                    "responseId": result.get("responseId"), "usage": result.get("usageMetadata"),
                    "live": True, "mock": False}


async def run(command):
    upstream, python = check_install()
    run_dir = LAB / ("run-" + datetime.now().strftime("%Y%m%d-%H%M%S-") + uuid.uuid4().hex[:6])
    run_dir.mkdir(parents=True)
    params = StdioServerParameters(command=str(python), args=[str(upstream / "server.py")],
        cwd=run_dir, env={"PYTHONUTF8": "1", "PYTHONIOENCODING": "utf-8",
                         "OFFICE_MCP_DEFAULT_FOLDER": str(run_dir)})
    receipt = {"upstream": UPSTREAM, "revision": REVISION, "transport": "stdio subprocess",
               "productionAccessed": False, "trace": []}
    # Upstream implements the v1 initialize handshake. Avoid an unnecessary
    # discover probe and its misleading server-side validation warnings.
    async with Client(params, read_timeout_seconds=240, mode="legacy") as client:
        tools = (await client.list_tools()).tools
        receipt["tools"] = [tool.name for tool in tools]
        receipt["pptxTools"] = [tool.name for tool in tools if tool.name.startswith("pptx_")]
        (run_dir / "tool-schemas.json").write_text(json.dumps(
            [{"name": t.name, "inputSchema": t.input_schema} for t in tools], indent=2), encoding="utf-8")
        if command == "discover":
            receipt["server"] = client.server_info.name
        else:
            lesson, inference = await asyncio.to_thread(live_lesson)
            receipt["inference"] = inference
            (run_dir / "lesson.json").write_text(lesson.model_dump_json(indent=2), encoding="utf-8")
            diagram = run_dir / "photosynthesis.png"
            diagram.write_bytes(ILLUSTRATION.read_bytes())
            (run_dir / "ASSET-CREDITS.txt").write_text(
                "Plant illustration generated for SASTRA using the built-in ImageGen tool.\n"
                "This is an illustrative plant, not a real photograph or a diagram of chemical reactions.\n"
                "Prompt: see examples/mcp/plant-illustration.txt in the SASTRA source checkout.\n", encoding="utf-8")
            ppt = run_dir / "SASTRA-Fotosintesis-Office-MCP.pptx"

            async def call(name, **args):
                # This deterministic host supplies all paths. No model-supplied
                # arbitrary paths, shell tools, student records or write targets.
                if name not in receipt["pptxTools"]:
                    raise RuntimeError("Only PPTX tools are allowed in this evaluation.")
                started = time.monotonic()
                result = await client.call_tool(name, {"path": str(ppt), **args})
                receipt["trace"].append({"tool": name, "isError": result.is_error,
                    "durationMs": round((time.monotonic() - started) * 1000)})
                if result.is_error:
                    raise RuntimeError("Office MCP tool failed: " + name + " " +
                        " ".join(c.text for c in result.content if c.type == "text"))
                return result.structured_content

            async def text(slide, value, x, y, w, h, size=24, bold=False, color="263D34"):
                return await call("pptx_add_text_box", slide=slide, text=value, x=x, y=y,
                    w=w, h=h, font_size=size, bold=bold, font_name="Arial", color=color)

            await call("pptx_create_presentation")
            # Upstream's default canvas is 10 x 7.5 inches (4:3). It has no
            # canvas-size/template/background tool; preserve it rather than
            # secretly rewriting the resulting file with another generator.
            for index in range(6):
                await call("pptx_add_slide", layout_index=6)
                await text(index, "SASTRA  /  IPAS KELAS IV", .6, .4, 8.8, .4, 13, color="587166")
                await text(index, f"{index + 1:02d} / 06", 8.45, 6.95, .95, .3, 11, color="587166")
            await text(0, lesson.title, .6, 1.65, 8.7, 1.65, 44, True, "173F35")
            await text(0, lesson.subtitle, .6, 3.55, 8.4, 1.3, 25)
            await text(0, "Tujuan, konsep, pengamatan, dan refleksi", .6, 5.65, 8.7, .7, 20, color="587166")
            for index, section in enumerate(lesson.sections, 1):
                await text(index, section.title, .6, 1.05, 8.8, 1, 32, True, "173F35")
                if index == 2:
                    await call("pptx_add_image", slide=index, image_path=str(diagram),
                               x=4.95, y=2.05, w=4.45, h=4.45)
                    for number, point in enumerate(section.points):
                        await text(index, point, .6, 2.25 + number * 1.25, 4.15, 1.15, 21)
                    await text(index, "Ilustrasi tanaman dibuat dengan AI", 4.95, 6.65, 4.45, .28, 10, color="587166")
                else:
                    for number, point in enumerate(section.points):
                        await text(index, f"{number + 1:02d}", .6, 2.4 + number * 1.35, .5, .45, 16, color="587166")
                        await text(index, point, 1.35, 2.3 + number * 1.35, 8.0, 1.1, 24)
            receipt["presentation"] = await call("pptx_get_info")
            receipt["readback"] = [await call("pptx_read_slide", index=i) for i in range(6)]
            receipt["pdf"] = await call("pptx_export_pdf", output=str(ppt.with_suffix(".pdf")))
            receipt["pptxSha256"] = hashlib.sha256(ppt.read_bytes()).hexdigest()
            receipt["pptxBytes"] = ppt.stat().st_size
            receipt["contentSource"] = SOURCE
            receipt["assetSource"] = str(ILLUSTRATION)
            receipt["limitation"] = "Local evaluation, deterministic MCP host, not an autonomous Gemini tool-selection loop or production integration."
        receipt["verifiedAt"] = datetime.now(timezone.utc).isoformat()
        (run_dir / "receipt.json").write_text(json.dumps(receipt, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({"evidence": str(run_dir), "toolCount": len(receipt["tools"]),
                      "pptxToolCount": len(receipt["pptxTools"]), "liveGemini": command == "demo"}, indent=2))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("discover", "demo"))
    args = parser.parse_args()
    asyncio.run(run(args.command))


if __name__ == "__main__":
    main()
