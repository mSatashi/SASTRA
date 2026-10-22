"""SASTRA-owned lesson layouts. No production routes or external file access."""
import json
import io
import posixpath
import re
import shutil
import subprocess
import tempfile
import zipfile
from pathlib import Path
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator
from lxml import etree

from backend.app.services.presentation_service import PresentationService
from backend.app.services.workspace_service import WorkspaceError, activity, check_version, find, identifier, now
from .sandbox import ROOT, database_path

Heading = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=44)]
Body = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=110)]
Label = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=28)]


class DesignItem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    label: Label
    body: Body


class DesignSlide(BaseModel):
    model_config = ConfigDict(extra="forbid")
    layout: Literal["hook", "concept", "process", "compare", "activity", "quiz", "reflection"]
    kicker: Label
    title: Heading
    lead: Annotated[str, StringConstraints(strip_whitespace=True, max_length=135)] = ""
    items: list[DesignItem] = Field(min_length=1, max_length=3)
    visual: Literal["none", "plant", "classroom"] = "none"
    notes: str = Field(default="", max_length=900)

    @model_validator(mode="after")
    def layout_contract(self):
        count = 1 if self.layout == "hook" else 2 if self.layout == "compare" else 3
        if len(self.items) != count:
            raise ValueError(f"Layout {self.layout} requires {count} content items.")
        if self.visual == "plant" and self.layout != "concept":
            raise ValueError("Plant artwork belongs to the concept layout.")
        if self.visual == "classroom" and self.layout != "activity":
            raise ValueError("Classroom artwork belongs to the activity layout.")
        if self.layout in {"hook", "process", "compare", "quiz", "reflection"} and not self.lead:
            raise ValueError("This layout requires a lead sentence or question.")
        return self


class DesignPlan(BaseModel):
    model_config = ConfigDict(extra="forbid")
    theme: Literal["forest", "terracotta"] = "forest"
    title: Heading
    subtitle: Body
    coverVisual: Literal["none", "forest"] = "none"
    slides: list[DesignSlide] = Field(min_length=3, max_length=11)

    @model_validator(mode="after")
    def varied_content(self):
        required = 4 if len(self.slides) >= 5 else 2
        if len({slide.layout for slide in self.slides}) < required:
            raise ValueError(f"Use at least {required} distinct layouts for this deck.")
        titles = [slide.title.casefold() for slide in self.slides]
        bodies = [item.body.casefold() for slide in self.slides for item in slide.items]
        if len(titles) != len(set(titles)) or len(bodies) != len(set(bodies)):
            raise ValueError("Repeated slide titles or identical content items are not allowed.")
        visuals = [slide.visual for slide in self.slides if slide.visual != "none"]
        if len(visuals) != len(set(visuals)):
            raise ValueError("Use each instructional illustration only once.")
        return self


def normalize_package(data):
    """Remove PptxGenJS 4.0.1's unused slide-master type declarations.

    The library emits one override per slide but writes a single master part.
    Do not remove missing parts of other kinds or repair missing relationships:
    those are real corruption and must fail before storage.
    """
    with zipfile.ZipFile(io.BytesIO(data)) as package:
        names=set(package.namelist())
        parser=etree.XMLParser(resolve_entities=False,no_network=True)
        types=etree.fromstring(package.read("[Content_Types].xml"),parser)
        for entry in list(types):
            part=entry.get("PartName","").lstrip("/")
            if not part or part in names:
                continue
            if re.fullmatch(r"ppt/slideMasters/slideMaster[0-9]+\.xml",part):
                types.remove(entry)
            else:
                raise WorkspaceError("Struktur PPT tidak valid: bagian dokumen hilang.",502)
        for name in names:
            if not name.endswith(".rels"):
                continue
            rels=etree.fromstring(package.read(name),parser)
            source_dir="" if name=="_rels/.rels" else posixpath.dirname(posixpath.dirname(name))
            for rel in rels:
                if rel.get("TargetMode")=="External":
                    continue
                target=rel.get("Target","")
                resolved=target.lstrip("/") if target.startswith("/") else posixpath.normpath(posixpath.join(source_dir,target))
                if resolved not in names:
                    raise WorkspaceError("Struktur PPT tidak valid: relasi dokumen hilang.",502)
        out=io.BytesIO()
        with zipfile.ZipFile(out,"w",compression=zipfile.ZIP_DEFLATED) as cleaned:
            for entry in package.infolist():
                cleaned.writestr(entry,etree.tostring(types,xml_declaration=True,encoding="UTF-8")
                    if entry.filename=="[Content_Types].xml" else package.read(entry.filename))
        return out.getvalue()


