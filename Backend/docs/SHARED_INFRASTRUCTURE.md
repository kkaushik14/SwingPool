# Shared Infrastructure Reference

## Core Modules

- Config: `src/config`
- Database + seeds: `src/database`
- Middleware stack: `src/middlewares`
- Error taxonomy: `src/errors`
- Shared utilities: `src/utils`
- Logging: `src/logger`
- Background workflows: `src/jobs`
- OpenAPI base: `src/docs/openapi.base.js`
- Stripe operational flow reference: `docs/STRIPE_WEBHOOK_FLOW.md`
- Jobs runbook: `docs/JOBS_RUNBOOK.md`

## Auth Foundation Modules

- Auth sessions + action tokens + revocation model: `src/components/auth/auth.model.js`
- Auth orchestration service: `src/components/auth/auth.service.js`
- User/profile verification orchestration: `src/components/users/users.service.js`
- Subscription orchestration with lifecycle/history/proration: `src/components/subscriptions/subscriptions.service.js`
- Persisted audit stream: `src/components/audit/*`

## Reusable Helper Areas

- Pagination: `resolvePagination`, `buildPaginationMeta`
- Sorting: `resolveSorting`
- Filtering: `buildMongoFilters`
- IST dates: `toISTDateTimeString`, `startOfISTDay`, `endOfISTDay`
- Money math: `addMoney`, `subtractMoney`, `multiplyMoney`, `divideMoney`, `toMinorUnits`, `fromMinorUnits`
- Webhook signatures: `verifyStripeWebhookSignature`, `verifyHmacSignature`
- Idempotency: middleware + in-memory store service
- Payment reconciliation primitives: webhook event store + immutable payment ledger + timeout processor
- Notification provider abstraction: `notificationProviderService` (`log`/`noop` adapters)
- Job execution observability: `JobExecution` records + scheduler correlation ids

## Admin Bootstrap Paths

- Seed admin (non-production):
  - `ADMIN_BOOTSTRAP_EMAIL=<email> [ADMIN_BOOTSTRAP_PASSWORD=<strong password>] npm run seed`
- Rotate admin credentials (non-production):
  - `ADMIN_ROTATE_EMAIL=<email> ADMIN_ROTATE_PASSWORD=<new strong password> npm run rotate:admin-password`

## Import Hygiene

- Every shared folder exposes an `index.js` barrel export.
- Prefer importing from folder barrels instead of deep relative paths, except where direct imports prevent circular dependencies.
