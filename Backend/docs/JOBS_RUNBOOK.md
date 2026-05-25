# Background Jobs Matrix & Runbook

## Job Matrix

| Job                           | Purpose                                                                    | Idempotency Key                                                                   | Main Dependencies                                                                                                                                | Emits Notifications                                       |
| ----------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| `renewal_reminder`            | Warn active auto-renew subscribers before `nextBillingAt`.                 | `(jobName, runKey)` in `JobExecution` + per-subscription notification dedupe key. | `subscriptionsRepository.findRenewalReminderCandidates`, `notificationsService.dispatchEvent`                                                    | `renewal_reminder`                                        |
| `grace_period_check`          | Send warnings for subscriptions nearing grace end.                         | `(jobName, runKey)` + per-subscription warning dedupe key.                        | `subscriptionsRepository.findGracePeriodWarningCandidates`, `notificationsService.dispatchEvent`                                                 | `grace_period_warning`                                    |
| `expiry_enforcement`          | Transition expired grace-period subscriptions to `expired`.                | `(jobName, runKey)` + lifecycle state guards in service.                          | `subscriptionsService.processGracePeriodExpirations`                                                                                             | `subscription_expiry`                                     |
| `monthly_draw_preparation`    | Ensure current month draw snapshot exists and entries are generated.       | `(jobName, runKey)` + draw-month uniqueness.                                      | `drawsRepository.findByMonthKey`, `drawsService.createSnapshot`, `drawsService.generateEntries`                                                  | Indirect (entry generation does not notify)               |
| `draw_execution`              | Publish due draws and finalize winners/prize pools.                        | `(jobName, runKey)` + published draw immutability constraints.                    | `drawsRepository.findDueUnpublishedDraws`, `drawsService.publishDraw`                                                                            | `draw_published`, `winner_selected`                       |
| `winner_proof_deadline_check` | Enforce winner proof deadlines and reject overdue claims.                  | `(jobName, runKey)` + payout state transitions.                                   | `winnersService.enforceProofDeadlines`                                                                                                           | `proof_rejected`                                          |
| `payment_reconciliation`      | Process stale timeouts and reconcile delayed/missing Stripe confirmations. | `(jobName, runKey)` + payment/webhook/ledger idempotency keys.                    | `paymentsService.processTimedOutPayments`, `paymentsRepository.findReconciliationCandidates`, `paymentsService.reconcilePaymentIntentWithStripe` | `payment_success`, `payment_failure` (when state changes) |

## Runtime Model

- Scheduler starts from server bootstrap (`src/server/index.js`) when `config.jobs.enabled=true`.
- Each job uses `runIdempotentJob(...)` and writes a persistent `JobExecution` record.
- `JobExecution` includes:
  - `jobName`, `runKey`, `correlationId`, `requestId`
  - status lifecycle (`running`, `succeeded`, `failed`, `skipped`)
  - timing (`startedAt`, `finishedAt`, `durationMs`)
  - structured result and error fields
- Per-job overlap protection is enforced in-memory by scheduler `inFlight` guard.

## Correlation & Observability

- Every scheduled run has a correlation id propagated to downstream services as request context.
- Logs include:
  - job start, end, and failure events
  - duplicate/skip decisions
  - per-domain failures from downstream services
- Job execution history is queryable from `JobExecution` documents for reconciliation and audits.

## Operational Safeguards

- **Replay-safe dispatch:** Notifications and payment ledger/webhook processing use deterministic dedupe keys.
- **Source-of-truth consistency:** Payment finalization is still webhook/reconciliation driven, never client callback driven.
- **Immutable boundaries respected:** Draw publication and accounting ledgers rely on immutable schemas and idempotent append-only writes.
- **Graceful shutdown:** Scheduler is stopped before DB disconnect during server shutdown.

## Failure Handling

1. Inspect app logs filtered by `scope=jobs-scheduler` and `scope=jobs`.
2. Query `JobExecution` by `jobName` and recent `startedAt` descending.
3. For payment incidents:
   - inspect webhook event store + payment ledger + latest `payment_reconciliation` runs.
4. For draw/winner incidents:
   - inspect draw status and published result immutability constraints before rerunning jobs.
5. Re-run is safe:
   - same run window: deduped by `(jobName, runKey)`,
   - later window: rerun proceeds with domain-level idempotency checks.

## Configuration Checklist

Set these environment variables to tune operations:

- `JOBS_ENABLED`
- `JOBS_RENEWAL_REMINDER_INTERVAL_MS`
- `JOBS_GRACE_PERIOD_CHECK_INTERVAL_MS`
- `JOBS_EXPIRY_ENFORCEMENT_INTERVAL_MS`
- `JOBS_MONTHLY_DRAW_PREP_INTERVAL_MS`
- `JOBS_DRAW_EXECUTION_INTERVAL_MS`
- `JOBS_WINNER_PROOF_CHECK_INTERVAL_MS`
- `JOBS_PAYMENT_RECONCILIATION_INTERVAL_MS`
- `JOBS_RENEWAL_REMINDER_LEAD_DAYS`
- `JOBS_GRACE_WARNING_LEAD_DAYS`
- `JOBS_PAYMENT_RECONCILIATION_LOOKBACK_MINUTES`
- `JOBS_PAYMENT_RECONCILIATION_BATCH_SIZE`
