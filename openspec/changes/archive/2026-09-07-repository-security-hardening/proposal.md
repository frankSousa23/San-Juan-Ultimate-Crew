## Why

A comprehensive security audit revealed critical vulnerabilities in the repository: a hardcoded superadministrator login backdoor in `auth.ts`, plaintext administrator credentials and production URLs in automation scripts, fallback secrets for `JWT_SECRET` in `env.ts` and `stats.ts`, authentication bypass defaults (`AUTH_REQUIRED=false`), unmasked password reset tokens in API responses/logs, and gaps in `.gitignore` and CI/CD secret scanning. Hardening these components eliminates the risk of credential leakage and unauthorized administrative access while maintaining full stability across the automated test suite.

## What Changes

- **Authentication Backdoor Elimination:** Remove the hardcoded conditional check in `apps/api/src/routes/auth.ts` (L525) that grants access to `frankalfonso1988@gmail.com` with `passWORD23` or `123456`, enforcing standard cryptographic bcrypt comparison for all accounts.
- **Strict Production Environment Validation:** Update `apps/api/src/lib/env.ts` to require a strong `JWT_SECRET` (at least 32 characters, rejecting dev default fallbacks) and enforce `AUTH_REQUIRED=true` by default when `NODE_ENV === 'production'`. The process will abort with `process.exit(1)` upon startup if configuration is insecure.
- **Eliminate Route Fallback Secrets:** Refactor `apps/api/src/routes/stats.ts` to consume validated `env.JWT_SECRET` instead of the local hardcoded fallback `'your-secret-key'`.
- **Remove Plaintext Passwords in Scripts:** Update `scripts/populate-production-ecosystem.ts` and `scripts/run-live-deploy-tests.ts` to require `ADMIN_PASSWORD` from environment variables, removing hardcoded `'passWORD23'` fallback values.
- **Password Reset Token Protection:** Prevent password reset tokens from leaking in JSON responses and remove sensitive token printing from `logger.info` in `apps/api/src/routes/auth.ts`.
- **Logging Sanitization & Query Redaction:** Enhance `apps/api/src/lib/logger.ts` to recursively redact sensitive fields (`password`, `token`, `secret`, `authorization`, `cookie`) and update `apps/api/src/middleware/logging.ts` to mask sensitive URL query parameters.
- **Repository `.gitignore` Hardening:** Add exclusion patterns for SSL/TLS keys (`*.pem`, `*.key`, `*.pfx`, `*.crt`), cloud service account JSON credentials (`*service-account*.json`, `*credentials*.json`), package manager auth files (`.npmrc`, `.pypirc`), and local environment variants.
- **Web Environment Template:** Add `apps/web/.env.example` documenting `VITE_API_URL` for secure team onboarding.
- **CI/CD DevSecOps Secret Scanning:** Integrate Gitleaks automated secret scanning into `.github/workflows/ci.yml` to prevent future secret commits.

## Capabilities

### New Capabilities
- `devsecops-ci-secret-scanning`: Automated secret scanning in GitHub Actions CI pipelines and enhanced `.gitignore` rules preventing accidental commit of certificates, private keys, cloud tokens, and package manager credentials.

### Modified Capabilities
- `backend-security-and-environment`: Requires strict startup termination for missing or default `JWT_SECRET` in production, enforces `AUTH_REQUIRED=true` by default in production, removes authentication login backdoors, and redacts sensitive data and query parameters from application logs.

## Impact

- **Backend Authentication (`apps/api/src/routes/auth.ts`, `apps/api/src/lib/env.ts`):** Only authenticates users with valid password hashes stored in the database. Production boot halts if `JWT_SECRET` is unset or insecure.
- **Operational Scripts (`scripts/`):** Administrators and automated test runners must supply `ADMIN_PASSWORD` via environment variables.
- **Logging Subsystem (`apps/api/src/lib/logger.ts`, `logging.ts`):** Sanitizes logs to prevent sensitive credential leakage in console and log aggregators.
- **CI/CD Pipeline (`.github/workflows/ci.yml`):** Runs Gitleaks scanner on every push and PR.
