# Vertex + teacher workspace

The user successfully called `gemini-3.8-flash` on the `global` endpoint in project
`hackathon-primestep-02` from Cloud Shell on 21 October 2026. That verifies the
Cloud Shell user's access, not local ADC or the Cloud Run service account.

## What is connected

- `google-genai` uses an explicit Vertex client, ADC, API v1, and the configured project/model/location.
- `/api/v1/dashboard` and the mutation endpoints match `frontend/src/client.ts`.
- Content generates material, mixed questions, answer keys and rubrics. The teacher approves the version.
- Vision accepts JPG/PNG/PDF up to 10 MB, using that approved key. Original bytes are retained for review.
- Only teacher-approved grades enter reports. Stale writes return 409; revised grades stale draft reports.
- Final reports keep their source version snapshot. No API workflow silently substitutes demo AI results.
- The initial API workspace contains an explicitly synthetic class roster and **zero grades, materials or reports**.
- Existing `/api/assessment`, `/api/grading`, `/api/report`, and Ollama support are retained.
  Those legacy routes still have their original fallback/storage behavior; the new UI uses `/api/v1`.

## Local Windows

Install the official Google Cloud CLI if `gcloud` is unavailable, then authenticate
with the Google account that has access to this project:

```powershell
gcloud auth application-default login
gcloud auth application-default set-quota-project hackathon-primestep-02
```

These credentials are local to this machine. Do not copy Cloud Shell tokens or
service-account JSON keys into frontend variables or Git.

From the repository root, start the backend:

```powershell
python -m venv backend/.venv
.\backend\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
Copy-Item backend/.env.example backend/.env
.\backend\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

Only copy the example if `backend/.env` does not already exist. Defaults:
`LLM_PROVIDER=gemini`, `GEMINI_AUTH_MODE=vertex`, `GCP_PROJECT=hackathon-primestep-02`,
`GCP_LOCATION=global`, `GEMINI_MODEL=gemini-3.8-flash`.

In a second PowerShell terminal:

```powershell
cd frontend
$env:VITE_DATA_MODE = 'api'
$env:VITE_API_URL = '/api/v1'
npm ci
npm run dev
```

Vite proxies `/api` to port 8000. Stop an existing Vite instance before reusing port
3000. Defaults remain demo mode unless `VITE_DATA_MODE=api` is explicitly set.
API errors are displayed in the UI with their actual backend detail.

## Cloud Shell: real SDK smoke test

Use the branch containing this change until it is merged; afterwards use `main`:

```bash
git clone --branch feat/vertex-workspace-integration https://github.com/mSatashi/SASTRA.git sastra-vertex
cd sastra-vertex
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
.venv/bin/python -c 'from backend.app.services.gemini_service import gemini_service as ai; print(ai.generate_text("Buat satu soal IPAS kelas IV beserta jawabannya.", json_mode=False))'
```

Cloud Shell supplies credentials for its signed-in user. A model response from this
script verifies the **new SDK path**. The script itself was not run on Cloud Shell by the
local coding agent; the SDK was subsequently verified in the deployed Cloud Run service
(see [deployment record](CLOUD_RUN_DEPLOYMENT.md)). `GET /api/v1/status` distinguishes `clientConfigured` from
`lastRequestSucceeded`; constructing a client alone does not verify IAM/quota.

## Build and Cloud Run

`cloudbuild.yaml` continues building the standalone frontend demo. For the combined
API + UI image, select **`cloudbuild.app.yaml`** in the Cloud Build trigger. Its image
is `asia-southeast2-docker.pkg.dev/hackathon-primestep-02/sastra/sastra-app:BUILD_ID`.
It builds only and does not deploy or change IAM.

For manual submission from Cloud Shell:

```bash
gcloud builds submit . --config=cloudbuild.app.yaml --ignore-file=.gcloudignore.app --project=hackathon-primestep-02 --region=asia-southeast2
```

The original `.gcloudignore` includes frontend sources only, so **the explicit
`--ignore-file` above is required** for the combined build.

At deployment, use the existing runtime service account
`hackathon-runtime@hackathon-primestep-02.iam.gserviceaccount.com`, with the existing
Agent Platform User (`roles/aiplatform.user`) access, and the environment values
listed above. Cloud Run obtains ADC from its attached identity. Its IAM/model
request was subsequently verified in Cloud Run. Deployment details and live checks
are recorded in [CLOUD_RUN_DEPLOYMENT.md](CLOUD_RUN_DEPLOYMENT.md).

The combined image builds React in API mode with same-origin `/api/v1`. Setting a
Cloud Run runtime VITE variable does not change a previously built frontend.
SPA routes such as `/reports` return the UI; unknown `/api/...` routes return JSON 404.

### Prototype limits

The workspace is a single shared teacher/class prototype with no production login.
Keep the Cloud Run service authenticated and use synthetic data. SQLite and image
blobs live in `backend/data/workspace.sqlite3` (override `SASTRA_WORKSPACE_DB`). This
is durable across local restarts, but Cloud Run's writable container storage is
ephemeral and separate between instances. Use managed shared persistence and teacher
authorization before real student data or multi-instance deployment. Max instances
1 alone does not make container files durable.

## Verification

```powershell
.\backend\.venv\Scripts\python.exe -m pip install -r backend/requirements-dev.txt
.\backend\.venv\Scripts\python.exe -m unittest discover -s backend/tests -v
```

Contract tests replace the model with an explicit stub and use temporary SQLite.
SDK tests use the real Google SDK serializer with an HTTP mock transport. They
verify request shape, image/PDF bytes, approval/version rules, failure handling and
report provenance; they do **not** prove live Vertex access. Also run frontend
`npm test`, `npm run format:check` and `npm run build`.

### Initial local results, 21 October 2026 (before cloud deployment)

- 17 backend/SDK tests passed (including two concurrent saves of one grade version).
- 7 frontend domain tests, Prettier and TypeScript/Vite build passed.
- Combined Linux/amd64 image built with Node 22, Python 3.12 and google-genai 2.32.0.
- Container ran on `PORT=9090`: `/healthz` and `/reports` returned 200;
  unknown `/api/v1/...` returned JSON 404; AI generation without ADC returned 503.
- Browser on port 3001 loaded the server workspace and displayed the missing-ADC
  error without adding a generated material. Console error/warning capture was empty.
- No live SDK call, Cloud Build submission, service-account permission change or
  Cloud Run deployment was performed by the local agent.

Sources: [Google Gen AI SDK](https://googleapis.github.io/python-genai/),
[Gemini 3.8 Flash guide](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/guides/gemini-3-8-flash),
[ADC setup](https://docs.cloud.google.com/docs/authentication/set-up-adc-local-dev-environment).
