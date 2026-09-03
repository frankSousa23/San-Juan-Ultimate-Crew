## Context

See `proposal.md` for background motivation.
`apps/api` runs on Express 5. Zod is installed in the root workspace. Currently, rate limiters in `apps/api/src/middleware/security.ts` unconditionally return `skip: () => true`.

## Goals / Non-Goals

**Goals:**
- Replace hardcoded `skip: () => true` with a unified `shouldSkipRateLimit` helper that respects `NODE_ENV === 'production'`.
- Implement `apps/api/src/lib/env.ts` using Zod to parse and validate runtime configuration.
- Import `env.ts` at the head of `apps/api/src/app.ts` and `server.ts`.
- Ensure all 143 tests continue passing with zero throttling friction.

**Non-Goals:**
- Third-party Redis-backed rate limiting (in-memory sliding window express-rate-limit is optimal for current single-instance / Cloud Run deployments).

## Decisions

### Decision 1: Graceful Secret Fallback in Development
To ensure test suites and local sandboxes boot without requiring manual `.env` file creation, `JWT_SECRET` provides a secure default in `NODE_ENV !== 'production'` and logs a clear console advisory in production if a default is detected.

### Decision 2: Centralized Rate Limit Skip Logic
A single `shouldSkipRateLimit()` function is shared across all 6 limiters (`general`, `auth`, `passwordReset`, `upload`, `write`, `read`) to prevent divergence.

## Risks / Trade-offs

- **[Risk] Test throttling:** Aggressive rate limiting could break supertest batches in Vitest.
  - *Mitigation:* `shouldSkipRateLimit` explicitly checks `process.env.VITEST === 'true' || process.env.NODE_ENV === 'test'`.
