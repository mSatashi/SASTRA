# Cloud Run deployment — 21 October 2026

## Current public website

https://sastra-workspace-1022738196904.asia-southeast2.run.app

The React frontend and FastAPI API run together at this HTTPS origin. No local
Vite server, gcloud proxy or local Python process is needed to use the website.
Sign in with the shared team access code stored in Secret Manager
[`sastra-web-team-code`, version 1](https://console.cloud.google.com/security/secret-manager/secret/sastra-web-team-code/versions?project=hackathon-primestep-02).
The code is deliberately absent from this repository and the frontend bundle.
It is a hackathon team gate, not individual teacher accounts.

## Deployment record

- Project: `hackathon-primestep-02`.
- Service: `sastra-workspace`, region `asia-southeast2`.
- Canonical URL: https://sastra-workspace-lh2w4q6cna-et.a.run.app
- Ready revision: `sastra-workspace-00002-n6q`, serving 100% of traffic.
- Source commit: `69b578f` on `feat/vertex-workspace-integration`.
  `main` was not changed or merged.
- Cloud Build: `3bcd282a-fb3b-4fe5-9ddd-2da473c50bae`, SUCCESS.
- Image: `asia-southeast2-docker.pkg.dev/hackathon-primestep-02/sastra/sastra-app@sha256:de342fcf36ed952d0b69216a3aa03282717eab1cb28172e291941eccbdb5ad8c`.
- Runtime identity: `hackathon-runtime@hackathon-primestep-02.iam.gserviceaccount.com`.
- Resources: 1 CPU, 512 MiB, revision max instances 1, min instances 0,
  concurrency 8, request timeout 300 seconds, container port 8080.
- Environment: `LLM_PROVIDER=gemini`, `GEMINI_AUTH_MODE=vertex`,
  `GCP_PROJECT=hackathon-primestep-02`, `GCP_LOCATION=global`,
  `GEMINI_MODEL=gemini-3.8-flash`, `WEB_PUBLIC_MODE=true`.
- Secret binding: `WEB_ACCESS_CODE=sastra-web-team-code:1`.
  Vertex uses the runtime identity, without an API key or downloaded account key.

The Cloud SDK ignore matcher verified 48 allowed code/config files (319.7 KiB)
before upload. Environment files, credentials, local databases, dependencies,
virtual environments and unrelated documents were excluded. The manual build uses
`cloudbuild.app.yaml` and `.gcloudignore.app`; no automatic deployment trigger was
created or changed. Frontend formatting, 7 domain tests and the production build
passed locally and in Cloud Build. All 24 backend tests passed locally.

## Public access and API boundary

The guarded revision was first deployed with IAM authentication required. Its team
login, logout, API protection and Vertex configuration were verified before the
service was made public with `gcloud run services update --no-invoker-iam-check`.
This is the [documented Cloud Run public access method](https://docs.cloud.google.com/run/docs/authenticating/public).

- Static UI and `GET /api/v1/session` are publicly accessible.
- Workspace data, uploaded answers and model calls require a signed session.
- Login sets a Secure, HttpOnly, SameSite=Strict cookie lasting at most 8 hours.
- Incorrect codes return 401; 30 failed attempts within 5 minutes rate-limit login
  within the running process. This is not distributed abuse protection.
- Cross-origin browser API mutations return 403.
- Legacy `/api/...` configuration routes and API documentation return 404 in public mode.
- Missing/short access-code configuration fails closed with 503.
- Rotate the Secret Manager value and deploy its new version to invalidate sessions.
  Keep `WEB_PUBLIC_MODE=true` on every publicly accessible revision.

To return to IAM-only access:

```bash
gcloud run services update sastra-workspace --project=hackathon-primestep-02 --region=asia-southeast2 --invoker-iam-check
```

## Live public verification

Requests used the real HTTPS URL without Google IAM tokens or a local proxy:

1. `/`, `/reports` and session status returned 200. Anonymous dashboard access and
   an incorrect code returned 401; cross-origin login returned 403.
2. The correct code issued the secure session cookie and allowed dashboard access.
   Logout cleared access and returned the dashboard to 401.
3. Content generation created **Tes web publik - Fotosintesis** with the real
   `gemini-3.8-flash` model via the runtime service account. Status reported Vertex,
   `clientConfigured=true` and `lastRequestSucceeded=true`.
4. Browser sign-in opened the cloud-hosted dashboard. The content page displayed
   that generated module, questions, answer keys and rubric.

Ignored evidence: `docs/qa/public-web-live-evidence.json` and
`docs/qa/public-sastra-dashboard.png`.

The earlier IAM-private revision `sastra-workspace-00001-gqf` (build
`35cc104e-3191-4362-83b7-211671cfc5b6`, source `1d157b0`) also passed a complete
synthetic workflow: generate and approve material, upload a synthetic PNG, real
Vision transcription, teacher grade approval, report generation, finalization and
text download. Its proposed scores were 25/25 + 25/25, producing an approved average
of 100. The downloaded answer image matched the uploaded bytes. Those synthetic
records belonged to the earlier instance and were replaced with the new revision.

## Data limits

This remains a single shared classroom prototype with a sample roster. All team
code holders share its workspace. SQLite and uploaded images live in the instance
filesystem; a restart, replacement or scale-to-zero can lose them. Use synthetic
data until shared durable storage and individual teacher authorization exist.
A one-instance limit does not make container files durable. The latest deployment
check left one clearly named synthetic material draft for review.

For subsequent builds, see [VERTEX_INTEGRATION.md](VERTEX_INTEGRATION.md).
Documentation-only commits after the source commit above do not require a new image.
