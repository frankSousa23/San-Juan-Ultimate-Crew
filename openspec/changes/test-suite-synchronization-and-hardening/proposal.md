## Why

While the live production environment (`https://san-juan-ultimate-crew.seenode.app`) is verified with a 100% pass rate on E2E tests, the local Vitest integration test suite (`npm test`) exhibits 12 failures across 6 test suites due to legacy credentials (`123456` vs `passWORD23`) and unhandled string coercion when query parameters evaluate to `undefined`. Synchronizing test authentication and hardening query parameter parsing ensures that any developer or CI runner can execute `npm test` locally with 0 errors and complete confidence before deployment.

## What Changes

- **Unified Test Authentication:** Update legacy test suites (`injuries.test.ts`, `messages.test.ts`, `players.test.ts`, `resources.test.ts`, `roles.permissions.test.ts`) to use canonical administrator credentials (`passWORD23`) with fallback support.
- **Robust Query Coercion & Validation:** Improve route validation schemas in `injuries.ts` and `messages.ts` so that missing or malformed query IDs produce clean, informative validation errors rather than unhandled coercion crashes.
- **100% Local Test Suite Pass:** Bring Vitest from 127 PASS / 12 FAIL up to 143/143 PASS (100% green).

## Capabilities

### New Capabilities
- `local-testing-and-query-hardening`: Defines the requirement for the local Vitest suite to execute without authentication failure, and for route query parameters to gracefully handle invalid/undefined inputs without cascading test failures.

### Modified Capabilities
<!-- None: No existing specs are changing requirements -->

## Impact

- **Affected Files:**
  - `apps/api/src/roles.permissions.test.ts`
  - `apps/api/src/players.test.ts`
  - `apps/api/src/injuries.test.ts`
  - `apps/api/src/messages.test.ts`
  - `apps/api/src/resources.test.ts`
  - `apps/api/src/routes/injuries.ts`
  - `apps/api/src/routes/messages.ts`
- **APIs:** Better parameter validation on `/api/injuries/paged` and `/api/messages`.
- **Testing:** `npm test` achieves 100% PASS locally.
