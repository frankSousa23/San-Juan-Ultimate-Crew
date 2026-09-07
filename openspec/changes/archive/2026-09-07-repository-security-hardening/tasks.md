## 1. Authentication Core & Route Hardening

- [x] 1.1 Remove the hardcoded superadmin backdoor from `apps/api/src/routes/auth.ts:525`, enforcing pure `bcrypt.compare` verification, and verify with `npm --workspace apps/api run test src/auth.guard.test.ts`.
- [x] 1.2 Remove the hardcoded fallback `'your-secret-key'` in `apps/api/src/routes/stats.ts:126`, consuming `env.JWT_SECRET`, and verify stats endpoints with `npm --workspace apps/api run test src/app.test.ts`.
- [x] 1.3 Remove password reset token exposure in JSON responses and remove sensitive token printing from `logger.info` in `apps/api/src/routes/auth.ts`, verifying with `npm --workspace apps/api run test src/registration.flow.test.ts`.

## 2. Environment Schema Validation & Operational Scripts

- [x] 2.1 Enhance `apps/api/src/lib/env.ts` with strict production validation (requiring `JWT_SECRET` of >=32 chars and not equal to development default, enforcing `AUTH_REQUIRED=true` by default in production, and exiting with code 1 on production config error), and verify validation logic.
- [x] 2.2 Refactor `scripts/populate-production-ecosystem.ts` and `scripts/run-live-deploy-tests.ts` to strictly require `process.env.ADMIN_PASSWORD` and throw an error when unset, eliminating plaintext defaults.

## 3. Logging Sanitization & URL Token Masking

- [x] 3.1 Implement recursive log data sanitization in `apps/api/src/lib/logger.ts` for sensitive keys (`password`, `token`, `secret`, `authorization`, `cookie`), replacing values with `[REDACTED]`.
- [x] 3.2 Update `apps/api/src/middleware/logging.ts` to sanitize and mask sensitive query parameters in logged URLs.

## 4. Repository Configuration & DevSecOps Secret Scanning

- [x] 4.1 Update `.gitignore` to explicitly exclude `*.pem`, `*.key`, `*.pfx`, `*.crt`, `*service-account*.json`, `*credentials*.json`, `.npmrc`, `.pypirc`, and `.env.vault`.
- [x] 4.2 Create `apps/web/.env.example` documenting `VITE_API_URL` without secrets.
- [x] 4.3 Add a Gitleaks automated secret scanning step in `.github/workflows/ci.yml`.

## 5. End-to-End Verification & Test Suite Integrity

- [x] 5.1 Run full API test suite (`npm --workspace apps/api run test`) and verify 100% of test suites and tests pass without errors.
- [x] 5.2 Run workspace linter (`npm run lint`) to confirm zero ESLint warnings or errors across the repository.
