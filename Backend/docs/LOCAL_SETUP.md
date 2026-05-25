# Local Backend Setup

## Prerequisites

- Node.js 20+ (project currently runs in ESM mode)
- npm 10+
- MongoDB (local or remote)

## 1. Install

```bash
npm install
```

## 2. Configure Environment

```bash
cp .env.example .env
```

Required values to review before first run:

- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`
- Stripe settings:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_MOCK_MODE`
- Jobs settings:
  - `JOBS_ENABLED`
  - interval and lead-time values

Local frontend integration defaults:

- API base URL: `http://localhost:4000/api/v1`
- Swagger UI: `http://localhost:4000/api-docs`
- Recommended `CORS_ORIGIN`: `http://localhost:3000,http://localhost:5173`

## 3. Seed Data

Default seed execution:

```bash
npm run seed
```

Optional demo dataset (non-production only):

```bash
SAMPLE_SEED_ENABLED=true SAMPLE_SEED_SOURCE_PATH=.local/sample-seed.json npm run seed
```

Recommended approach:

- keep demo credentials in a local-only JSON source file such as `.local/sample-seed.json`
- point `SAMPLE_SEED_SOURCE_PATH` to that file from `.env.local` or `.env.development.local`
- do not commit real or shared dummy credentials into repo-tracked seed logic

Optional admin bootstrap:

```bash
ADMIN_BOOTSTRAP_EMAIL=admin@example.com ADMIN_BOOTSTRAP_PASSWORD='StrongPassword@12345' npm run seed
```

If `ADMIN_BOOTSTRAP_PASSWORD` is omitted, the seed logs a generated one-time password and marks the admin account for forced rotation after first login.

Rotate admin credentials:

```bash
ADMIN_ROTATE_EMAIL=admin@example.com ADMIN_ROTATE_PASSWORD='NewStrongPassword@12345' npm run rotate:admin-password
```

Optional seed filtering:

```bash
SEEDS=default-charities-seeder,admin-user-seeder npm run seed
```

## 4. Run

Development:

```bash
npm run dev
```

Production-style start:

```bash
npm run start:prod
```

## 5. Quality Checks

Lint:

```bash
npm run lint
```

Type/syntax checks:

```bash
npm run typecheck
```

Tests:

```bash
npm test
```

Build gate (lint + typecheck + tests + API checks + Postman generation):

```bash
npm run build
```

## API Docs and Postman

Swagger UI:

- `http://localhost:4000/api-docs`

Export OpenAPI JSON:

```bash
npm run openapi:export
```

Generate Postman collection:

```bash
npm run postman:generate
```

Output file:

- `docs/postman/Swing-Pool-Backend.postman_collection.json`
