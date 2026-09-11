## Context

See `proposal.md` for background. Following the White-Label and squad-based architecture transition, the repository contains orphaned scratch files, duplicate utility scripts, and lingering static strings that need to be unified under the central `branding.ts` configuration. Furthermore, tournament scorekeeping and data flows must be verified and streamlined for both intra-club matches (internal squads) and external rival competitions.

## Goals / Non-Goals

**Goals:**
- Eliminate obsolete scratch logs and temporary test files from the project root (`lint_output.txt`, `lint_output2.txt`, `patch-test.js`, `test-guest.js`, `bun.lock`).
- Consolidate duplicated maintenance scripts in `scripts/` (e.g. keeping canonical versions and removing `*2.js`, `_run.mjs`, `quick-check.mjs`).
- Resolve git tracking redundancy between `.agent/` and `.agents/`.
- Replace all remaining static club names in tournament bracket showcases (`Landing.tsx`), default venues (`Dashboard.tsx`), and documentation templates with `branding.ts`.
- Clarify and verify the dual-squad intra-club scrimmage scorekeeping workflow (`isInternalScrimmage: true`) across `LiveAnnotationsTable.tsx` and statistics aggregators.
- Maintain 100% test compatibility across all Vitest suites and 0 build errors in production bundles.

**Non-Goals:**
- Schema breaking changes (Prisma schema already supports `isInternalScrimmage`, `awayTeamId`, `rivalId`, and dual-side annotations).
- Rewriting the core scorekeeping engine (focus is on UX clarity, branding consistency, and data flow validation).

## Decisions

### Decision 1: Root & Maintenance Scripts Depuration
- **Approach:** 
  1. Remove temporary root logs (`lint_output.txt`, `lint_output2.txt`) and scratch test snippets (`patch-test.js`, `test-guest.js`).
  2. Remove redundant `bun.lock` file since the repository standardizes on `npm` workspaces.
  3. Consolidate scripts in `scripts/`: retain `clean-mock.js`, `clear-events.js`, `restore-guest.js`, `populate-production-ecosystem.ts`, and `run-live-deploy-tests.ts`, removing duplicate iterations (`clean-mock2.js`, `clear-events2.js`, `restore-from-guest.js`, `restore-from-guest2.js`, `_run.mjs`, `quick-check.mjs`).
  4. Finalize `.agent/` cleanup in Git to avoid confusion with `.agents/`.
- **Rationale:** Reduces repository noise, prevents developer confusion, and ensures cleaner CI/CD checkouts.

### Decision 2: Intra-Club Scrimmage & Dual-Squad Scorekeeping Architecture
- **Approach:**
  - In `LiveAnnotationsTable.tsx`, ensure that when an event has `isInternalScrimmage: true` or has both `teamId` and `awayTeamId`:
    - The `HOME` tab displays the roster of the home squad.
    - The `AWAY` tab displays the roster of the away squad (populated from the organization's master player pool).
    - Annotations from both sides increment individual stats for the respective athlete in `PlayerMatchStats`.
  - In `TournamentBracket.tsx` and match planners, ensure match cards display internal squad names cleanly (e.g., *Equipo A* vs *Equipo B*).

### Decision 3: Comprehensive Branding Dynamic Replacement
- **Approach:**
  - Replace static labels in `Landing.tsx` (bracket preview) with `${branding.orgShortName} vs Rival`.
  - Replace default venue in `Dashboard.tsx` with `${branding.location || 'Cancha Principal'}`.
  - In `generateManualPdf.ts` and `SystemManualModal.tsx`, ensure example mockups reflect `branding.orgName`.

## Risks / Trade-offs

- **[Risk] Deleting a script that might be referenced in CI or package.json:**
  → *Mitigation:* Audit `package.json` scripts and `.github/workflows/` before removing any script to ensure zero broken references.
- **[Risk] Broken TypeScript imports when updating branding references:**
  → *Mitigation:* Run `npm --workspace apps/web run build` after each file update to verify strict compilation.
