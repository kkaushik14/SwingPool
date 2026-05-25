# Swing Pool Backend Architecture

## Stack

- Runtime: Node.js (ESM)
- Framework: Express 5
- Database: MongoDB with Mongoose + retry-aware connection module
- Auth: JWT access/refresh flow with refresh rotation + token denylist revocation
- Payments: Stripe SDK + webhook-source-of-truth reconciliation + immutable ledger + mock fallback mode
- Validation: Zod
- Logging: Pino + pino-http + dedicated audit logger + persisted audit model
- Background workflows: in-process scheduler + idempotent job runner + persistent execution logs
- API Docs: Swagger/OpenAPI (`/api-docs`, `/api-docs.json`)
- Testing: Vitest with shared bootstrap
- API Clients: generated Postman collection (`docs/postman/Swing-Pool-Backend.postman_collection.json`)

## Configuration Model

- `src/config/env.schema.js` validates all required environment variables.
- `src/config/environments/*` defines per-environment overrides (`development`, `test`, `production`).
- `src/config/app.config.js` composes base settings + environment overrides into immutable `config`.
- Runtime modules consume `config` instead of raw `process.env`.

## Layered Structure

- `src/app`: Express app composition and middleware bootstrap.
- `src/server`: process startup, graceful shutdown, fatal signal handling.
- `src/config`: env schema, typed config, environment overrides.
- `src/database`: Mongo connection lifecycle, health, seeds framework.
- `src/components/auth`: registration, login/logout, refresh rotation, email verification, forgot/reset password, token persistence.
- `src/components/users`: user profile completion, verification status, admin verification, eligibility gating DTOs.
- `src/components/subscriptions`: admin-managed plans/coupons/config, lifecycle state machine, proration upgrades, cancellation events, grace transitions, subscription history.
- `src/components/payments`: payment attempts, Stripe event processing, retry/timeout handling, webhook event store, immutable payment ledger.
- `src/components/charities`: charity catalog, user selection history, contribution rules, donation intents, immutable charity allocation ledger, payout tracking, reporting aggregates.
- `src/components/scores`: immutable user submissions, admin-audited corrections, full score history, and latest-five qualifying competition eligibility views.
- `src/components/draws`: monthly draw configuration, snapshots, entries, simulations, immutable publication, prize pool snapshots, and jackpot rollover ledger.
- `src/components/winners`: winner lifecycle, proof submissions, verification outcomes, and payout workflow states.
- `src/components/admin`: single-role admin control plane that orchestrates cross-domain operations, manual overrides, and strict audit metadata capture.
- `src/components/reports`: admin analytics APIs with filterable and paginated operational reports plus summary views designed for export-ready evolution.
- `src/components/audit`: persisted audit event model/repository/service.
- `src/routes`: API versioning and route aggregation.
- `src/middlewares`: request id, auth/roles, sanitization, idempotency, validation, not found, centralized errors.
- `src/services`: cross-cutting services (JWT, Stripe, audit, idempotency store).
- `src/jobs`: scheduler, idempotent job runner, job execution model, and recurring operational workflows.
- `src/utils`: shared helpers (response contract, pagination, sorting, filtering, IST dates, money math, webhook signatures).
- `src/docs`: OpenAPI base contract + generated swagger setup.
- `scripts/*`: developer tooling for lint/type checks, OpenAPI coverage checks, OpenAPI export, and Postman generation.

## Auth + Profile Verification Lifecycle

1. User registers and receives JWT token pair.
2. User account starts as `pending_verification`.
3. Email verification token is generated and must be confirmed.
4. User completes profile fields; completion status transitions to `completed`.
5. Admin verifies profile (`verified` or `rejected`).
6. User status becomes `verified` only when:
   - email is verified
   - profile is completed
   - profile verification status is `verified`
7. Subscription activation is blocked until this verified state is satisfied.

## Token Security Design

- Access and refresh tokens include `jti`, `sessionId`, and `tokenType` claims.
- Refresh token rotation revokes prior refresh token jti and prior session.
- Access token denylist supports explicit revocation on logout.
- One-time action tokens power email verification and password reset.
- Password reset revokes all active refresh sessions for that user.

## Subscription Lifecycle Design

1. Plans are stored in Mongo and seeded with defaults:
   - Monthly: INR 179, 30 days
   - Quarterly: INR 499, 90 days
   - Yearly: INR 1999, 365 days
