## Why

Following the transition to a single host organization model (White-Label), the platform needs a complete audit, repository cleanup, and full-stack synchronization. Specifically, tournament management must natively support both external competitions (host squads vs external rivals) and internal club scrimmages/tournaments (intra-squad fixtures such as Equipo A vs Equipo B) with full point-by-point annotations and individual statistical tracking for athletes on both sides of the scoreboard. Furthermore, leftover scratch logs, duplicate maintenance scripts, and lingering static labels must be purged to ensure maximum repository health, code cleanliness, and operational efficiency.

## What Changes

- **Intra-Club & Dual-Squad Tournament Optimization:** Strengthen tournament fixtures and live annotations to seamlessly support internal club scrimmages (`isInternalScrimmage: true`) where both HOME and AWAY teams are internal squads of the organization, automatically attributing goals, assists, and defensive blocks to athletes on both sides in consolidated statistics.
- **Dynamic Organization Identity Synchronization:** Replace remaining static strings and mockup club names in tournament bracket showcases (`Landing.tsx`), default match locations (`Dashboard.tsx`), and system manual generators (`generateManualPdf.ts`, `SystemManualModal.tsx`) with dynamic variables from `branding.ts`.
- **Root & Repository Depuration:** Remove obsolete scratch logs (`lint_output.txt`, `lint_output2.txt`), temporary scripts (`patch-test.js`, `test-guest.js`), unnecessary package lockfiles (`bun.lock`), and delete dead Git tracked artifacts from the deprecated `.agent/` directory in favor of `.agents/`.
- **Maintenance Scripts Consolidation:** Consolidate redundant maintenance scripts in `scripts/` (e.g., removing `clean-mock2.js`, `clear-events2.js`, `restore-from-guest2.js`, `_run.mjs`, and `quick-check.mjs` while keeping the authoritative base scripts).
- **End-to-End Data Flow Verification:** Verify that the full pipeline—from user registration and RBAC approval to roster line assignment, live technical desk annotations, WFDF Spirit of the Game (SOTG) scoring, and treasury accounting—functions cleanly without regressions.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `tournament-lines-matrix`: Adds formal requirements for intra-club dual-squad matches and internal scrimmage scorekeeping with unified player statistical tracking across both teams.
- `organization-white-label-and-branding`: Extends white-label dynamic identity requirements to tournament bracket showcases, venue presets, and documentation manuals.

## Impact

- **Frontend (`apps/web/src/pages/Landing.tsx`, `Dashboard.tsx`, `RosterTorneo.tsx`, `lib/generateManualPdf.ts`):** 100% dynamic organization identity and clearer scrimmage/squad indicators.
- **Maintenance & Root (`scripts/`, root directory):** Cleaner repository tree with zero duplicate or temporary scripts.
- **Git Tree:** Removal of obsolete `.agent/` tracking in favor of `.agents/`.
- **Database & Backend:** Zero schema breaking changes; full verification of existing Prisma relations for `Event`, `EventAnnotation`, and `PlayerMatchStats`.
