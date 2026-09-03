## Purpose

Provides production rate limiting enforcement and startup environment variable schema validation for security and deployment reliability.

## ADDED Requirements

### Requirement: Production Rate Limiting Enforcement
The API middleware SHALL enforce rate limits on authentication, password resets, write operations, and general requests when running in production (`NODE_ENV === 'production'`) and bypass them during automated test execution.

#### Scenario: Running in Production Mode
- **WHEN** requests are received in a production environment
- **THEN** rate limit headers are evaluated and excess requests receive HTTP 429 Too Many Requests.

#### Scenario: Running Automated Test Suites
- **WHEN** Vitest or test runners execute with `VITEST === 'true'` or non-production environment
- **THEN** rate limit restrictions are bypassed to prevent test throttling.

### Requirement: Startup Environment Schema Validation
The API application SHALL validate essential environment variables against a defined schema during process initialization.

#### Scenario: Validating Environment Configuration
- **WHEN** the backend server boots
- **THEN** configuration values (`PORT`, `NODE_ENV`, `JWT_SECRET`) are parsed and validated before serving HTTP traffic.
