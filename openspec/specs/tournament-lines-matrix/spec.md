# tournament-lines-matrix Specification

## Purpose
Provides a tournament line balance matrix (Handlers, Cutters, Hybrids), interactive 7v7 line creation for O-Line and D-Line, stamina tracking, and official tournament roster export.

## Requirements

### Requirement: Positional Balance Matrix
The tournament roster SHALL categorize athletes into core tactical roles (Handler, Cutter, Hybrid) and display real-time distribution counts and squad balance indicators.

#### Scenario: Categorizing Roster by Roles
- **WHEN** a captain or coach views `/roster-torneo`
- **THEN** the system groups confirmed athletes into Handlers, Cutters, and Hybrids with count badges and role recommendations.

### Requirement: 7v7 Line Construction and Validation
The tournament roster SHALL provide an interactive 7-player line builder supporting Offensive Line (O-Line) and Defensive Line (D-Line) configurations.

#### Scenario: Creating an O-Line
- **WHEN** a coach selects up to 7 players for the O-Line
- **THEN** the system verifies the 7-player limit, computes the handler-to-cutter balance ratio, and saves the line configuration.

#### Scenario: Creating a D-Line
- **WHEN** a coach selects up to 7 players for the D-Line
- **THEN** the system validates the selection and displays the combined defensive ratings.

### Requirement: Official Tournament Roster Export
The system SHALL enable captains and admins to export the confirmed tournament squad list including jersey numbers, positions, and emergency contact information.

#### Scenario: Exporting Roster
- **WHEN** user clicks "Exportar Nómina Oficial"
- **THEN** a formatted CSV file of the tournament roster is generated and downloaded.

### Requirement: Squad-Based and Sporadic Event Roster Assembly
The tournament roster subsystem SHALL allow coaches and administrators to assemble, filter, and organize event rosters according to the host organization's internal squads and divisions (such as Equipo A, Equipo B, Femenino, and Mixto), enabling athletes from the master pool to be rostered into sporadic or event-specific squads.

#### Scenario: Assembling an Event Roster by Squad Division
- **WHEN** a team manager or coach accesses `/roster-torneo` for a tournament or match
- **THEN** the interface allows filtering athletes and assigning participants to the relevant internal squad division (e.g. Equipo A, Equipo B, Femenino, Mixto) for that event.

#### Scenario: Sporadic Multi-Squad Participation Across Events
- **WHEN** an athlete is assigned to an event-specific roster for a particular tournament
- **THEN** their participation and statistics are tracked within that event's squad context without restricting them from participating in different squad divisions in other events.

### Requirement: Intra-Club Dual-Squad Scrimmage and Tournament Scorekeeping
The tournament and match scorekeeping subsystem SHALL support internal scrimmages and intra-club tournament fixtures (`isInternalScrimmage: true`) between two internal squads of the host organization (such as Equipo A vs Equipo B), recording goals, assists, Callahan scores, and turnovers for athletes on both sides of the scoreboard (`HOME` and `AWAY`).

#### Scenario: Scoring Points in an Internal Club Scrimmage
- **WHEN** an annotator records a goal, assist, or defensive block in an internal club match
- **THEN** the system attributes the statistics directly to the corresponding athlete in the master player pool and updates the live match score for their squad.

#### Scenario: Consolidated Leaderboards for Dual-Squad Fixtures
- **WHEN** an internal match finishes and statistics are consolidated
- **THEN** individual performances from both the home and away squads are aggregated into the organization's leaderboards without data loss.


