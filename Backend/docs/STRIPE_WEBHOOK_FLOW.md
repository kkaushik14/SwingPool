# Stripe Webhook Flow (Source of Truth)

## Core Principle

- Client callbacks are never treated as final payment proof.
- Final payment state is derived from Stripe webhooks + persisted payment records.

## End-to-End Flow

1. API creates payment attempt (`/payments/intents` or subscription flow).
2. Backend stores a local `Payment` record with initial `state=processing` and timeout deadline.
3. Backend writes immutable ledger entry `intent_created`.
4. Client completes payment on Stripe.
5. Stripe sends webhook event to `/api/v1/payments/webhooks/stripe`.
6. Backend verifies Stripe signature using raw payload and configured webhook secret.
7. Event id is reserved in `PaymentWebhookEvent` (`stripeEventId` unique).
8. Processor normalizes event, finds payment record, validates amount/currency, and applies state transition.
9. Processor appends immutable ledger entry with event idempotency key.
10. For subscription-origin payments, subscription lifecycle is reconciled from payment state.
11. Charity accounting reconciliation runs for supported payment domains:
    - `subscription`: split entries for gateway fee, prize pool, mandatory charity, optional add-on, platform revenue.
    - `charity_donation`: donation status + allocation entry for independent donation.
12. Event record is marked `processed`, `ignored`, or `failed` with metadata for audit/reconciliation.

## Supported Payment States

- `processing`
- `succeeded`
- `failed`
- `cancelled`
- `timeout`
- `retry_required`

## Idempotency & Duplicate Prevention

- `PaymentWebhookEvent.stripeEventId` is unique.
- Duplicate/replayed events are acknowledged safely without double-applying side effects.
- Ledger entries are immutable and uniquely keyed by `idempotencyKey`.

## Retry-Safe Processing

- Failed webhook events are stored with failure details and attempt counters.
- Re-delivered Stripe events can be reprocessed safely.
- State transition logic prevents invalid downgrades (for example, `succeeded` is not downgraded by later non-success webhook noise).
- Charity allocation ledger writes are idempotent (`idempotencyKey`) so replayed events do not duplicate charity accounting entries.

## Timeout Handling

- Each payment attempt has `timeoutAt`.
- Admin timeout processor (`/payments/admin/process-timeouts`) marks stale in-flight attempts as `timeout`.
- Timeout transitions also create immutable ledger entries.
- Delayed Stripe success can still upgrade `timeout -> succeeded` from webhook truth.

## Mismatch Handling Safeguards

- Webhook amount/currency mismatches against persisted payment records trigger `retry_required`.
- Mismatch flags and reasons are persisted for reconciliation.
- Structured reconciliation logs include `stripeEventId`, `paymentIntentId`, previous/new state, and mismatch metadata.

## Subscription Finalization Safeguard

- Subscription activation/failure transitions are reconciled from payment state updates driven by webhook processing.
- Subscription remains non-active until webhook-driven payment success is persisted.

## Charity Finalization Safeguard

- Donation status is finalized from webhook/timeout payment state, not client callback assumptions.
- Subscription optional add-on and independent donation records remain linked to the originating payment intent.
- Historical charity accounting remains immutable after settlement.

## Operational Notes

- Configure Stripe endpoint to point at `/api/v1/payments/webhooks/stripe`.
- Ensure `STRIPE_WEBHOOK_SECRET` is set correctly per environment.
- Keep `STRIPE_WEBHOOK_TOLERANCE_SECONDS` and `STRIPE_WEBHOOK_PROCESSING_TIMEOUT_MS` tuned for production.
- Use reconciliation logs + webhook event table + immutable ledger to investigate incidents.
