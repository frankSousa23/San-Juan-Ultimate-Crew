## Context

See `proposal.md` for background motivation.
`apps/web/src/pages/RosterTorneo.tsx` manages confirmed tournament rosters. Coaches and captains require a clear visual tool to structure the 7v7 on-field lines (O-Line and D-Line) and verify balanced distributions of Handlers, Cutters, and Hybrids.

## Goals / Non-Goals

**Goals:**
- Implement a Positional Balance Matrix displaying total Handlers, Cutters, and Hybrids in the tournament squad.
- Add an interactive 7-player Line Builder for:
  - **O-Line (Línea Ofensiva):** Recommended configuration of 3 Handlers + 4 Cutters.
  - **D-Line (Línea Defensiva):** Recommended configuration of 2 Handlers + 3 Cutters + 2 Hybrids/Defenders.
- Add a Quick Roster Export button generating official CSV files for tournament organizers.

**Non-Goals:**
- Real-time GPS player tracking.

## Decisions

### Decision 1: Client-Side State with LocalStorage Persistence
Line configurations are cached under `tournament.lines.${eventId}` in `localStorage` with automatic sync to tournament player list, ensuring fast offline-capable line calling during match breaks.

### Decision 2: Role Inference and Tagging
Athletes without an explicit position default to positional inference based on their number and play stats (e.g. high assists -> Handler, high goals -> Cutter, balanced -> Hybrid).

## Risks / Trade-offs

- **[Risk] Roster size < 7:** When less than 7 athletes are confirmed for an event.
  - *Mitigation:* Visual warning banner and disabled line activation until at least 7 players confirm attendance.
