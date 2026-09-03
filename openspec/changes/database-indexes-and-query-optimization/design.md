## Context

See `proposal.md` for motivation.
`apps/api/prisma/schema.prisma` defines models for PostgreSQL and Prisma ORM.

## Goals / Non-Goals

**Goals:**
- Add `[eventId, teamSide]` and `[eventId, lineType]` compound indexes to `EventParticipant`.
- Add `[eventId, type]` compound index to `EventAnnotation`.
- Add `[teamId, status]` compound index to `User`.
- Validate schema syntax with Prisma CLI.
- Ensure all 143 tests pass.

**Non-Goals:**
- Modifying column data types or enum definitions.

## Decisions

### Decision 1: Targeting Frequent Composite Queries
Compound indexes are aligned precisely with `findMany` filters in `events.ts`, `annotations.ts`, and `RosterTorneo.tsx`:
- `where: { eventId, teamSide }`
- `where: { eventId, type }`
- `where: { teamId, status }`

## Risks / Trade-offs

- **[Risk] Index overhead during writes:** Excessive indexes can slightly slow bulk inserts.
  - *Mitigation:* The added indexes are lean (integer + enum/varchar) and apply to tables with high read-to-write ratios.
