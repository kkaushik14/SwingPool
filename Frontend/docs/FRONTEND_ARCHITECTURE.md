# Swing Pool Frontend Architecture

## Stack

- React 18 + TypeScript
- Vite for development and production builds
- Tailwind CSS for token-driven styling
- React Router for route shells and access control
- TanStack Query for server state and cache invalidation
- React Hook Form + Zod for typed form flows
- Framer Motion for warm, meaningful motion
- Vitest + Testing Library for UI tests

## Workspace Layout

- `src/app`: app root, providers, router mount
- `src/routes`: route paths, access helpers, guards, and redirect safety
- `src/layouts`: public, auth, member app, admin app, and shared shell scaffolding
- `src/pages`: platform-specific pages
- `src/components`: shared UI primitives, navigation, and feedback patterns
- `src/features`: feature-level providers and components
- `src/hooks`: small reusable hooks
- `src/lib`: query client and shared class utilities
- `src/services`: API client and domain service modules
- `src/store`: reactive session persistence and toast state
- `src/types`: shared API/domain contracts plus backend-aligned endpoint typings
- `src/constants`: app metadata, navigation, query keys
- `src/theme`: theme provider, tokens, global CSS
- `src/utils`: formatting and error helpers
- `src/assets`: visual support assets
- `tests`: frontend test bootstrap and specs

## Application Model

### Public shell

- Landing page uses public backend endpoints:
  - `/health`
  - `/subscriptions/plans`
  - `/charities`
- It frames the product without leaning on sports clichés.

### Auth shell

- Login and registration flows use React Hook Form + Zod.
- Verification, forgot-password, and reset-password flows are routed explicitly instead of being left implicit.
- Public-only routing sends authenticated users back to an allowed surface instead of leaving them on auth pages.
- Auth utility pages remain accessible when needed so email verification and password recovery are not blocked by redirect guards.

### Member shell

- Protected by `UserRoute`.
- Built around verification, subscription status, score qualification, charity choice, and notifications.
- Uses drawer-based mobile navigation and a persistent desktop rail.
- Includes top-level readiness banners and inline warning cards so backend gating stays visible.
- Includes separate onboarding routes under `/app/onboarding/*` so setup can progress through page-based steps instead of a single wizard.

### Admin shell

- Protected by `AdminRoute`.
- Has its own layout and route surface separate from the member workspace.
- Uses grouped operational navigation, summary strips, warning patterns, and placeholder routes for future user, finance, charity, draw, and audit tooling.

## Data Access

- `src/services/api/client.ts` is the single fetch wrapper.
- It understands the backend success/error envelope.
- It also exposes contract-aware request typing aligned to the backend route surface.
- Authenticated requests read tokens from the session store.
- On `401`, the client attempts refresh token rotation through `/auth/refresh` and retries once.
- TanStack Query handles stale data, cache invalidation, background refresh warnings, and retry rules that only retry network/transient failures.

## Session Design

- Auth tokens are persisted in `localStorage` via `src/store/session.store.ts`.
- `AuthProvider` hydrates session state, subscribes to session changes, fetches `auth/me`, and clears local auth state if the server rejects the session.
- Guards rely on provider state instead of re-implementing auth logic page-by-page.

## Theming + Visual System

- Light and dark modes are first-class, not bolted on later.
- CSS variables define the core palette and semantic colors.
- Tailwind maps those variables into reusable utility classes.
- Typography uses `Fraunces` for display voice and `Manrope` for UI clarity.
- Visual direction:
  - deep emerald
  - soft gold
  - warm off-white
  - charcoal
  - muted coral
- The interface avoids classic golf styling and instead leans into softness, glow, contrast, and layered surfaces.

## Design System Foundation

The shared component layer already includes:

- buttons
- inputs
- textarea
- labels
- cards
- badges
- alerts
- tables
- modal
- drawer
- tabs
- stepper
- skeletons
- empty states
- navigation brand/toggle/drawer
- toast viewport
- top banners
- inline warning cards

`/app/experience-kit` acts as a living reference page for these primitives.

## Frontend to Backend Contract

This frontend is already shaped around the backend contract:

- standard response envelopes
- JWT access/refresh auth flow
- profile verification gating
- subscription plans/config
- charity catalog and future-only selection changes
- latest-five score qualification logic
- in-app notifications
- admin overview reports
- route-aware redirect safety between public, member, and admin surfaces
- global route error handling and shell-level loading states

The exact integration checklist lives in [FRONTEND_RULES.md](./FRONTEND_RULES.md).
