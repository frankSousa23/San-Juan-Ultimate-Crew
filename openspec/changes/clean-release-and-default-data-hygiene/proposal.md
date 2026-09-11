## Why

With the completion of the white-label architecture and intra-club tournament engine, SIGEDIVO is ready for its official `v1.4.0` open-source release. However, two essential cleanup steps remain:
1. When restoring or seeding the system (`prisma/seed.ts`, `mockDb.ts`, and helper maintenance scripts), legacy default data still seeds 11 external clubs from the obsolete multi-club model and populates mock financial transactions with static balances that pollute fresh instances upon restore/reset.
2. The project's root `package.json`, `@sigedivo/web`, `@sigedivo/api`, and `apps/web/index.html` contain outdated version identifiers (`1.2.0`), missing project descriptions, and club-specific `<title>` tags instead of the official `v1.4.0` release metadata.

Establishing a clean default data baseline and updating package descriptors ensures that any club or developer deploying or restoring SIGEDIVO receives a pristine, zero-pollution environment with consistent versioning.

## What Changes

- **Default Data Hygiene & Clean Seeding (`prisma/seed.ts`, `mockDb.ts`):**
  - Replace the legacy 11 external multi-club seed teams with clean intra-club squads (*Equipo A - Open*, *Equipo B - Desarrollo*, *Femenino*, *Mixto*) matching the white-label single-club architecture.
  - Reset default financial accounts (*Caja Chica*, *Cuenta Bancaria*) to a clean zero-balance baseline ($0.00 / 0 cents) and remove mock financial transactions that were artificially accumulating upon restore.
  - Clean up maintenance scripts (`scripts/restore-guest.js`, `scripts/clean-mock.js`, `scripts/clear-events.js`) to prevent accidental injection of hardcoded test transactions into `mockDb.ts`.
- **Release Versioning & Repository Metadata (`v1.4.0`):**
  - Update version to `1.4.0` across root `package.json`, `apps/web/package.json`, and `apps/api/package.json`.
  - Add official `description` and keywords in root `package.json`.
  - Update `apps/web/index.html` `<title>` and `<meta name="description">` to accurately describe SIGEDIVO as a generic club management platform.
  - Clean up residual hosting mentions in `docs/presentacion_sigedivo_publico.html` and `docs/ARQUITECTURA_Y_CODIGO.md`.
- **Release Launch Preparation:**
  - Verify all Vitest test suites and production build scripts pass with 0 errors.
  - Prepare clean git commit, annotated git tag `v1.4.0`, and release notes.

## Capabilities

### Modified Capabilities
- `organization-white-label-and-branding`: Add requirements for clean baseline default data seeding (intra-club squads, zeroed financial balances, no phantom mock transactions) and official release version descriptors.

## Impact

- **Database / Mock Layer (`prisma/seed.ts`, `mockDb.ts`):** Default seeded data becomes minimal, coherent with intra-club squads, and free of phantom transactions.
- **Maintenance Scripts (`scripts/`):** Deprecated injection patterns in restore scripts are neutralized.
- **Frontend / Client (`apps/web/`):** Clean metadata, accurate browser tab titles, and version bump.
- **Backend API (`apps/api/`):** Version bump and aligned default seed.
- **Testing (`vitest`):** All test suites pass cleanly against the sanitized default data baseline.
