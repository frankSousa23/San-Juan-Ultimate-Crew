# local-testing-and-query-hardening Specification

## Purpose
Provides a unified, resilient authentication harness for local integration test execution and guarantees robust input validation on query parameters across REST endpoints.

## Requirements

### Requirement: Unified Test Authentication Support
The test authentication helpers and suites SHALL authenticate administrator sessions using the canonical credentials (`passWORD23`) and provide automatic fallback to legacy credentials so that all unit and integration test suites can acquire valid JWT tokens in any test environment.

#### Scenario: Admin login during integration tests
- **WHEN** an automated test suite requests authentication for `frankalfonso1988@gmail.com`
- **THEN** the authentication helper provides valid credentials (`passWORD23`) and receives a 200 OK status with a valid JWT token.

#### Scenario: Authenticated test assertions
- **WHEN** a test calls a protected endpoint (`/api/players`, `/api/resources`, `/api/injuries`) with the acquired admin token
- **THEN** the request returns a successful status code (200 OK or 201 Created) instead of 401 Unauthorized.

### Requirement: Graceful Query Parameter Validation
The REST API endpoints that accept query parameters (including `/api/injuries/paged` and `/api/messages`) SHALL validate query inputs gracefully and reject uncoercible or malformed values with a structured 400 Bad Request error containing clear problem descriptions rather than unhandled server errors.

#### Scenario: Query with missing or undefined player ID
- **WHEN** a client sends a GET request to `/api/injuries/paged?playerId=undefined` or an unparseable non-numeric value
- **THEN** the server returns 400 Bad Request with a structured validation message identifying the malformed parameter.

#### Scenario: Query with valid integer player ID
- **WHEN** a client sends a GET request to `/api/injuries/paged?playerId=10`
- **THEN** the server returns 200 OK with paginated injury records matching that player.

### Requirement: Complete Vitest Test Suite Execution
The backend API test suite (`npm test`) SHALL pass 100% of all configured test cases without failures, ensuring parity between local development and cloud production deployments.

#### Scenario: Full Vitest test run
- **WHEN** a developer or CI pipeline executes `npm test` from the repository root
- **THEN** all test files pass with 0 failed assertions and exit code 0.
