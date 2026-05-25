# Swing Pool Frontend Structure

## Top-Level Shape

- `src/app`
  - app bootstrap, providers, and the global error boundary
- `src/routes`
  - route paths, router definition, access helpers, and guard components
- `src/layouts`
  - public, auth, member, admin, and shared shell layouts
- `src/pages`
  - route-level page files
- `src/components`
  - shared UI, navigation, and feedback primitives
- `src/features`
  - domain-specific helpers and reusable components
- `src/hooks`
  - small shared behavior hooks
- `src/lib`
  - query client and utility glue
- `src/services`
  - API client and backend-facing domain services
- `src/store`
  - session persistence and toast state
- `src/types`
  - domain models plus backend contract typings
- `src/constants`
  - app metadata, navigation, and query keys
- `src/theme`
  - theme provider, tokens, and global styles
- `src/utils`
  - formatting and error helpers
- `tests`
  - Vitest + Testing Library coverage

## Route Families

### Public

- `/`
- `/how-it-works`
- `/pricing`
- `/charities`
- `/charities/:charityId`
- `/winners`
- `/faq`
- `/contact`
- `/terms`
- `/privacy`

### Auth Utility

- `/login`
- `/signup`
- `/register`
- `/verify-email`
- `/forgot-password`
- `/reset-password`

### Member

- `/app`
- `/app/onboarding`
- `/app/onboarding/profile`
- `/app/onboarding/verify`
- `/app/onboarding/charity-payment`
- `/app/onboarding/success`
- `/app/profile`
- `/app/subscriptions`
- `/app/subscriptions/payment/success`
- `/app/subscriptions/payment/failure`
- `/app/scores`
- `/app/charities`
- `/app/draws`
- `/app/notifications`
- `/app/settings`
- `/app/experience-kit`

### Admin

- `/admin`
- `/admin/users`
- `/admin/revenue`
- `/admin/charities`
- `/admin/draws`
- `/admin/audit`
- `/admin/experience-kit`

## Shared Frontend Patterns

### Data fetching

- All backend calls go through `src/services/api/client.ts`
- Contract-aware routes use `apiClient.requestContract(...)`
- TanStack Query owns caching, retry semantics, and refetch behavior

### Forms

- React Hook Form + Zod for primary flows
- Shared field wrapper in `src/components/ui/field.tsx`
- Invalid state is propagated through `Input`, `Textarea`, and `Select`

### State communication

- `TopBanner` for account-wide issues
- `InlineWarningCard` for page-local actions
- `OperationalStatePanel` for loading, offline, empty, and error blocks
- `ToastViewport` for short-lived mutation feedback

### Access control

- `UserRoute` protects member-only routes
- `AdminRoute` protects admin-only routes
- `PublicOnlyRoute` prevents authenticated users from lingering on login/signup routes
- redirect handling is sanitized through `src/routes/access.ts`

### Accessibility hardening

- skip links in layout shells
- keyboard-dismissable modal and drawer overlays
- dialog ARIA attributes on overlay surfaces
- field-level `aria-invalid` and descriptive text wiring

## Feature Ownership

- `src/features/auth`
  - auth provider, login form, register form
- `src/features/onboarding`
  - onboarding progression helpers
- `src/features/subscriptions`
  - checkout summary, plan cards, payment-state components
- `src/features/scores`
  - score validation, qualifying-window logic, confirmation modal
- `src/features/draws`
  - reward explainer, winner lifecycle, proof-draft helpers
- `src/features/charities`
  - catalog enrichment and impact summaries
- `src/features/notifications`
  - inbox ordering, account notices, notification center
- `src/features/dashboard`
  - readiness, summary, and activity helpers
- `src/features/admin`
  - reusable admin tables, toolbar helpers, and reason modal

## Test Focus Areas

- route guards and redirect safety
- onboarding progression
- plan selection
- payment status rendering
- score confirmation
- proof-draft interactions
- admin confirmation modal behavior
- notification item rendering
