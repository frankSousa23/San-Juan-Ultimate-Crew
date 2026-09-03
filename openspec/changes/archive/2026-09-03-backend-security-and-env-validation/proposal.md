## Why

Currently, all rate limiters in `apps/api/src/middleware/security.ts` unconditionally skip execution (`skip: () => true`), leaving authentication and write endpoints unprotected in production against brute-force and denial-of-service attempts. Additionally, environment variables are accessed ad-hoc without schema validation, allowing misconfigurations to trigger silent runtime failures.

## What Changes

- **Conditional Rate Limiting:** Configures all rate limiters to actively enforce request thresholds in production (`NODE_ENV === 'production'`) while transparently bypassing in local test suites (`VITEST === 'true'`).
- **Zod Environment Schema (`env.ts`):** Implements central environment variable validation on server startup checking `PORT`, `NODE_ENV`, `JWT_SECRET`, and `DATABASE_URL`.
- **Server Startup Integration:** Integrates `env.ts` in API initialization to guarantee fail-fast behavior with informative diagnostic messaging.

## Capabilities

### New Capabilities
- `backend-security-and-environment`: Establishes production rate limiting enforcement and startup environment variable schema validation.

### Modified Capabilities
<!-- None: Enhances API middleware and initialization without breaking REST contracts -->

## Impact

- **Affected Files:**
  - `apps/api/src/middleware/security.ts`
  - `apps/api/src/lib/env.ts`
  - `apps/api/src/app.ts`
  - `server.ts`
