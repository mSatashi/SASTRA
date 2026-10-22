# SASTRA custom presentation designer (local MCP)

The custom engine owns layout composition, typography, colors, artwork selection,
content budgets and speaker notes. It uses PptxGenJS 4.0.1 as its file-writing
library, not the Office MCP server or its default templates. This is application
code for a reusable tool; an agent supplies data, never executable slide code.

## What changed

The local SASTRA server now exposes ten tools. The two new tools are:

- `design_presentation(assessment_id, expected_version, plan)`: render an editable
  16:9 lesson deck using a typed plan, only after source approval/version checks.
- `preview_presentation(presentation_id)`: render that file to a PDF with local
  LibreOffice so the agent/teacher can inspect the actual result.

PPTX resource: `sastra://presentations/{id}`.
PDF resource: `sastra://previews/{id}`.
The bounded Gemini bridge discovers both tools and prefers the designer for
visual lesson requests. The earlier `generate_presentation` tool remains for
compatibility, with its original simpler layout.

The new tools are local only. No production frontend, backend routes, web
requirements, container, IAM, Cloud Run deployment, traffic or data is changed.

## Design system

- A widescreen canvas with Georgia headings and Arial body text. Install these
  fonts, or explicitly validate an available substitute, on a future rendering
  host. The current PDF was checked on Windows through LibreOffice.
- Two palettes: forest green/ivory/gold and terracotta/ivory/ochre.
- Full-bleed cover artwork with editable title and subtitle.
- Seven content layouts: opening question, illustrated concept, three-step
  process, comparison, classroom activity, multiple-choice question, reflection.
- Short, distinct text. Repeated titles/body items and overly repetitive layouts
  are rejected. Every layout has fixed text slots and role-specific item counts.
- Conservative text-fit estimation, off-canvas checks and text-slot intersection
  checks stop an invalid render before the PPT is stored. These are guards, not
  proof of visual quality: always inspect the rendered PDF.
- Package relationship checks before storage. PptxGenJS 4.0.1 emits unused
  slide-master content-type declarations; the service removes only those
  nonexistent master declarations, while missing parts/relationships of other
  kinds fail validation. The actual editable output is covered by a regression
  check that every content-type override targets an existing package part.
- Native editable text, embedded raster artwork, and editable teacher notes.
  The slides are not flattened screenshots.

Image choices are an enum backed by a bundled registry; no caller-controlled
paths or URLs are accepted. The botanical art is only permitted for plant
lessons. Other topics can use `none`, preserving the layouts and typography.
The current asset library is a small botanical sample, not a full library for
all subjects. Each instructional asset can appear only once per deck.

## Setup and usage

Use the separate MCP checkout/venv from `MCP_SANDBOX.md`, Node.js 22+, and
LibreOffice for preview. Office MCP itself is not required for this engine.

```powershell
npm --prefix tools/presentation-designer ci --ignore-scripts
backend/.venv/Scripts/python.exe -m backend.mcp_sastra.designer_demo
```

The reproducible demo imports an editorially written classroom sample into the
isolated SQLite DB, demonstrates rejection before approval, explicitly simulates
a teacher approving the sample outside MCP, and then starts the real stdio MCP
server to design, preview and download the files. It saves a receipt, an
eight-slide PPTX and an eight-page PDF in a new sibling QA folder.

**The sample's content and art direction are authored, not an AI model double.**
The demo does not perform new Gemini inference or consume Vertex credits. It
proves real MCP execution of the custom engine. Autonomous generation of a new
plan by live Gemini through this new tool was not part of that demonstration.

For another already approved assessment, load it through MCP, compose a plan
faithful to its module/objective, and supply that plan to `design_presentation`.
`examples/mcp/designed-lesson.json` is a complete plan example. Total slides are
one cover plus 3–11 content slides. The model/teacher must still check factual
accuracy; layout validation does not establish that a proposed lesson is true.
Source answer keys, rubrics, submissions and student identities are not passed
to the renderer. Do not paste those into a plan yourself.

```powershell
backend/.venv/Scripts/python.exe -m backend.mcp_sastra.client call design_presentation --args-file request.json
backend/.venv/Scripts/python.exe -m backend.mcp_sastra.client call preview_presentation --args-file preview-request.json
backend/.venv/Scripts/python.exe -m backend.mcp_sastra.client download PRESENTATION_ID --out lesson.pptx
backend/.venv/Scripts/python.exe -m backend.mcp_sastra.client download PRESENTATION_ID --format pdf --out lesson.pdf
```

`request.json` has `assessment_id`, `expected_version` and `plan` fields.
`preview-request.json` has a `presentation_id` field. Discover actual IDs and
versions first; none of these commands approves or finalizes teaching material.

## Concurrency and verification

Rendering happens outside the SQLite transaction. Before storing the result,
the server checks source version and approval again. If content changes during
rendering, no presentation is committed. Node and LibreOffice have timeouts;
PPTX size is limited to 25 MB. Resource downloads use server-owned IDs.

```powershell
backend/.venv/Scripts/python.exe -m unittest backend.mcp_sastra.tests.test_protocol backend.mcp_sastra.tests.test_designer
```

The designer tests cover invalid image paths/extra fields/repeated content,
approval/version gates before rendering, a concurrent source update rejecting
the write, and actual MCP generation/download of editable widescreen slides
and a PDF preview. Original grading/report protocol checks remain in the suite.

## Art origin

All three pictures are AI-generated, not photographs of real plants or children.
Their origin is recorded in speaker notes. Complete prompts are recorded in
`examples/mcp/designer-assets.txt` and `examples/mcp/plant-illustration.txt`.
The bundled file paths are:

- `examples/mcp/forest-cover.png`
- `examples/mcp/plant-illustration.png`
- `examples/mcp/classroom-activity.png`

The cover/photo-like plant and the fictional classroom illustration were made
with the built-in ImageGen tool specifically for this design. They illustrate
the lesson; neither is scientific evidence or documentation of a real class.
