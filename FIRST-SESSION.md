# IlluminateMyGallery — first Claude Code session brief

Project: IlluminateMyGallery (Illuminate Studios)
Repo: github.com/techcorp-DevApps/IlluminateMyGallery (branch `main`)
Local: ~/kingdom/projects/illuminate-my-gallery (tracked in Kingdom; registered slug `illuminate-my-gallery`)
Stack: FastAPI (backend) + Vite/React 19 + Tailwind + shadcn/ui (frontend). Deployed on Railway.

## Status

The app **builds and deploys successfully but is not currently viewable** — rendering/
serving issue to diagnose. The Vite migration (from CRA) has landed and the production
build is green (`npm run build` → `build/`, 2958 modules). Both you (via this Kingdom
checkout) and an external Codex workflow push to this repo, so the history advances from
both sides.

## ALWAYS do first, every session

```bash
git pull --ff-only origin main        # repo is worked from two sides — stay current
```
If a pull ever refuses to fast-forward, stop and reconcile; do not force.

## Authoritative context — READ THESE BEFORE ACTING

1. `frontend/docs/design-system-audit-workplan.md` — design-system audit + non-breaking
   alignment work plan. The plan of record for the design-system task.
2. `test_reports/full_scale_infra_assessment_2026-05-27.md` — full-scale MongoDB Atlas +
   Cloudflare R2 assessment. The plan of record for storage/DB integration.
3. `.automate-dev/DECISION-RECORD.md` — living architecture/decision record; open image-
   security decisions (Pattern A vs B, watermarking, download gating) are noted here.
4. `design-system/` — design groundwork already in the repo (tokens, foundations,
   components, patterns, brand assets). Reconcile against the audit work plan before
   creating anything new; do not duplicate.

## Urgent tasks for this session (in priority order)

### 1. Design system — align per the audit work plan
Read `frontend/docs/design-system-audit-workplan.md` and the existing `design-system/`
tree first. Execute the plan's non-breaking alignment steps. Constraint: **no breaking
changes** to existing rendered UI without explicit approval; the work plan is explicitly
"non-breaking alignment," so honour that.

### 2. Storage / DB integration — MongoDB Atlas + Cloudflare R2
Read `test_reports/full_scale_infra_assessment_2026-05-27.md` first; implement the
integration it specifies. Resolve the open image-security decision in the DECISION-RECORD
(Pattern A vs B) before building image storage/serving, since it determines the R2 access
model.

### Likely related: "builds but not viewable"
The serving/render fault may intersect both tasks (CORS, Vite `allowedHosts`, or asset/
image serving via R2). Recent commits already touched CORS and `allowedHosts`; verify the
deployed frontend can reach the backend and load assets before assuming a code bug.

## How to work

- Use the `automate-dev` skill (build → review → test → fix, with quality gates) for each
  task. Invoke `/automate-dev` and scope it to ONE task at a time.
- Verify by actually running it — `npm run build`, boot the dev server, hit the endpoints —
  not by asserting. The build being green is necessary but not sufficient (it builds yet
  isn't viewable).
- Backend: `cd backend && pip install -r requirements.txt` (dev: `requirements-dev.txt`),
  env per `backend/.env.example`. Frontend: `cd frontend && npm install`, then
  `VITE_BACKEND_URL=<backend-url> npm run dev`.
- Commit on a branch, build-verify, then merge to main and push. Do not push unverified.
- Secrets live in env files (gitignored) — never commit R2 keys or the Atlas URI.

## Out of scope unless asked
Railway infra/deploy settings (root dirs, service config) are configuration, not code —
flag them, don't change them silently.
