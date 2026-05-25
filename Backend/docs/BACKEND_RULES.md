# Backend Business Rules

## Platform Rules

- Swing Pool backend supports users, subscriptions, payments, charities, scores, draws, winners, notifications, admin, and reports as independent components.
- Backend remains API-versioned and component-driven to support safe growth.

## Auth & Identity Rules

- Registration, login, logout, refresh rotation, email verification, forgot password, and reset password are mandatory auth flows.
- Access token and refresh token payloads include `tokenType`, `jti`, and `sessionId`.
- Refresh tokens are single-use per rotation cycle and revoked after refresh.
- Revoked token denylist is checked on authenticated routes.
- Password reset invalidates all active refresh sessions.

## Profile Verification Rules

- Users begin in `pending_verification`.
- Email verification updates account progression but is not alone sufficient for full verification.
- Profile completion and admin profile verification are tracked independently.
- Subscription activation is allowed only when the user is fully verified:
  - `user.status === verified`
  - email is verified
  - profile completion is `completed`
  - profile verification status is `verified`

## Subscription & Billing Rules

- Default plans are Monthly (INR 179), Quarterly (INR 499), and Yearly (INR 1999), but values are admin-editable.
- Plans are config-driven and future plans can be added without changing core service boundaries.
- Coupons are optional, admin-managed, and support both percentage and flat discounts with redemption constraints.
- Subscription creation starts in `pending_payment`; activation occurs only after successful payment confirmation.
- Activation additionally enforces profile verification eligibility at confirmation time.
- Cancellation is immediate and final for that subscription record (`status=canceled`, `endAt=now`, `autoRenew=false`).
- Failed renewal transitions subscription to `grace_period` for configurable `gracePeriodDays` (default 7).
- Grace period expiration transitions `grace_period -> expired`.
- Upgrade paths are one-way only:
  - `monthly -> quarterly|yearly`
  - `quarterly -> yearly`
  - reverse downgrade is not allowed.
- Upgrade charges use time/value proration from unused current-cycle value.
- Mandatory charity contribution percentage is configurable and snapshot-stored on subscription creation (default 10% of post-fee base).
- Subscription creation requires a selected active charity because mandatory charity allocation cannot be unassigned.
- All major lifecycle transitions write subscription history records and audit logs.

## Charity & Accounting Rules

- Currency is INR for now, but charity data models are structured to support future currency extensions.
- Users can change their charity preference only for future payments; historical payment-linked records are never rewritten.
- Contribution rule percentages are centrally configurable by admin:
  - `gatewayFeePercentage` (deducted first from subscription base),
  - `prizePoolPercentage` (default 35% of post-fee base),
  - `mandatoryCharityPercentage` (default 10% of post-fee base).
- Optional add-on donations are extra user-entered funds and are passed through 100% to charity.
- Platform revenue is computed as the residual amount after gateway fee, prize pool, and mandatory charity allocation from subscription base.
- Independent donations use the same payment infrastructure (`sourceDomain=charity_donation`) and webhook reconciliation path.
- Charity allocation ledger entries are immutable and append-only for reconciliation-grade accounting.
- Charity payout tracking is handled through payout ledger entries, including manual adjustments with audit logs.

## Score Competition Rules

- Every submitted score is retained in history; history records are never hard-deleted by normal workflows.
- Score payload requires:
  - `playedDate`
  - `value` between 1 and 45
  - `contestNumber`
- Future `playedDate` submissions are blocked.
- Backdated score rule (temporary): when `playedDate` is earlier than the submission local date, record is stored but excluded from competition qualification.
- User-submitted scores are immutable after confirmation; only admin edit paths may correct data.
- Admin edits are audit-logged with before/after snapshots and reason.
- Competition qualification uses only latest five qualifying submissions ordered by submission timestamp.
- Duplicate `contestNumber` values are not allowed within those five qualifying competition scores.
- Draw entry numbers are sourced from the qualifying score `value` fields (1..45).

## Monthly Draw Rules

- Draw mode for MVP is random only, with schema/service boundaries reserved for future algorithmic mode.
- Valid draw number range is 1..45 with unique numbers per draw.
- Monthly, quarterly, and yearly subscribers are treated equally for draw entry count.
- Each eligible user receives exactly one automatic entry per month.
- Eligibility cutoff is before the final 7 days of the month.
- Users lapsed on draw day are excluded from entry eligibility.
- Draw publication is immutable once completed.
- Admin may run unlimited simulations.

## Prize Pool And Jackpot Rules

- Prize pool stream is sourced from 35% post-fee subscription base contribution records.
- Snapshot moment may be month-end or draw-day depending on snapshot strategy.
- Initial jackpot starts at zero.
- Admin may add manual jackpot funds via ledgered adjustments.
- Unclaimed 5-match jackpot rolls over without cap.
- Unused 3-match and 4-match allocations move to company revenue.

## Winner Lifecycle Rules

- Winner payout statuses are:
  - `pending_verification`
  - `approved`
  - `rejected`
  - `payout_pending`
  - `paid`
- Proof submission deadline is 23 days after published result.
- Maximum 2 proof files per submission.
- Rejected proof requires rejection reason.
- Resubmission is allowed before deadline when proof/payout is rejected.

## Stripe Payment Processing Rules

