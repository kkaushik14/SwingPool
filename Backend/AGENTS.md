# AGENTS

## Purpose

Swing Pool backend uses a component-driven layered architecture optimized for production readiness, observability, and secure expansion.

## Operating Rules

- Backend-only scope: never modify frontend code from this repository while doing backend tasks.
- Keep module boundaries explicit: `routes -> controllers -> services -> repositories -> models`.
- Use folder-level barrel exports (`index.js`) so imports stay clean and stable.
- Enforce config/schema validation at startup and environment-specific config overrides.
- Preserve request correlation (`x-request-id`), structured logging, audit logging, and centralized error contracts.
- Keep security middleware enabled by default: helmet, CORS, compression, rate limit, input sanitization, request size limits, idempotency support.
- Keep auth lifecycle complete: registration/login/logout/refresh/email verification/forgot-reset password, with refresh rotation and revocation checks.
- Maintain profile verification gating so subscription activation only occurs for fully verified users.
- Route all privileged operational controls through admin-only APIs with explicit reason capture for sensitive actions.
- Ensure admin actions are audit-logged with actor, action, target entity, request id, and before/after snapshots where practical.
- For admin bootstrap, use env-driven non-production seeding and rotate credentials immediately after first secure sign-in.
