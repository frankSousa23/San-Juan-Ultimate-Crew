## ADDED Requirements

### Requirement: Clean Baseline Default Data Seeding
The database seeding scripts, mock database memory layer, and system restore routines SHALL initialize default records using clean intra-club squads and zero-balance financial baselines, without seeding obsolete multi-club entries or accumulating phantom mock transactions upon restore.

#### Scenario: Seeding or Resetting Local System State
- **WHEN** the database seeder or in-memory mock store is initialized or reset
- **THEN** only internal club squads (*Equipo A*, *Equipo B*, *Femenino*, *Mixto*) are seeded as initial squads, initial financial accounts (*Caja Chica*, *Cuenta Bancaria*) start with a zero balance ($0.00), and no phantom historical transactions pollute the financial ledger.

#### Scenario: Running Maintenance Restore Helpers
- **WHEN** executing guest or development restore scripts
- **THEN** the system preserves clean baseline structures without regex-injecting hardcoded mock transactions into runtime database files.

### Requirement: Synchronized Release Version and Description Metadata
The repository descriptors, workspace packages, and web client entry HTML SHALL expose the synchronized official release version `1.4.0` and accurate SIGEDIVO platform description.

#### Scenario: Inspecting Workspace Package Descriptors
- **WHEN** inspecting root `package.json`, `apps/web/package.json`, and `apps/api/package.json`
- **THEN** all three packages declare version `1.4.0` and include descriptive metadata defining SIGEDIVO as a white-label sports management platform.

#### Scenario: Inspecting Web Application Entry Metadata
- **WHEN** inspecting `apps/web/index.html`
- **THEN** the `<title>` tag and `<meta name="description">` reflect the generic SIGEDIVO platform rather than hardcoded references to a single organization.
