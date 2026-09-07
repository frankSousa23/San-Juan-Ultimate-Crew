## Purpose

Provides automated CI/CD secret scanning and comprehensive repository ignore rules to prevent credential leakage and hardcoded secrets across all project files.

## ADDED Requirements

### Requirement: Repository Ignore Rules for Sensitive Assets
The repository configuration SHALL ignore sensitive files including TLS/SSL certificates, private keys, cloud service account JSON credentials, package manager authentication tokens, and environment overrides.

#### Scenario: Attempting to Add Sensitive Certificates or Keys
- **WHEN** private keys (`*.key`, `*.pem`, `*.pfx`, `id_rsa*`) or cloud service account files (`*service-account*.json`) are present in the workspace
- **THEN** Git excludes them from version control tracking automatically via `.gitignore`.

#### Scenario: Developer Local Environment Setup
- **WHEN** a contributor initializes the web application workspace
- **THEN** an `apps/web/.env.example` template provides non-sensitive variable definitions without leaking actual secrets.

### Requirement: Automated Secret Scanning in CI/CD
The continuous integration pipeline SHALL execute an automated secret scanner on pull requests and pushes to main branches to detect potential exposed credentials before code merge.

#### Scenario: Running Secret Detection in CI
- **WHEN** commits are pushed or submitted via pull request to the repository
- **THEN** the CI workflow executes a dedicated secret scanning step that fails the build if plaintext keys or credential patterns are identified.
