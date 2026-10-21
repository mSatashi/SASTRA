# Cloud Run deployment — 21 October 2026

## Deployed service

- Project: `hackathon-primestep-02`.
- Service: `sastra-workspace`, region `asia-southeast2`.
- URL: https://sastra-workspace-1022738196904.asia-southeast2.run.app
- Canonical URL: https://sastra-workspace-lh2w4q6cna-et.a.run.app
- Revision: `sastra-workspace-00001-gqf`, Ready, serving 100% of traffic.
- Source commit: `1d157b0413f8484faf28a09890c05df6aca354c5` on
  `feat/vertex-workspace-integration`. `main` was not changed or merged.
- Cloud Build: `35cc104e-3191-4362-83b7-211671cfc5b6`, SUCCESS.
- Image digest: `asia-southeast2-docker.pkg.dev/hackathon-primestep-02/sastra/sastra-app@sha256:abfcc3ae043ccb3403c23fbcb34baa488900175069ff6c8fb4fdc7926aab149e`.
- Runtime identity: `hackathon-runtime@hackathon-primestep-02.iam.gserviceaccount.com`.
- Resources: 1 CPU, 512 MiB, revision max instances 1, minimum instances 0,
  concurrency 8, request timeout 300 seconds, container port 8080.

The combined image serves FastAPI and the React UI in API mode at the same origin.
Runtime variables: `LLM_PROVIDER=gemini`, `GEMINI_AUTH_MODE=vertex`,
`GCP_PROJECT=hackathon-primestep-02`, `GCP_LOCATION=global`,
`GEMINI_MODEL=gemini-3.8-flash`. No API key or downloaded service-account key was used.

The source archive contained 46 allowed code/config files (310.2 KiB uncompressed).
The actual Cloud SDK ignore matcher confirmed that `.env`, credentials, database
files, virtual environments, local dependencies and unrelated workflow documents
were excluded. The build was submitted manually using `cloudbuild.app.yaml` and
`.gcloudignore.app`; no GitHub trigger was changed and auto-deployment was not added.

## Access

The service requires IAM authentication. No public `allUsers` grant was added.
An unauthenticated request to `/api/v1/status` returned 403. The existing deploying
user could access it through the official Cloud Run proxy.

To connect the local Vite API-mode preview (its `/api` proxy targets port 8000):

```powershell
gcloud run services proxy sastra-workspace --project=hackathon-primestep-02 --region=asia-southeast2 --port=8000
```

Keep that terminal open, and use http://127.0.0.1:3001 while the existing API-mode
Vite process runs. The local FastAPI process on port 8000 was stopped and replaced
by this authenticated proxy; browser requests now reach the deployed backend.

To browse the complete cloud-hosted UI without running Vite:

```powershell
gcloud run services proxy sastra-workspace --project=hackathon-primestep-02 --region=asia-southeast2 --port=3002
```

Then open http://127.0.0.1:3002. Both proxy processes were left running after
verification. They use the active gcloud account and must be restarted after closing
their terminal/process. This local proxy does not make the service public.

## Live verification

These checks used the deployed service and its runtime identity, with synthetic
students/documents. They were not mocked model calls:

1. `/api/v1/status` returned 200 with Vertex mode, the correct project/model/location,
   `clientConfigured=true`, and after inference `lastRequestSucceeded=true`.
2. Content generation returned a fotosintesis module, a PG question, an essay,
   answer keys and rubrics. Teacher approval changed its status to APPROVED.
3. A synthetic PNG answer sheet was uploaded through the cloud-hosted browser UI.
   Vision transcribed both answers and proposed 25/25 and 25/25. The original image
   downloaded from the asset endpoint matched the uploaded bytes exactly.
4. The grade remained pending until the review checkbox and teacher approval were
   submitted. The gradebook then showed one approved assessment with average 100.
5. Report generation produced a narrative from that approved evidence, explicitly
   noting that a single assessment is insufficient to infer a learning trend.
6. Teacher review/finalization produced report version 2 with FINAL status,
   average 100 and its source snapshot. The final text report was downloaded.
7. `/` and `/reports` returned 200, and the browser showed no captured console
   warnings/errors. The public edge returned 404 for `/healthz`; use the authenticated
   `/api/v1/status` endpoint for the verified external status check. Container-local
   `/healthz` was verified separately before deployment; the Cloud Run startup
   readiness check uses its container TCP port.

Ignored local evidence is in `docs/qa/cloud-run-live-evidence.json`,
`docs/qa/cloud-run-final-report.png`, and the synthetic PNG fixture in `docs/qa/`.

## Data limits

This is still a single-class prototype with a sample roster and no teacher account
system. SQLite and uploaded images are stored in the instance filesystem. A Cloud
Run restart/replacement may lose those files; scale-to-zero is enabled. Use only
synthetic data until shared durable storage and teacher authorization are implemented.
Do not treat a one-instance limit as durable storage.

The live verification intentionally left one clearly named synthetic deployment
assessment and its report in the current running instance. No real student data
was uploaded.

For subsequent builds, see [VERTEX_INTEGRATION.md](VERTEX_INTEGRATION.md). The deployed
code is pinned to the source commit above; later documentation-only commits do not
require a new image.
