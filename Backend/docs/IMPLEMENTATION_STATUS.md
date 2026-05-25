# Implementation Status

## Complete

- Backend foundations:
  - layered architecture, config validation, DB retry + graceful shutdown, request correlation, security middleware, response contract.
- Auth + users:
  - registration, login/logout, refresh rotation, email verification, forgot/reset password, profile completion + verification gating.
- Subscriptions:
  - plans/coupons/config, lifecycle handling, cancellation, grace flow, upgrade proration, history tracking.
- Payments:
  - Stripe webhook source-of-truth, payment ledger, webhook dedupe, timeout and reconciliation flows.
- Charities:
  - charity selection history, contribution rules, split accounting, donation and payout ledgers.
- Scores:
  - immutable user submissions, admin edits with audit, latest-five qualification and duplicate contest checks.
- Draws + winners:
  - draw snapshots/simulations/publication, prize pool + rollover, winner proof lifecycle, payout progression.
- Notifications:
  - event-driven in-app + email/sms provider abstraction, delivery tracking, duplicate suppression.
- Background workflows:
  - scheduler, idempotent job runner, persisted job execution logs, rerun-safe periodic jobs.
- Admin + reports:
  - single-role admin operations, manual overrides, audit metadata capture, reporting endpoints.
- API/Dev tooling:
  - OpenAPI route coverage checks, OpenAPI export, generated Postman collection, local setup docs, build command gate.
- Final hardening + maintainability pass:
  - centralized duplicated domain mappers (subscription/payment/ledger/donation),
  - shared notification dispatcher for consistent event emission behavior,
  - shared duration parsing utility,
  - INR-aligned default payment currency constant,
  - DB credential-redacted connection logging,
  - additional hot-path Mongo indexes for reconciliation/reminders/draw deadlines/reporting,
  - mapper + duration regression tests.

## Assumptions Applied

- Currency baseline remains INR.
- Default payment currency fallback is INR (`inr`/`INR`) across payment + draw + notification flows.
- Notification provider defaults:
  - email provider `log`
  - sms provider `noop`
- Background scheduler runs in-process within API runtime (no external queue orchestrator).
- Optional sample data seeding is disabled by default and only enabled via `SAMPLE_SEED_ENABLED=true`.
- Type check is syntax/type-sanity (`node --check`) for JS codebase (no TypeScript compiler configured).

## Configurable Constants Requiring Business Confirmation

- Subscription grace period days (`SUBSCRIPTION_GRACE_PERIOD_DAYS`, default `7`).
- Mandatory charity percentage (`SUBSCRIPTION_MANDATORY_CHARITY_PERCENTAGE` / `CHARITY_MANDATORY_PERCENTAGE`, default `10`).
- Prize pool percentage (`CHARITY_PRIZE_POOL_PERCENTAGE`, default `35`).
- Gateway fee percentage (`CHARITY_GATEWAY_FEE_PERCENTAGE`, default `0`).
- Payment timeout minutes (`PAYMENT_ATTEMPT_TIMEOUT_MINUTES`, default `30`).
- Draw eligibility cutoff before month end (draw config default `7` days).
- Winner proof deadline days (draw config default `23` days).
- Max proof files (draw config default `2` files).
- Job intervals and lead windows:
  - renewal reminder interval + lead days
  - grace check interval + warning lead days
  - expiry enforcement interval
  - monthly draw preparation interval
  - draw execution interval
  - winner proof deadline check interval
  - payment reconciliation interval + lookback + batch size

## Remaining Work (Non-Blocking)

- Expand OpenAPI operation-specific request/response examples for every route (currently complete coverage with mixed detailed + auto-generated docs).
- Optional future: migrate lint/type checks to ESLint + TypeScript if/when TS adoption is confirmed.
