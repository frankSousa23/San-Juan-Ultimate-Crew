## MODIFIED Requirements

### Requirement: Startup Environment Schema Validation
The API application SHALL validate essential environment variables against a defined schema during process initialization and abort execution with exit code 1 if required production variables are invalid, missing, or set to development fallback values.

#### Scenario: Validating Environment Configuration
- **WHEN** the backend server boots
- **THEN** configuration values (`PORT`, `NODE_ENV`, `JWT_SECRET`, `AUTH_REQUIRED`) are parsed and validated before serving HTTP traffic, and production environments abort startup if required variables are missing or insecure.

#### Scenario: Validating Environment Configuration in Development
- **WHEN** the backend server boots in development mode (`NODE_ENV === 'development'`)
- **THEN** configuration values are parsed with sensible defaults allowed for local developer workflows.

#### Scenario: Validating Environment Configuration in Production
- **WHEN** the backend server boots in production mode (`NODE_ENV === 'production'`)
- **THEN** configuration validation requires `JWT_SECRET` to be explicitly provided with at least 32 characters, enforces `AUTH_REQUIRED=true` by default, and immediately aborts with exit code 1 if `JWT_SECRET` matches development defaults or is absent.

## ADDED Requirements

### Requirement: Universal Cryptographic Authentication Verification
The authentication subsystem SHALL verify user login credentials exclusively through cryptographic comparison against the stored password hash in the database, with zero hardcoded account exceptions or password bypasses.

#### Scenario: Attempting Login with Hardcoded Fallback Credentials
- **WHEN** a user or administrator attempts login with legacy or default passwords (`passWORD23`, `123456`) that do not match the cryptographic hash stored in the database
- **THEN** the request is rejected with HTTP 401 Unauthorized and credentials error message.

#### Scenario: Requesting Password Reset
- **WHEN** a user submits a password reset request via `/api/auth/forgot-password`
- **THEN** the generated reset token is not exposed in the HTTP JSON response body and is not logged in server console outputs.

### Requirement: Log Sanitization and Query Redaction
The application logging system and request logging middleware SHALL sanitize log payloads and URLs by masking sensitive fields and redacting authentication tokens.

#### Scenario: Logging Structured Metadata
- **WHEN** the application logger receives log metadata containing sensitive keys (`password`, `token`, `secret`, `authorization`, `cookie`)
- **THEN** the values of those keys are replaced with `[REDACTED]` prior to formatting and output.

#### Scenario: Logging HTTP Requests with Sensitive Query Parameters
- **WHEN** an incoming HTTP request contains token query parameters (such as `token`, `secret`, or `key`)
- **THEN** the request logger records the URL with the parameter values masked or truncated.
