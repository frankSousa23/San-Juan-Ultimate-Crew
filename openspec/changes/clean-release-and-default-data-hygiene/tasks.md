## 1. Default Data & Seed Sanitization

- [x] 1.1 Update `apps/api/src/lib/mockDb.ts` to replace the 11 legacy teams with 4 clean intra-club squads (*Equipo A*, *Equipo B*, *Femenino*, *Mixto*), set initial account balances to 0, and clear `this.transactions = []`, verifying file syntax.
- [x] 1.2 Update `apps/api/prisma/seed.ts` to replace the 11 legacy teams with the 4 clean intra-club squads (*Equipo A*, *Equipo B*, *Femenino*, *Mixto*), verifying seeder syntax.
- [x] 1.3 Refactor maintenance scripts in `scripts/` (`restore-guest.js`, `clean-mock.js`) to remove injection of hardcoded transactions and ensure only clean defaults are maintained.

## 2. Release Versioning and Project Metadata

- [x] 2.1 Update `package.json` (root) to add `"version": "1.4.0"`, `"description"`, and `"keywords"`.
- [x] 2.2 Update `apps/web/package.json` and `apps/api/package.json` to version `"1.4.0"`.
- [x] 2.3 Update `apps/web/index.html` to modernize the `<title>` and `<meta name="description">` to represent the generic SIGEDIVO white-label platform.
- [x] 2.4 Update residual hosting notes in `docs/presentacion_sigedivo_publico.html` and `docs/ARQUITECTURA_Y_CODIGO.md` to reference Docker Compose / Autohospedado.

## 3. Verification & Release Launch

- [x] 3.1 Execute `npm test` to verify all 23 Vitest test suites (145 tests) pass against the sanitized default data baseline.
- [x] 3.2 Execute `npm run build` to verify clean compilation of both `@sigedivo/web` and `@sigedivo/api`.
- [x] 3.3 Commit changes, create annotated git tag `v1.4.0`, and push commit and tag to `origin/main`.