2. Plan prices and active state are admin-editable through plan management APIs.
3. Subscription config is centralized and admin-editable:
   - `gracePeriodDays`
   - `mandatoryCharityPercentage`
   - `currency`
4. Create subscription starts in `pending_payment` and stores pricing snapshots.
5. Subscription becomes `active` only after:
   - payment confirmation succeeds
   - user profile eligibility checks pass (`eligibleForSubscription=true`)
6. Cancellation is immediate and writes both:
   - subscription status transition (`canceled`)
   - cancellation event record
7. Renewal failure transitions `active -> grace_period` with configurable grace end date.
8. Grace expiry processor transitions `grace_period -> expired` and records history.
9. Upgrade policy is strictly upward only:
   - `monthly -> quarterly|yearly`
   - `quarterly -> yearly`
   - downgrades and same-plan switches are rejected.
10. Upgrade proration computes unused value by remaining cycle time and charges only the prorated difference.
11. Subscription history is append-only and captures lifecycle and audit-friendly metadata.

## Charity Allocation Design

1. Charity selection is versioned over time (`effectiveFrom`/`effectiveTo`) so users can change future preference without mutating historical records.
2. Subscription creation now requires an active selected charity so mandatory allocation has a concrete destination.
3. Allocation formula is deterministic per successful subscription payment:
   - gateway fee is deducted first from subscription base amount.
   - prize pool is 35% of post-fee subscription base (configurable).
   - mandatory charity is 10% of post-fee subscription base (configurable).
   - optional add-on donation is passed through 100% to charity.
   - remaining amount is platform revenue.
4. Allocation records are append-only in `CharityAllocationLedger` with immutable middleware guards.
5. Independent donations reuse the same payment intent + webhook flow via `sourceDomain=charity_donation`.
6. Charity payout operations are tracked in payout ledger entries and summarized with reporting aggregates.

## Score Qualification Design

1. Score submissions are stored as immutable user-origin records with explicit submission timestamp.
2. Backdated records are detected by local submission date comparison and excluded from competition qualification.
3. Competition uses only latest five qualifying scores ordered by submission timestamp.
4. Duplicate contest numbers are rejected if they would appear within the latest five qualifying window.
5. Admin correction endpoints can update score fields with mandatory audit metadata while preserving submission chronology.

## Draw And Winner Design

1. Draw snapshots are month-scoped (`YYYY-MM`) and store cutoff, draw day, and prize pool snapshot timestamps.
2. Entry generation is automatic and capped at exactly one entry per eligible user per month.
3. Eligibility requires:
   - active subscription started before the final-7-day cutoff,
   - not lapsed on draw day,
   - five qualifying score values used as contest numbers.
4. Draw mode is currently random, with service boundaries prepared for future algorithmic mode.
5. Admin simulations are unlimited and side-effect free.
6. Draw publication is immutable and writes:
   - published winning-number result,
   - winner records,
   - prize pool accounting snapshot,
   - jackpot rollover ledger entries.
7. Prize pool logic:
   - subscription prize pool is based on 35% post-fee contribution stream,
   - 5-match jackpot rolls over uncapped when unclaimed,
   - unclaimed 3-match and 4-match buckets move to company revenue.
8. Winner proof flow supports:
   - deadline at 23 days post publication,
   - maximum 2 files per submission,
   - rejection reason requirements,
   - resubmission prior to deadline.
9. Payout lifecycle states are `pending_verification`, `approved`, `rejected`, `payout_pending`, and `paid`.

## Stripe Webhook Reconciliation Design

1. Payment attempts are persisted before client-side confirmation.
2. Webhook endpoint verifies Stripe signatures from raw request payload.
3. Webhook events are de-duplicated by unique `stripeEventId` records.
4. Payment status transitions are idempotent and replay-safe.
5. Immutable ledger entries are appended for each monetary lifecycle event.
6. Timeout processor marks stale in-flight attempts as `timeout`.
7. Delayed webhook success can reconcile `timeout -> succeeded`.
8. Subscription activation/failure is finalized from persisted webhook-driven payment state, not client callbacks.
9. Charity donation/allocation reconciliation is executed in webhook and timeout processors with idempotent ledger keys to avoid duplicate accounting.

## Admin Control And Auditability Design

