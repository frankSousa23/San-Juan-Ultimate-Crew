## Context

See `proposal.md` for background and motivation. The backend API is powered by Express, TypeScript, Prisma, and Zod, accompanied by a comprehensive Vitest test suite (22 files, 139+ tests). CI/CD runs via GitHub Actions with ephemeral PostgreSQL containers.

Prior development practices introduced convenience shortcuts: a hardcoded backdoor in `auth.ts`, plaintext fallbacks in scripts, loose default secrets for `JWT_SECRET`, and lack of log sanitization. This design eliminates these vectors while preserving developer experience in local testing.

## Goals / Non-Goals

**Goals:**
- Eliminate the administrative backdoor in `apps/api/src/routes/auth.ts` (L525) and enforce strict bcrypt password verification.
- Enforce strict production startup validation in `apps/api/src/lib/env.ts` (aborting on missing/default `JWT_SECRET` or insecure configurations).
- Ensure `AUTH_REQUIRED` defaults to `true` in production environments.
- Remove hardcoded administrator passwords and default production URLs from operational scripts (`scripts/`).
- Sanitize structured log metadata and mask query string tokens in HTTP logging.
- Strengthen `.gitignore` against private keys, certificates, cloud service accounts, and package manager credentials.
- Integrate Gitleaks automated secret scanning in `.github/workflows/ci.yml`.
- Maintain 100% test pass rate across all Vitest suites.

**Non-Goals:**
- Rewriting Git commit history in this change (Git history rewriting requires offline tools like `git-filter-repo` and forced pushes, which are operational maintenance tasks).
- Replacing the core JWT authentication mechanism with external identity providers (OAuth/OIDC).
- Altering the Prisma database schema.

## Decisions

### Decision 1: Production Zod Environment Refinement
- **Approach:** Enhance `envSchema` in `apps/api/src/lib/env.ts` using `.superRefine()`. When `NODE_ENV === 'production'`:
  - `JWT_SECRET` must be defined, have at least 32 characters, and not equal `'development-jwt-secret-key-change-in-prod'`.
  - `AUTH_REQUIRED` defaults to `true` if not explicitly specified.
  - In `catch` block, if `NODE_ENV === 'production'`, immediately call `process.exit(1)`.
- **Alternative considered:** Keep `console.warn` only. *Rejected:* Allows production deployments with known compromise vectors to remain live unnoticed.

### Decision 2: Pure Cryptographic Password Verification
- **Approach:** Remove the backdoor conditional in `apps/api/src/routes/auth.ts:525`:
  ```typescript
  match = await bcrypt.compare(password, user.passwordHash)
  if (!match) return unauthorized(res, 'Credenciales incorrectas. Verifica tu correo y contraseña.')
  ```
  Test fixtures (`setup.ts`, `mockDb.ts`, and `seed.ts`) already seed `bcrypt.hashSync('passWORD23', 10)` into the database, meaning legitimate tests will continue to pass without needing a backdoor bypass.
- **Alternative considered:** Keep the backdoor only when `process.env.NODE_ENV === 'test'`. *Rejected:* Backdoors in codebase often leak into production builds and violate security audit compliance.

### Decision 3: Recursive Log Sanitization and URL Parameter Masking
- **Approach:** 
  1. Add `sanitizeLogData(data: unknown)` to `apps/api/src/lib/logger.ts` that recursively traverses objects and masks keys matching `/(password|token|secret|authorization|cookie|apiKey|key)/i` with `'[REDACTED]'`.
  2. In `apps/api/src/middleware/logging.ts`, sanitize `req.url` by masking query parameters like `token`, `key`, and `secret`.
- **Alternative considered:** Rely solely on developers not passing sensitive objects. *Rejected:* Error handlers and middleware frequently capture entire request payloads or error objects that contain credentials.

### Decision 4: Operational Script Decoupling
- **Approach:** In `scripts/populate-production-ecosystem.ts` and `scripts/run-live-deploy-tests.ts`:
  - Require `process.env.ADMIN_PASSWORD` and `process.env.DEPLOY_URL`.
  - If unset, throw a descriptive error: `Missing required environment variable ADMIN_PASSWORD`.
- **Alternative considered:** Keep development dummy passwords. *Rejected:* Causes credential leakage when scripts are committed to public repositories.

### Decision 5: CI/CD Secret Scanning Integration
- **Approach:** Add a `gitleaks` job/step in `.github/workflows/ci.yml` using `gitleaks/gitleaks-action@v2` targeting commits and PRs.
- **Alternative considered:** Run `trufflehog` CLI manually. *Rejected:* `gitleaks-action` provides native GitHub Actions annotations and SARIF report integration.

## Risks / Trade-offs

- **[Risk] Test suite failures if admin password does not match database hash:**
  → *Mitigation:* Ensure `prisma/seed.ts`, `mockDb.ts`, and `apps/api/src/tests/setup.ts` consistently initialize the admin user with a valid bcrypt hash for the test credentials.
- **[Risk] CI pipeline breaks on missing environment variables:**
  → *Mitigation:* In `.github/workflows/ci.yml`, test steps already provision test `.env` files with explicit test values, ensuring test execution remains self-contained.
- **[Risk] Performance overhead from recursive log sanitization:**
  → *Mitigation:* Restrict recursion depth to 3 levels and only inspect plain objects and arrays.
