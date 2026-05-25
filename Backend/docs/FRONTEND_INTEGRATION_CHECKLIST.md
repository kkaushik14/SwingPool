# Frontend Integration Checklist

## Base Setup

- Base API URL: `http://localhost:4000/api/v1`
- Swagger UI: `http://localhost:4000/api-docs`
- OpenAPI JSON: `http://localhost:4000/api-docs.json`
- Response success shape:

```json
{
  "success": true,
  "message": "Request completed successfully.",
  "data": {},
  "meta": {},
  "requestId": "uuid",
  "timestamp": "2026-04-23T12:00:00.000Z"
}
```

- Response error shape:

```json
{
  "success": false,
  "message": "Request validation failed.",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {}
  },
  "requestId": "uuid",
  "timestamp": "2026-04-23T12:00:00.000Z"
}
```

- Auth header for protected routes: `Authorization: Bearer <accessToken>`
- Idempotent write routes can send: `Idempotency-Key: <unique-key>`
- Frontend local CORS value to use in backend env: `http://localhost:3000,http://localhost:5173`

## Local Test Accounts

- Demo users are created only when `SAMPLE_SEED_ENABLED=true`
- Demo credentials should come from your local-only sample seed source file referenced by `SAMPLE_SEED_SOURCE_PATH`
- Admin bootstrap is created only when `ADMIN_BOOTSTRAP_EMAIL` is set before `npm run seed`
- Admin bootstrap password:
  - use `ADMIN_BOOTSTRAP_PASSWORD`, or
  - omit it and read the generated one-time password from seed logs
- Rotate admin password after first login with:

```bash
ADMIN_ROTATE_EMAIL=admin@example.com ADMIN_ROTATE_PASSWORD='NewStrongPassword@12345' npm run rotate:admin-password
```

## Minimum User-App API Surface

### Public

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/verify-email`
- `POST /auth/resend-verification`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /subscriptions/plans`
- `GET /subscriptions/config`
- `GET /charities`
- `GET /charities/rules/effective`

### Authenticated User

- `POST /auth/logout`
- `GET /auth/me`
- `GET /users/me`
- `PATCH /users/me`
- `PATCH /users/me/profile`
- `GET /users/me/profile-status`
- `GET /subscriptions/mine`
- `GET /subscriptions/history`
- `GET /subscriptions/cancellations`
- `POST /subscriptions`
- `POST /subscriptions/:subscriptionId/cancel`
- `POST /subscriptions/:subscriptionId/upgrade-preview`
- `POST /subscriptions/:subscriptionId/upgrade`
- `POST /subscriptions/:subscriptionId/confirm-payment`
- `GET /payments/mine`
- `GET /payments/ledger/mine`
- `POST /payments/intents`
- `POST /payments/checkout-session`
- `GET /charities/my/selection`
- `GET /charities/my/selections`
- `POST /charities/my/selection`
- `GET /charities/my/donations`
- `POST /charities/my/donations/intents`
- `POST /scores`
- `GET /scores/mine`
- `GET /scores/mine/:id`
- `GET /scores/mine/competition/qualifying`
- `GET /scores/mine/competition/eligibility`
- `GET /notifications/mine`
- `GET /notifications/:id`
- `POST /notifications`
- `PATCH /notifications/:id`
- `GET /winners/mine`
- `GET /winners/mine/:id`
- `POST /winners/:winnerId/proofs`
- `GET /winners/:winnerId/proofs`

## Payment Flow Notes

- Frontend should never treat the Stripe success callback as the source of truth
- Frontend flow should be:
  1. create subscription or donation intent
  2. create Stripe payment intent or checkout session
  3. redirect/confirm on Stripe
  4. poll or refetch backend payment/subscription state
  5. wait for webhook-driven final state from backend
- Canonical state sources after payment:
  - `GET /payments/mine`
  - `GET /payments/ledger/mine`
  - `GET /subscriptions/mine`

## Profile and Eligibility Gating

- Subscription should be treated as not activatable in UI unless `GET /users/me/profile-status` reports:
  - `emailVerified: true`
  - `profileCompleted: true`
  - `profileVerificationStatus: "verified"`
  - `eligibleForSubscription: true`
