# SASTRA MCP: isolated local implementation

This branch implements an MCP server, an MCP client, and a bounded Gemini
tool-calling bridge. It uses the official Python MCP SDK 2.3.0.

For the separately installed third-party PowerPoint server and live Gemini
lesson-to-PPT evaluation, see [Office MCP evaluation](OFFICE_MCP_EVALUATION.md).
That optional lab is separate from the SASTRA server and the production app.

For SASTRA's own widescreen layouts, artwork and PDF preview tools, use the
[custom presentation designer](PRESENTATION_DESIGNER.md). This is the preferred
local presentation path; Office MCP remains an optional comparison lab.

## Boundary with the production website

The server runs only as a local stdio process. It is not imported or mounted
in `backend/app/main.py`, exposes no HTTP port, and is not deployed to Cloud
Run. No frontend code, production requirements, Dockerfile, Cloud Build
configuration, secrets, IAM, traffic, or production data are changed.

The database is fixed to `backend/data/mcp/workspace.sqlite3` in this checkout.
It does not use `SASTRA_WORKSPACE_DB`, Cloud SQL, or the private GCS bootstrap.
It rejects symlinks/junctions that escape this sandbox and refuses startup
when `K_SERVICE` indicates a Cloud Run environment. Its initial roster is
fictional. It does not download or copy production records.

Use a separate checkout and virtual environment, such as this task's
`SASTRA-MCP` worktree. The installed SDK and dependencies there do not affect
the existing web app's environment.

## Install and discover (PowerShell, from repository root)

```powershell
py -3.11 -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements-mcp.txt
powershell -NoProfile -File scripts/mcp-local.ps1 tools
```

`tools` performs actual MCP negotiation/discovery through a subprocess; no
model credentials or model call are needed. The server can also be launched
directly by an MCP host:

```powershell
backend/.venv/Scripts/python.exe -m backend.mcp_sastra.server
```

Configure the host to launch that Python executable with arguments
`["-m", "backend.mcp_sastra.server"]` and the repository root as its working
directory. The stdio server writes protocol messages to stdout and diagnostics
to stderr. The local host process and filesystem permissions are the trust
boundary; this is not a remotely authenticated multi-teacher service.

## Implemented tools

| Tool | Behavior |
| --- | --- |
| `list_students` | Discover the isolated sample roster. |
| `list_assessments` | Discover IDs, versions and approval states. |
| `load_assessment` | Read questions, key and rubric for teacher use. |
| `generate_assessment` | Generate a draft with the existing Content service. |
| `grade_answer` | Accept JPG/PNG/PDF bytes as base64, max 10 MB; propose a grade using an approved key. |
| `load_approved_grades` | Read only approved grades in the requested scope. |
| `draft_report` | Produce a draft from approved evidence and source versions. |
| `generate_presentation` | Produce draft PPTX from approved content at an expected version. |
| `design_presentation` | Produce a designed editable 16:9 PPTX from an approved source and a typed editorial plan. |
| `preview_presentation` | Render a generated PPTX to a PDF preview for visual inspection. |

Every tool publishes input and output schemas and MCP tool annotations.
Expected workflow failures become tool errors, not fabricated results.
PPTX bytes are read using the MCP resource URI returned by the presentation
tool: `sastra://presentations/{id}`. No tool accepts arbitrary filesystem
paths, URLs, shell commands, or SQL statements.

## Human review remains outside the agent tool set

There are no MCP tools to approve assessments/grades or finalize reports.
The isolated teacher CLI reads the review queue and performs explicit human
actions using the same version/identity/score checks as the existing service:

```powershell
backend/.venv/Scripts/python.exe -m backend.mcp_sastra.review queue
backend/.venv/Scripts/python.exe -m backend.mcp_sastra.review approve-assessment ASSESSMENT_ID --version 1 --reviewed
backend/.venv/Scripts/python.exe -m backend.mcp_sastra.review approve-grade SUBMISSION_ID --version 1 --scores 5 3 --identity-confirmed
```

Replace the IDs and scores after reading the actual evidence. These commands
are for the teacher, not exposed through MCP or the agent allow-list.

## Client and agent examples

```powershell
powershell -NoProfile -File scripts/mcp-local.ps1 call generate_assessment --args-file examples/mcp/generate-assessment.json
powershell -NoProfile -File scripts/mcp-local.ps1 call load_approved_grades --args-file examples/mcp/approved-grades.json
powershell -NoProfile -File scripts/mcp-local.ps1 grade --student s1 --assessment ASSESSMENT_ID --file ANSWER.png
powershell -NoProfile -File scripts/mcp-local.ps1 agent "Buat PPT empat slide dari materi Fotosintesis yang sudah disetujui."
powershell -NoProfile -File scripts/mcp-local.ps1 download PRESENTATION_ID --out DRAFT.pptx
```

Generate/grade/report/PPT and the `agent` command require inference credentials
configured in this local environment. The server does not borrow Cloud Run
credentials. Vertex mode uses ADC for the configured project, model and
location. Model calls consume that project's inference quota; discovery and
the offline tests do not. Missing ADC returns an explicit failure; there is
no simulator fallback in the CLI.

The bridge discovers real MCP schemas, supplies those schemas to Gemini,
executes allow-listed calls via the MCP client, and sends tool results back
to the model. It preserves function-call IDs and opaque thought signatures.
Only public events (tool name, outcome, duration) are returned as a trace.
Execution stops after eight tool calls. `grade_answer` is available to the
direct client with user-provided file bytes; the language model is not allowed
to generate image base64. No UI integration or automatic autonomous workflow
is enabled on the production website.

## Verification

```powershell
backend/.venv/Scripts/python.exe -m pip install httpx
backend/.venv/Scripts/python.exe -m unittest backend.mcp_sastra.tests.test_protocol -q
```

Tests use a real SDK client/server transport with temporary SQLite databases
and an explicitly mocked inference model. They exercise draft generation,
approval/version rejection, binary PPTX resources, image validation, mismatch
rejection without evidence writes, approved-grade-only reports, bounded agent
tool calls, and signature retention. They do not validate live Gemini quality
or claim production MCP deployment. CLI subprocess discovery is checked
separately over stdio. There is no live cloud deployment in this change.

References: [official MCP SDK](https://py.sdk.modelcontextprotocol.io/),
[Gemini function calling](https://ai.google.dev/gemini-api/docs/generate-content/function-calling).
