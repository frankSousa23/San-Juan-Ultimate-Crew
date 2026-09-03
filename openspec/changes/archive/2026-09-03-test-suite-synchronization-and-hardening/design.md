## Context

See `proposal.md` for background motivation.
Currently, `apps/api/src/lib/mockDb.ts` defines `ADMIN_PW_HASH` using `passWORD23`, whereas older test suites (`injuries.test.ts`, `messages.test.ts`, `players.test.ts`, `resources.test.ts`, `roles.permissions.test.ts`) hardcode `password: '123456'`. When these tests run with `AUTH_REQUIRED=true`, login requests fail (401), leaving tokens and dependent variables (like `playerId`, `channelId`) `undefined`. When passed into query strings like `/api/injuries/paged?playerId=undefined`, Zod's `z.coerce.number().int().positive()` fails coercion on `"undefined"` and returns 400.

## Goals / Non-Goals

**Goals:**
- Provide a standardized test helper or test login credentials that attempt `passWORD23` (with fallback to `123456` if needed).
- Ensure test setups safely guard against `undefined` IDs before making assertions that depend on created resources.
- Guarantee that `npm test` runs with 143/143 tests passing (0 failures).

**Non-Goals:**
- Modifying production authentication security rules or relaxing JWT verification in production.
- Changing live database schema or production data.

## Decisions

### Decision 1: Shared/Canonical Test Credentials in Test Suites
Update the test setup blocks in `roles.permissions.test.ts`, `players.test.ts`, `injuries.test.ts`, `messages.test.ts`, and `resources.test.ts` to log in with `passWORD23` (matching the admin user initialized in `mockDb.ts`).
*Alternative considered:* Modifying `mockDb.ts` to accept `123456` for admin. *Rejected:* `passWORD23` is the documented, tested credential in production and in `run-live-deploy-tests.ts`. Keeping production and test credentials aligned prevents drift.

### Decision 2: Defensive Test Initialization
Ensure that in `beforeAll` blocks, if resource creation (such as creating a player or channel) does not yield an ID, the tests skip or fail fast with a descriptive assertion instead of propagating `"undefined"` into query parameters.

## Risks / Trade-offs

- **[Risk] Test execution speed:** Re-running bcrypt comparison in test logins could take additional milliseconds.
  - *Mitigation:* Vitest runs each suite in isolation; standard bcrypt with cost 10 is fast enough (<100ms) and already utilized across the suite.
- **[Risk] File upload timeout in resources test:** `resources.test.ts` had an ECONNRESET during multipart upload.
  - *Mitigation:* Ensure Multer upload middleware cleanly completes and closes file streams in the test runner.