- Score eligibility for monthly competition should come from:
  - `GET /scores/mine/competition/eligibility`
  - `GET /scores/mine/competition/qualifying`

## Admin-App API Surface

- Users:
  - `GET /admin/users`
  - `GET /admin/users/:userId`
  - `PATCH /admin/users/:userId`
  - `PATCH /admin/users/:userId/profile-verification`
- Plans and coupons:
  - `GET /admin/plans`
  - `POST /admin/plans`
  - `PATCH /admin/plans/:planId`
  - `GET /admin/coupons`
  - `POST /admin/coupons`
  - `PATCH /admin/coupons/:couponId`
- Subscriptions:
  - `GET /admin/subscription-config`
  - `PATCH /admin/subscription-config`
  - `GET /admin/subscriptions`
  - `GET /admin/subscriptions/:subscriptionId`
  - `POST /admin/subscriptions/:subscriptionId/cancel`
  - `POST /admin/subscriptions/:subscriptionId/renewal-failed`
  - `POST /admin/subscriptions/grace-period/process-expirations`
  - `PATCH /admin/subscriptions/:subscriptionId/manual-adjustment`
- Payments:
  - `GET /admin/payments`
  - `GET /admin/payments/:paymentId`
  - `GET /admin/payments/:paymentId/ledger`
  - `POST /admin/payments/process-timeouts`
  - `PATCH /admin/payments/:paymentId/manual-adjustment`
- Charities and donations:
  - `GET /admin/charities`
  - `POST /admin/charities`
  - `PATCH /admin/charities/:charityId`
  - `GET /admin/charities/contribution-rule`
  - `PATCH /admin/charities/contribution-rule`
  - `GET /admin/donations`
  - `PATCH /admin/donations/:donationId/manual-adjustment`
  - `GET /admin/payouts`
  - `POST /admin/payouts`
  - `PATCH /admin/payouts/:payoutId`
  - `POST /admin/charity-adjustments`
- Scores:
  - `GET /admin/scores`
  - `PATCH /admin/scores/:scoreId`
- Draws:
  - `GET /admin/draws`
  - `GET /admin/draws/:drawId`
  - `POST /admin/draws`
  - `PATCH /admin/draws/:drawId`
  - `POST /admin/draws/:drawId/entries/generate`
  - `POST /admin/draws/:drawId/simulations`
  - `GET /admin/draws/:drawId/simulations`
  - `POST /admin/draws/:drawId/publish`
  - `GET /admin/draws/:drawId/result`
  - `GET /admin/draws/:drawId/prize-pool`
  - `POST /admin/draws/jackpot-funds`
  - `GET /admin/draws/jackpot-ledger`
- Winners:
  - `GET /admin/winners`
  - `GET /admin/winners/:winnerId`
  - `GET /admin/winners/:winnerId/proofs`
  - `PATCH /admin/winners/:winnerId/proofs/:proofId/review`
  - `PATCH /admin/winners/:winnerId/payout`
- Audit and reports:
  - `GET /admin/audit-events`
  - `GET /reports/overview`
  - `GET /reports/users`
  - `GET /reports/subscriptions`
  - `GET /reports/payments`
  - `GET /reports/charities`
  - `GET /reports/draws`
  - `GET /reports/winners`

## Real Local Sanity Run

1. Copy env:

```bash
cp .env.example .env
```

2. Ensure MongoDB is running on the URI in `.env`

3. Seed demo users and an admin:

```bash
SAMPLE_SEED_ENABLED=true SAMPLE_SEED_SOURCE_PATH=.local/sample-seed.json ADMIN_BOOTSTRAP_EMAIL=admin@example.com ADMIN_BOOTSTRAP_PASSWORD='StrongPassword@12345' npm run seed
```

4. Start backend:

```bash
npm run dev
```

5. Verify:

- Swagger loads at `http://localhost:4000/api-docs`
- `POST /api/v1/auth/login` works for:
  - the verified demo user from your local sample seed source
  - the admin bootstrap email

## Current Readiness Notes

- OpenAPI coverage currently matches implemented routes
- Postman collection is generated from the same OpenAPI source
- Seeded demo/admin account paths exist and are documented
- Real login verification still requires a running MongoDB instance
