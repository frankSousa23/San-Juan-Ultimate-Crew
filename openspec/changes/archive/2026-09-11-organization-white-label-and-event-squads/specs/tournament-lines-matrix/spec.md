## ADDED Requirements

### Requirement: Squad-Based and Sporadic Event Roster Assembly
The tournament roster subsystem SHALL allow coaches and administrators to assemble, filter, and organize event rosters according to the host organization's internal squads and divisions (such as Equipo A, Equipo B, Femenino, and Mixto), enabling athletes from the master pool to be rostered into sporadic or event-specific squads.

#### Scenario: Assembling an Event Roster by Squad Division
- **WHEN** a team manager or coach accesses `/roster-torneo` for a tournament or match
- **THEN** the interface allows filtering athletes and assigning participants to the relevant internal squad division (e.g. Equipo A, Equipo B, Femenino, Mixto) for that event.

#### Scenario: Sporadic Multi-Squad Participation Across Events
- **WHEN** an athlete is assigned to an event-specific roster for a particular tournament
- **THEN** their participation and statistics are tracked within that event's squad context without restricting them from participating in different squad divisions in other events.
