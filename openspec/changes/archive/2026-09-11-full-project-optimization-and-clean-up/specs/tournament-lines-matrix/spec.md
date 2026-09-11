## ADDED Requirements

### Requirement: Intra-Club Dual-Squad Scrimmage and Tournament Scorekeeping
The tournament and match scorekeeping subsystem SHALL support internal scrimmages and intra-club tournament fixtures (`isInternalScrimmage: true`) between two internal squads of the host organization (such as Equipo A vs Equipo B), recording goals, assists, Callahan scores, and turnovers for athletes on both sides of the scoreboard (`HOME` and `AWAY`).

#### Scenario: Scoring Points in an Internal Club Scrimmage
- **WHEN** an annotator records a goal, assist, or defensive block in an internal club match
- **THEN** the system attributes the statistics directly to the corresponding athlete in the master player pool and updates the live match score for their squad.

#### Scenario: Consolidated Leaderboards for Dual-Squad Fixtures
- **WHEN** an internal match finishes and statistics are consolidated
- **THEN** individual performances from both the home and away squads are aggregated into the organization's leaderboards without data loss.
