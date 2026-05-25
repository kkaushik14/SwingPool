# Swing Pool Frontend Integration Notes

## Backend Surface Verification

This frontend pass re-checked the current frontend route and service usage against the backend integration checklist in:

- [FRONTEND_INTEGRATION_CHECKLIST.md](/Users/kumarkaushik/Desktop/Swing%20Pool/Backend/docs/FRONTEND_INTEGRATION_CHECKLIST.md)

## Fully Integrated Frontend Flows

### Public

- public homepage
- pricing
- charity listing
- charity detail
- FAQ, winners, contact, terms, privacy

### Auth

- login
- signup/register
- email verification
- resend verification
- forgot password
- reset password

### Member

- dashboard overview
- page-based onboarding routing
- profile status and profile editing
- billing and subscription checkout
- payment success/failure and backend-truth status polling
- score entry, confirmation, eligibility, and history
- draws and winnings
- proof submission draft management
- charities and personal impact summary
- notifications center and notifications page
- settings

### Shared Platform Behavior

- JWT session persistence and refresh flow
- global API envelope parsing
- route guards and redirect sanitization
- offline-aware retry behavior
- top banners, inline warnings, and operational state panels

## Intentional Preview/Fallback Behavior

The only deliberate fallback content left in the app is on public marketing surfaces:

- public plans
- public charity catalog

This is intentional because the local backend can start in development without MongoDB, which would otherwise break the public site during frontend work. These pages now label fallback mode clearly as preview content instead of silently pretending the data is live.

Authenticated product flows do not use mock account, billing, score, draw, or notification data.

## What Was Hardened In This Pass

- added explicit routes for:
  - `/verify-email`
  - `/forgot-password`
  - `/reset-password`
  - `/app/onboarding/*`
- standardized critical auth forms around shared field primitives
- improved invalid-state accessibility for inputs, textareas, and selects
- added keyboard and ARIA support for modal and drawer overlays
- added skip links in layout shells
- replaced the old registration token preview pattern with a routed verification flow
- extracted score confirmation into a reusable component
- extracted proof draft behavior into reusable helpers
- expanded tests around guards, onboarding, payment, score confirmation, proof drafts, admin confirmation, and notification rendering

## Remaining Backend-Dependent Gaps

These are not frontend bugs, but real dependencies or still-open integration edges:

1. Live catalog and billing data still depend on a running backend plus MongoDB.
   - Without MongoDB, public catalog pages fall back to preview mode by design.
   - Authenticated member billing, score, draw, and notification flows still require the real backend.

2. Admin coverage is still partial relative to the full backend admin surface.
   - The backend exposes far more admin endpoints than the frontend currently consumes.
   - Existing admin routes are functional shell pages, but many deeper modules remain to be fully integrated:
     - plans
     - payments
     - scores
     - winners
     - reports tabs beyond overview
     - jackpot operations
     - notification operations
     - audit explorer depth

3. Public winners/testimonial content is still curated presentation content.
   - The current backend checklist does not expose a dedicated public winners feed tailored for the marketing site.

4. Winner proof upload is still URL/data-based at the API boundary.
   - The frontend supports draft selection, preview, replace, remove, and submit.
   - The backend currently accepts proof payloads as file metadata plus URLs/data URLs, not direct multipart uploads.

5. Some backend endpoints are available but not yet wired into dedicated frontend views.
   - Examples include:
     - subscription history and cancellation history
     - payment ledger mine
     - charity selection history
     - admin report detail slices

## Recommended Next Frontend Integration Steps

1. Finish the admin frontend against the existing admin backend surface.
2. Replace curated public winners content with a backend-safe public feed when available.
3. Add dedicated views for payment ledgers, subscription history, and charity selection history.
4. If the backend adds multipart proof upload or public result feeds, switch the frontend to those stronger contracts directly.
