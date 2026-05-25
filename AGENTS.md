# AGENTS

## Repository Workflow

- `development` is the long-lived integration branch for day-to-day work.
- Always create `feature/*` branches from `development` for new feature work.
- Merge completed `feature/*` branches back into `development` first.
- Never merge `development` directly into `main`.
- Promote production-ready changes to `main` through a curated release flow:
  - either cherry-pick the production-safe commits onto `main`
  - or prepare a dedicated `release/*` branch from `main` and merge that
- After a feature has been safely promoted to `main`, delete the local `feature/*` branch.

## Production Boundary For `main`

- Keep `main` production-clean.
- Development-only and testing-only assets must stay out of `main`.
- Current development-only paths include:
  - `Backend/tests`
  - `Backend/docs`
  - `Backend/.env.example`
  - `Backend/vitest.config.js`
  - `Frontend/tests`
  - `Frontend/docs`
  - `Frontend/.env.example`
- Keep runtime and build-required files in `main`, including app source, package manifests, frontend build config, and backend runtime OpenAPI source under `Backend/src/docs`.

## Working Rule

- If a request changes product code, start by creating a `feature/*` branch from `development`.
- If a request is only about promoting production-safe code, work from `main` using a curated release path instead of merging `development`.
