## Context

See `proposal.md` for motivation and background.
The system currently uses two data layers: Prisma ORM (production PostgreSQL) and `mockDb.ts` (local dev & testing fallback). Additionally, maintenance scripts in `scripts/` (`clean-mock.js`, `restore-guest.js`, `clear-events.js`) were previously used during rapid testing to regex-patch `mockDb.ts`, leaving lingering dummy accounts and mock financial transactions.
To ensure the repository is 100% aligned with the single-club white-label standard upon release, the initial seed data and fallback data must represent clean intra-club squads (*Equipo A*, *Equipo B*, *Femenino*, *Mixto*) and pristine zero-balance accounts.

## Goals / Non-Goals

**Goals:**
- Replace the legacy 11 external club seeds in `prisma/seed.ts` and `mockDb.ts` with 4 standardized intra-club squads (*Equipo A - Open*, *Equipo B - Desarrollo*, *Femenino*, *Mixto*).
- Reset initial accounts in `mockDb.ts` (*Caja Chica*, *Cuenta Bancaria*) to balance 0 cents with an empty transactions array `[]`.
- Neutralize regex-injection in `scripts/restore-guest.js` so it only ensures the guest user/role exists without injecting mock accounts or transactions into code.
- Synchronize all package descriptors (`package.json`, `@sigedivo/web`, `@sigedivo/api`) to `1.4.0` with the official SIGEDIVO description.
- Update `apps/web/index.html` with generic metadata.
- Verify that all 23 Vitest test suites (145 tests) pass with 100% success against this clean baseline.

**Non-Goals:**
- Modifying the core Prisma database schema (tables, foreign keys, and indexes remain unchanged).
- Removing official rivals (*Comunidad El Oso*, *Revolution Ultimate*, *Discolocos*), which are valid external opposing teams for tournament play.
- Altering the playbook tactic drills or WFDF rules documents, which are essential sports knowledge assets.

## Decisions

1. **Intra-Club Squad Presets in Seeder & MockDb:**
   - *Decision:* Configure 4 internal squads:
     - Squad 1: *Equipo A (Open)* - Tag: `EQA` - Color: `#111827`
     - Squad 2: *Equipo B (Desarrollo)* - Tag: `EQB` - Color: `#0284c7`
     - Squad 3: *Femenino* - Tag: `FEM` - Color: `#ec4899`
     - Squad 4: *Mixto* - Tag: `MIX` - Color: `#10b981`
   - *Rationale:* Reflects the single host club reality where athletes belong to the same club pool and compete in internal categories or scrimmages.
   - *Alternative considered:* Leaving teams completely empty (`[]`). Rejected because new users exploring in Guest or Admin mode need at least baseline squads to test match planning and rosters.

2. **Clean Zero-Balance Financial Accounts:**
   - *Decision:* Maintain the two standard accounts (*Caja Chica* and *Cuenta Bancaria*) but with `balanceCents: 0` (or `balance: 0.00`) and `this.transactions = []`.
   - *Rationale:* When a club launches SIGEDIVO, their financial ledger starts clean. `finances.test.ts` validates `balance = income - expense` which holds true with $0 ($0 = $0 - $0).

3. **Release Version Alignment:**
   - *Decision:* Align all version fields to `1.4.0` across the monorepo workspaces and tag git as `v1.4.0`.
   - *Rationale:* Accurately matches the badge in `README.md` and reflects SemVer minor bump with major feature sets.

## Risks / Trade-offs

- **[Risk]** A test might assume `teamId: 1` or specific team names exist.
  - **Mitigation:** Verified that existing Vitest suites either mock team creation or reference `teamId: 1`, which will still exist as *Equipo A*. Ran grep to ensure no test hardcodes *MotherFlowers* or *Medusa*.
- **[Risk]** `scripts/restore-guest.js` re-introducing old mock accounts if executed.
  - **Mitigation:** Refactor `restore-guest.js` to ensure it only manages the guest user/role without appending fake transactions.
