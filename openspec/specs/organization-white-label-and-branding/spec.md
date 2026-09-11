# organization-white-label-and-branding Specification

## Purpose
Provides centralized organization branding, white-label multi-instance customization, and generic self-hosted deployment configuration for clubs and regional associations.

## Requirements

### Requirement: Configurable Host Organization Branding
The web client application SHALL configure its visible identity (organization full name, acronym/short name, application title, primary theme color, and logo) dynamically through environment variables and a centralized branding configuration module.

#### Scenario: Initializing Web Client with Custom Organization Identity
- **WHEN** the application is deployed with organization environment variables (such as `VITE_ORG_NAME="El Pueblito Ultimate Club"`, `VITE_ORG_SHORT_NAME="El Pueblito"`, `VITE_PRIMARY_COLOR="#16a34a"`)
- **THEN** navigation headers, document titles, landing highlights, and footer credits display the custom organization name and branding.

#### Scenario: Fallback to Harmonious Default Organization Identity
- **WHEN** the application is booted without custom branding environment variables
- **THEN** the system falls back to default SIGEDIVO community branding without breaking UI layouts or throwing runtime errors.

### Requirement: Cloud-Agnostic and Self-Hosted Repository Documentation
The repository documentation, setup guides, and automation scripts SHALL provide generic, cloud-agnostic instructions for local and production deployment (Docker Compose, VPS, PaaS) without referencing expired third-party hosting domains.

#### Scenario: Reading Repository Quickstart
- **WHEN** an external developer or club administrator reads `README.md` and deployment documentation
- **THEN** the guides provide instructions for running locally via Docker Compose and deploying independently to self-hosted or cloud environments without dead links to expired test deployments.

### Requirement: Comprehensive Dynamic Identity Coverage
The application components, showcase widgets, match planners, and system manual documentation SHALL dynamically resolve organization and venue branding from `branding.ts`, eliminating static legacy placeholders across all views.

#### Scenario: Displaying Tournament Brackets Showcase
- **WHEN** a user views the tournament bracket preview on the landing page
- **THEN** the showcase renders the configured organization name or short name instead of static club names.

#### Scenario: Prepopulating Match Venue Defaults
- **WHEN** creating or displaying next match details on the dashboard
- **THEN** the interface defaults to the configured organization location when no custom venue is specified.

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


