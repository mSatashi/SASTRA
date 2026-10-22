# Office MCP: local evaluation

This evaluates the existing [gawirable/office-mcp](https://github.com/gawirable/office-mcp)
server instead of writing another PowerPoint server. Upstream is credited for
the Office tools and file creation/export. Its package declares MIT licensing.
The reviewed source revision is `cf210cb6581f33cf3ceb57cf1defff4fc58d050b`.
It is an alpha package, not a Microsoft/Google product or a production-quality
claim by SASTRA.

## Isolation

The upstream checkout and its own virtual environment live in the sibling
`SASTRA-OFFICE-MCP-LAB` directory. Office MCP requires MCP SDK 1.x, whereas
SASTRA's local MCP host uses 2.x. They communicate over stdio using the v1
initialize handshake; the packages never share a virtual environment.

Nothing imports this evaluation from the web app. No frontend, web requirements,
Dockerfile, build trigger, IAM, database, production service or traffic is changed.
The script refuses Cloud Run execution (`K_SERVICE`). Generated files go into a
new timestamped lab run directory. There are no student records in the demo.

Upstream accepts arbitrary filesystem paths: its default-folder option is **not**
a security sandbox. This evaluation host supplies all paths itself and exposes
no raw Office tools to Gemini or website users. A future app integration must
retain this boundary and add per-request storage isolation and resource limits.

## Install and run on Windows

Prerequisites: Git, uv, this checkout's `backend/.venv` with
`requirements-mcp.txt`, and LibreOffice for PDF export.

From the SASTRA MCP checkout:

```powershell
powershell -NoProfile -File scripts/install-office-mcp-lab.ps1
backend/.venv/Scripts/python.exe -m backend.mcp_sastra.office_demo discover
backend/.venv/Scripts/python.exe -m backend.mcp_sastra.office_demo demo
```

`discover` starts the actual upstream server, negotiates MCP and saves the
discovered tool schemas. No model request is needed.

`demo` makes one live Vertex AI request to `gemini-3.8-flash` in project
`hackathon-primestep-02`, global endpoint. It uses the existing `gcloud` login's
short-lived access token in memory. It does not write credentials, create ADC,
change the gcloud project, or print tokens. If authentication, model access,
structured content, or an MCP operation fails, it stops without substituting
mock content. This model call consumes project quota/credits.

Gemini returns a typed six-slide lesson plan on photosynthesis. A deterministic
host sends create/add-text/add-image/read/export calls through the installed
Office MCP subprocess. It saves a PPTX, PDF, original lesson JSON, asset credits,
tool schemas, and a receipt containing call outcomes and model usage.

The plant illustration is a local, bundled asset generated with the built-in
ImageGen tool. Its origin and complete prompt are recorded in
`examples/mcp/plant-illustration.txt`. The relevant slide identifies it as an
AI-generated illustration. It is not a real photograph or a chemical reaction
diagram. The demo makes no external image-download requests.

## What this proves and what it does not

- Actual third-party MCP server installation and stdio tool execution.
- Real Gemini lesson text, without a model double.
- Editable slide text, embedded instructional image, and PDF export.
- Cross-version client/server protocol compatibility.

The evaluation does **not** connect the production website to Office MCP, allow
Gemini to autonomously choose Office tools, or approve teaching material on a
teacher's behalf. It uses a dedicated educational sample rather than the
production assessment database. A teacher still needs to review generated facts
and questions before classroom use.

Upstream's available tools do not expose a canvas-size setter, reusable branded
template loader, slide background styling, or speaker-note editing. The demo
therefore keeps its native 10 x 7.5 inch (4:3) canvas. It does not silently repair
the file through another presentation generator. Visual quality requires an
explicit layout and checking the actual PDF rendering; installation alone does
not provide automatic design quality.

## Upstream PowerPoint checks

Use a **new, unused** temporary directory per run, because pytest may clean its
base temp directory. Do not point it at user files or reuse an evidence folder.

```powershell
cd ../SASTRA-OFFICE-MCP-LAB/upstream
../.venv/Scripts/python.exe -m pytest tests/test_pptx_core.py tests/test_pptx_content.py -q --basetemp ../pytest-UNIQUE-RUN
```

The chosen tests cover 68 PowerPoint operations/validation cases, including PDF
export. Separate end-to-end evidence is recorded by `office_demo demo`.

## Observed evaluation on 2026-10-22

- Installed upstream `office-mcp==0.1.0` at the pinned revision, with its own
  `mcp==1.30.0` environment.
- Discovered 47 tools, including 14 `pptx_*` tools, through actual stdio MCP.
- The 68 upstream PowerPoint tests passed. Windows' default pytest temp folder
  was inaccessible on the initial attempt; using a new lab-specific base temp
  directory resolved that environment issue.
- A real Vertex `gemini-3.8-flash` response supplied the lesson text. The model
  response ID, usage metadata, and `mock: false` are in the local receipt.
- The deterministic host completed 64 successful MCP calls, including creation,
  text insertion, illustration insertion, reading each slide, and PDF export.
- The resulting editable PPTX and rendered PDF both contain six slides/pages.
  All six rendered slides were visually inspected. The package integrity check
  reported no findings. This is not a claim that PowerPoint desktop was opened.

Evidence is in the sibling lab's `run-20261022-090033-b0886c` directory;
upstream test output is `upstream-pptx-tests.txt`. Generated evidence is kept
outside the Git repository. Production was not accessed or changed.
