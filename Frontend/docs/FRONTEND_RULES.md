# Swing Pool Frontend Rules

## Product Rules

- Subscription activation is not purely payment-driven.
- The frontend must respect the backend eligibility gate:
  - email verified
  - profile completed
  - profile verification status is `verified`
  - `eligibleForSubscription` is true
- Charity selection is for future payments only.
- Historical allocation and payout views should be presented as immutable outcomes.
- Score history is append-only for members.
- Competition eligibility comes from the latest five qualifying submissions only.
- Draw participation should be communicated as eligibility-based, not guaranteed.
- Winner proof and payout states should be treated as real workflow states, not decorative labels.

## UX Rules

- Avoid traditional golf visuals such as fairways, flags, tartan club aesthetics, or country-club nostalgia.
- Prefer emotional warmth over hard-edged sportiness.
- Public, member, and admin surfaces should feel related but distinct.
- Admin UX should read as operational and traceable rather than decorative.
- Use motion sparingly and intentionally:
  - page entrance
  - overlay transitions
  - subtle card lift
- Keep critical backend states visible:
  - verification status
  - subscription status
  - grace period
  - payment outcomes
  - notification state
- Do not imply payment success based only on client redirects.
- Always route payment completion messaging back through backend-confirmed status.
- Route redirects after login must stay internal and role-safe.
- Standard users must never be redirected into admin-only surfaces.
- Admin users should be routed back to admin-safe surfaces instead of member-only screens.

## UI Rules

- Mobile-first layout is mandatory.
- Desktop uses a rail layout; mobile uses a drawer nav.
- Primary CTA color should remain in the emerald family.
- Gold is used for emphasis and warmth, not as a default background.
- Coral should be reserved for emotionally relevant accents and warnings, not sprayed across the interface.
- Tables, alerts, and badges should use semantic status colors consistently.
- Empty states should feel helpful, never broken or accusatory.

## Engineering Rules

- Do not bypass `src/services/api/client.ts` for backend requests.
- Keep backend response parsing centralized.
- Prefer `apiClient.requestContract(...)` for implemented routes so request and response shapes stay aligned with backend expectations.
- Use TanStack Query for server state instead of ad hoc component fetch logic where feasible.
- Retry only transient/network failures. Do not blindly retry stable 4xx backend errors.
- Use React Hook Form + Zod for meaningful forms.
- Keep single-point exports clean so imports stay stable as the frontend grows.
- New pages should reuse the shared design system before inventing new primitives.
- App-wide failures should surface through the global route/error shell, not scattered one-off crash UIs.

## Local Integration Rules

- Default local backend URL: `http://localhost:4000/api/v1`
- Local frontend env key: `VITE_API_BASE_URL`
- Authenticated backend routes require `Authorization: Bearer <accessToken>`
- Idempotent writes can send `Idempotency-Key`
- Demo login works only when backend seed data exists

## Current Scope

This frontend foundation covers:

- public overview
- auth screens plus verification and password recovery
- page-based onboarding routes
- member dashboard shell with route protection and redirect handling
- profile completion UI
- subscription UI foundation
- scores UI foundation
- charities UI foundation
- draws/winners overview
- notifications view
- admin overview plus placeholder operational routes
- design system reference page

It is intentionally ready for deeper endpoint-by-endpoint expansion without requiring a visual rewrite.