def run_renderer(plan):
    database_path()  # Also reject deployed runtimes before creating temp files.
    node = shutil.which("node")
    renderer = ROOT / "tools/presentation-designer/render.mjs"
    if not node or not (renderer.parent / "node_modules/pptxgenjs").is_dir():
        raise WorkspaceError("Pasang Node.js dan jalankan npm ci di tools/presentation-designer.", 503)
    parent = database_path().parent / "renders"
    parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=parent, prefix="designer-") as folder:
        source, output = Path(folder)/"plan.json", Path(folder)/"deck.pptx"
        source.write_text(json.dumps(plan, ensure_ascii=False), encoding="utf-8")
        try:
            result = subprocess.run([node, str(renderer), str(source), str(output)],
                capture_output=True, text=True, encoding="utf-8", timeout=90)
        except subprocess.TimeoutExpired as exc:
            raise WorkspaceError("Desain PPT melewati batas waktu; file belum disimpan.", 502) from exc
        if result.returncode:
            # Fixed renderer errors identify the offending layout slot. No code
            # or model-selected paths are executed, and no fake file is returned.
            message = [line for line in (result.stderr or "Renderer failed").splitlines()
                       if line.startswith("Error:") or line.startswith("TypeError:")][:2]
            if not message:
                message = ["Renderer failed; check the Node.js installation and dependencies."]
            raise WorkspaceError("Desain belum lolos pemeriksaan layout. " + " ".join(message), 422)
        data = normalize_package(output.read_bytes())
        if len(data) > 25*1024*1024:
            raise WorkspaceError("PPT melebihi batas ukuran 25 MB.", 422)
        audit = json.loads(Path(str(output)+".layout.json").read_text(encoding="utf-8"))
        return data, {"textSlots": len(audit["slots"]), "canvas": "16:9",
                      "boundsCheck": "pass", "textOverlapCheck": "pass", "packageRelationsCheck":"pass",
                      "textFitCheck": "conservative estimate; verify rendered preview"}


class DesignerService(PresentationService):
    def design(self, content_id, expected_version, plan):
        content = find(self.workspace.read()["contents"], content_id)
        check_version(content, expected_version)
        if content["status"] != "APPROVED":
            raise WorkspaceError("Setujui materi sebelum mendesain PPT.")
        plant_visual = plan.coverVisual == "forest" or any(s.visual != "none" for s in plan.slides)
        source_text = json.dumps({k: content.get(k) for k in ("title", "module", "materials")}, ensure_ascii=False)
        if plant_visual and not re.search(r"fotosintesis|tumbuhan|daun|tanaman", source_text, re.I):
            raise WorkspaceError("Ilustrasi tanaman hanya untuk materi tumbuhan; pilih visual none untuk topik lain.")
        payload = {**plan.model_dump(), "subject": content.get("subject", "IPAS"),
                   "className": content.get("className", "IV"), "sourceId": content["id"],
                   "sourceVersion": content["version"], "objective": content["objective"]}
        data, checks = run_renderer(payload)
        metadata = {"id": identifier(), "contentId": content_id, "sourceVersion": content["version"],
            "title": plan.title.replace("\n", " "), "slideCount": len(plan.slides)+1,
            "createdAt": now(), "status": "DRAFT", "engine": "sastra-designer",
            "theme": plan.theme, "layouts": ["cover"]+[s.layout for s in plan.slides],
            "checks": checks, "designPlan": plan.model_dump()}
        db = self._connect()
        try:
            db.execute("BEGIN IMMEDIATE")
            current = json.loads(db.execute("SELECT data FROM workspace WHERE id=1").fetchone()[0])
            latest = find(current["contents"], content_id)
            check_version(latest, expected_version)
            if latest["status"] != "APPROVED":
                raise WorkspaceError("Status materi berubah; tinjau sumber sebelum membuat ulang.", 409)
            db.execute("INSERT INTO presentations VALUES (?,?,?,?)", (metadata["id"],content_id,json.dumps(metadata,ensure_ascii=False),data))
            activity(current,"ContentAgent",f'Draf PPT desain SASTRA ({len(plan.slides)+1} slide) dibuat dari materi v{expected_version}.')
            db.execute("UPDATE workspace SET data=? WHERE id=1",(json.dumps(current,ensure_ascii=False),))
            db.commit()
            return metadata
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    def preview(self, presentation_id):
        database_path()
        data = self.download(presentation_id)
        soffice = shutil.which("soffice")
        windows = Path(r"C:\Program Files\LibreOffice\program\soffice.exe")
        if windows.is_file():
            soffice = str(windows)
        if not soffice:
            raise WorkspaceError("Pasang LibreOffice untuk membuat pratinjau PDF.",503)
        parent = database_path().parent / "renders"
        parent.mkdir(parents=True,exist_ok=True)
        with tempfile.TemporaryDirectory(dir=parent,prefix="preview-") as folder:
            root = Path(folder)
            source = root/"deck.pptx"
            source.write_bytes(data)
            try:
                result = subprocess.run([soffice,"--headless",f"-env:UserInstallation={(root/'profile').as_uri()}",
                    "--convert-to","pdf","--outdir",str(root),str(source)],
                    capture_output=True,timeout=90)
            except subprocess.TimeoutExpired as exc:
                raise WorkspaceError("Render PDF melewati batas waktu.",502) from exc
            if result.returncode or not (root/"deck.pdf").is_file():
                raise WorkspaceError("Pratinjau PDF gagal dibuat.",502)
            pdf = (root/"deck.pdf").read_bytes()
        db = self._connect()
        try:
            db.execute("CREATE TABLE IF NOT EXISTS presentation_previews (id TEXT PRIMARY KEY, file BLOB NOT NULL)")
            db.execute("INSERT OR REPLACE INTO presentation_previews VALUES (?,?)",(presentation_id,pdf))
            db.commit()
        finally:
            db.close()
        return {"presentationId":presentation_id,"bytes":len(pdf),"status":"DRAFT",
                "resourceUri":f"sastra://previews/{presentation_id}"}

    def preview_file(self, presentation_id):
        db = self._connect()
        try:
            exists = db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='presentation_previews'").fetchone()
            row = db.execute("SELECT file FROM presentation_previews WHERE id=?",(presentation_id,)).fetchone() if exists else None
            if row is None:
                raise WorkspaceError("Buat pratinjau PDF terlebih dahulu.",404)
            return row[0]
        finally:
            db.close()
