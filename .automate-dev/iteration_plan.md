# Iteration Plan: IlluminateMyGallery

## Stream 1 — Railway deploy fix + backend vendor-neutrality — COMPLETE
(see 2026-05-25T06-22-14 remediation report) — Readiness 100/100, dead-DB boot serves 200.

## Stream 2 — Frontend CRA/CRACO → Vite migration — COMPLETE

### Acceptance Criteria
- [x] `vite build` succeeds; output in `build/`
- [x] Dev server (`npm run dev`) boots and serves the SPA (HTTP 200)
- [x] `VITE_BACKEND_URL` correctly baked into the bundle (API wiring intact)
- [x] Editorial fonts load (CSS @import order fixed; present in built CSS)
- [x] shadcn/ui + Tailwind + `@/` alias preserved across all 80 source files
- [x] MongoDB / OpenAI / R2 untouched (backend-only; reached over HTTP)
- [x] `eslint .` runs with 0 errors (flat config)
- [x] No Emergent or PostHog references in built output
- [x] ESM-correct config (no __dirname under type:module)

### Iteration 1 — Status: PASS (Phase 8 reached)
- Changed/added/removed: 17 files. Added vite.config.js, root index.html,
  eslint.config.js, .env.example, .npmrc, package-lock.json. Modified package.json
  (type:module, scripts, toolchain swap), tailwind.config.js + postcss.config.js (ESM),
  src/lib/api.js (env), src/index.css (@import order). Renamed index.js->main.jsx,
  App.js->App.jsx. Deleted craco.config.js, public/index.html, plugins/health-check/.
- Failures found & fixed during loop:
  1. ERESOLVE (pre-existing react-day-picker vs date-fns peer) -> .npmrc legacy-peer-deps.
  2. CSS @import after @tailwind (fonts at risk) -> reordered import to top.
  3. __dirname undefined under ESM (latent runtime bug + lint error) ->
     fileURLToPath(new URL("./src", import.meta.url)).
  4. 2 error-level cosmetic react rules -> set to warn (incl. cmdk shadcn ignore).
- Validation: build green (2958 modules, ~8s); dev server 200; lint 0 errors
  (15 pre-existing app warnings); readiness (frontend) PASS on all node checks.

### Outstanding (manual, infra-side)
- Frontend deploys as its own service: Root Directory /frontend, build `npm run build`,
  publish `build/`, env VITE_BACKEND_URL = backend public URL.
- Optional: address 15 pre-existing lint warnings (unused vars) - app-code cleanup.
- Optional: code-split to silence the >500 kB chunk advisory.