- Stripe webhooks are the source of truth for final payment state.
- Client success/cancel callbacks are non-authoritative and cannot independently finalize payment state.
- Supported payment statuses: `processing`, `succeeded`, `failed`, `cancelled`, `timeout`, `retry_required`.
- Every Stripe webhook event is recorded and deduplicated by `stripeEventId`.
- Webhook processing must be idempotent and safe to replay without duplicate side effects.
- Monetary state changes append immutable payment ledger records.
- Amount/currency mismatches between webhook payloads and local records are flagged and moved to `retry_required`.
- Timeout processing marks stale pending attempts as `timeout`, while delayed Stripe success can still reconcile to `succeeded`.
- Subscription activation/failure transitions must be reconciled from persisted payment state updates.

## Notification Rules

- Notifications must support channel abstraction so email/sms implementations can be swapped without changing domain services.
- In-app notifications are persisted and exposed for frontend consumption.
- External channel deliveries (email/sms) are persisted with delivery status, provider metadata, and attempt timestamps.
- Duplicate suppression is mandatory:
  - notification events must use deterministic dedupe keys,
  - delivery rows are unique by dedupe key.
- Required event types:
  - `signup_verification`
  - `payment_success`
  - `payment_failure`
  - `renewal_reminder`
  - `grace_period_warning`
  - `subscription_expiry`
  - `draw_published`
  - `winner_selected`
  - `proof_rejected`
  - `payout_completed`

## Background Workflow Rules

- Recurring jobs are required for:
  - renewal reminders
  - grace-period checks
  - expiry enforcement
  - monthly draw preparation
  - draw execution/publication
  - winner-proof deadline enforcement
  - payment reconciliation for delayed/missing confirmations
- Every job run must be idempotent and safe to rerun using persistent `(jobName, runKey)` dedupe.
- Every run must be observable through structured logs + persisted execution records with:
  - correlation id
  - status
  - result summary
  - error details when failed
- Job scheduler must stop during graceful shutdown.
- Operational matrix and runbook are documented in `docs/JOBS_RUNBOOK.md`.

## Security & Reliability Rules

- Security baseline includes helmet, CORS, compression, rate limiting, request size limits, input sanitization.
- Correlation id (`x-request-id`) is attached to all responses.
- Graceful shutdown handles SIGINT/SIGTERM and fatal process errors.
- Mongo connection attempts use retry/backoff with explicit non-production fallback.

## Error & Response Contract Rules

- Typed error classes include validation, auth, payment, conflict, and domain failures.
- All API responses follow one contract:
  - Success: `success`, `message`, `data`, optional `meta`, `requestId`, `timestamp`
  - Error: `success`, `message`, `error.code`, `error.details`, `requestId`, `timestamp`

## Consistency & Reuse Rules

- Core cross-domain mapping logic must remain centralized:
  - subscription-domain status mapping to user subscription status
  - payment-state mapping to ledger entry types, ledger directions, and donation statuses
- Notification dispatch for domain events must use the shared dispatcher helper to keep duplicate suppression and failure logging behavior consistent.
- Duration string parsing logic must remain in one shared utility and be reused by config/auth flows.
- Shared money/time/currency constants must be sourced from centralized constants instead of repeated literals.

## Admin Governance Rules

- Admin role is singular (`admin`) and all privileged operations are restricted to admin-authenticated routes.
- Admin can manage users, profile verification, plans, coupons, subscriptions, grace handling, cancellations, payments, charities, donations, scores, draws, winners, proofs, payouts, and manual adjustments through `/admin` APIs.
- Sensitive operations must include a non-empty `reason` value.
- Every admin action must be audit logged with actor, action, target entity, request id, and before/after snapshots when feasible.
- Manual override endpoints are field-restricted to prevent unsafe mutation of immutable accounting histories.

## Reporting Rules

- Reports are admin-viewable now and designed for export later via stable summary + itemized contracts.
- Report coverage includes:
  - users
  - active subscriptions and churn
  - plan mix
  - payment outcomes
  - charity totals
  - prize pool and jackpot rollover
  - draw stats
  - winner and payout states
- Report endpoints support date filters.
- Detail report endpoints use pagination.

## API Contract & Tooling Rules

- Swagger/OpenAPI must cover every registered route path and method.
- OpenAPI route coverage is validated automatically (`npm run openapi:check`).
- OpenAPI JSON is exportable to `docs/openapi.json` (`npm run openapi:export`).
- Postman collection is generated from OpenAPI and stored at:
  - `docs/postman/Swing-Pool-Backend.postman_collection.json`
- Generated API artifacts must stay in sync with route changes.

## Developer Command Rules

- `npm run lint` must pass before merge.
- `npm run typecheck` (syntax/type sanity) must pass before merge.
- `npm test` must pass with unit, integration, and edge-case suites.
- `npm run build` is the full backend quality gate.
- `npm run dev`, `npm run seed`, and `npm run start:prod` are the canonical runtime commands.

## Admin Bootstrap & Rotation Rules

- Admin seed runs only when `ADMIN_BOOTSTRAP_EMAIL` is provided in non-production.
- Seeded admin credentials must be rotated immediately (`mustRotatePassword=true`).
- Admin credential rotation uses `npm run rotate:admin-password` with secure env vars.
- Optional sample/demo seed data runs only when `SAMPLE_SEED_ENABLED=true` in non-production.
