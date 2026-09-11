## 1. Repository Clean-up & Artifact Depuration

- [x] 1.1 Remove scratch logs (`lint_output.txt`, `lint_output2.txt`) and obsolete test scripts (`patch-test.js`, `test-guest.js`) from the repository root, verifying clean directory listing.
- [x] 1.2 Remove redundant `bun.lock` file and verify `package-lock.json` remains authoritative with `npm run test --workspace apps/api`.
- [x] 1.3 Consolidate duplicated scripts in `scripts/` (remove `clean-mock2.js`, `clear-events2.js`, `restore-from-guest.js`, `restore-from-guest2.js`, `_run.mjs`, `quick-check.mjs`), verifying remaining canonical scripts.
- [x] 1.4 Clean up deprecated `.agent/` Git tracking in favor of `.agents/`, verifying with `git status --short`.

## 2. Dynamic Identity & Complete Project Harmonization

- [x] 2.1 Update `apps/web/src/pages/Landing.tsx` tournament bracket showcase to use dynamic branding (`${branding.orgShortName}`), verifying clean preview rendering.
- [x] 2.2 Update `apps/web/src/pages/Dashboard.tsx` next match location fallback to use `branding.location`, verifying component compilation.
- [x] 2.3 Harmonize example club mockups in `apps/web/src/lib/generateManualPdf.ts` and `SystemManualModal.tsx` to reference `branding.orgName`, verifying PDF generation functions without errors.

## 3. Tournament Scrimmage & Dual-Squad Scorekeeping Polish

- [x] 3.1 Enhance `LiveAnnotationsTable.tsx` and `TournamentBracket.tsx` to ensure intra-club matches (`isInternalScrimmage: true`) clearly identify HOME vs AWAY squad rosters and attribute individual statistics accurately to the master player pool.
- [x] 3.2 Audit end-to-end data flow (user registration -> role approval -> squad assignment -> roster line convocatoria -> live match annotations -> statistics) and verify data consistency.

## 4. Verification and Quality Assurance

- [x] 4.1 Run full API test suite (`npm --workspace apps/api run test`) and verify 100% of test suites and tests pass with 0 errors.
- [x] 4.2 Run web client build (`npm --workspace apps/web run build`) to verify bundle generation without typing or lint errors.