1. `/admin` is the centralized control API for users, plans, coupons, subscriptions, payments, charities, donations, scores, draws, winners, proofs, and payouts.
2. Sensitive admin operations require an explicit business reason in request payloads.
3. Every admin action emits an audit event with:
   - actor id and role
   - action key
   - target entity and entity id
   - request correlation id
   - before/after snapshots when practical
   - reason metadata for sensitive operations
4. Manual adjustment APIs are constrained to approved mutable fields to protect immutable ledger/accounting records.
5. Admin report views are also audit logged for traceability of operational access.

## Reporting Design

1. `/reports` exposes admin-only operational analytics for:
   - users and verification
   - subscriptions, churn, and plan mix
   - payment outcomes
   - charity totals and payout flow
   - draw stats, prize pools, jackpot rollover
   - winner and payout state progression
2. Report endpoints support filters and date ranges.
3. Detail reports use pagination to remain scalable.
4. Every detail report returns both item-level rows and summary aggregates to support future CSV/Excel export without redesigning core query boundaries.

## Notification & Background Workflow Design

1. Notifications are event-driven with provider abstraction:
   - in-app records for frontend consumption,
   - delivery records for email/sms observability and retry analysis.
2. Provider bindings are swappable via configuration (`log`/`noop` adapters by default).
3. Duplicate suppression uses deterministic dedupe keys and unique indexes on delivery records.
4. Required events are covered end-to-end:
   - signup verification
   - payment success/failure
   - renewal reminder
   - grace-period warning
   - subscription expiry
   - draw published
   - winner selected
   - proof rejected
   - payout completed
5. Recurring jobs are scheduled in-process and recorded in `JobExecution` with:
   - `jobName`, `runKey`, `correlationId`, timing, result, and failure metadata.
6. Scheduler safety controls:
   - per-job overlap guards (`inFlight`)
   - idempotent run keys (`jobName + runKey`)
   - graceful shutdown stop hooks.
7. Operations details and cadence matrix live in [`docs/JOBS_RUNBOOK.md`](./JOBS_RUNBOOK.md).

## Developer Workflow

- `npm run dev`: local development server with hot reload.
- `npm run seed`: run non-production seeders.
- `npm run lint`: formatter-based lint checks.
- `npm run typecheck`: syntax/type sanity checks across source and tests.
- `npm test`: execute unit/integration/edge-case tests.
- `npm run openapi:check`: verify all routes are represented in OpenAPI.
- `npm run openapi:export`: write `docs/openapi.json`.
- `npm run postman:generate`: regenerate `docs/postman` collection.
- `npm run build`: quality gate (`lint + typecheck + tests + OpenAPI check + Postman generation`).
- `npm run start:prod`: production-mode backend start command.

## Scalability Notes

- Domain-first components isolate bounded contexts for team parallelism.
- Repository boundary keeps persistence adaptable.
- Seed framework allows controlled non-production bootstrap and rotation flows.
- Barrel exports keep import ergonomics clean at scale.

## Hardening Pass Notes

- Centralized duplicated business-rule mapping logic:
  - domain subscription status -> user subscription status (`src/components/subscriptions/subscription-status.mapper.js`)
  - payment state -> ledger entry / ledger direction / donation status (`src/components/payments/payments.mappers.js`)
- Consolidated notification fire-and-forget dispatch behavior into one reusable helper:
  - `src/components/notifications/notifications.dispatcher.js`
  - removed repeated per-service catch/log wrappers in auth, subscriptions, draws, winners, and payments.
- Centralized shared duration parsing in:
  - `src/utils/duration.js`
  - reused by config and auth token/action expiry logic.
- Standardized shared constants:
  - default payment currency now aligned to INR (`DEFAULT_CURRENCY=inr`, `DEFAULT_CURRENCY_CODE=INR`)
  - shared day constant (`DAY_IN_MS`) reused across services/jobs/seeds.
- Improved security logging posture:
  - Mongo connection logs now redact credentials before output.
- Added targeted query-path indexes for hot operational flows:
  - payment reconciliation (`state + updatedAt`)
  - subscription reminder/grace windows (`status + autoRenew + nextBillingAt`, `status + gracePeriodEndsAt`)
  - draw execution due queries (`status + drawAt`)
  - charity allocation reporting (`entryType + occurredAt`)
  - winner deadline enforcement (`payoutStatus + verificationDeadlineAt`)
- Added regression tests for centralized mapper behavior and duration parsing to lock business rule consistency.
