## Purpose

Defines compound database indexes for high-frequency tournament participants, match annotations, and team user status lookups.

## ADDED Requirements

### Requirement: Composite EventParticipant Indexing
The Prisma schema SHALL include compound indexes on `EventParticipant` for `[eventId, teamSide]` and `[eventId, lineType]` to accelerate roster matrix operations.

#### Scenario: Querying Tournament Lines by Side
- **WHEN** the system queries participants for a specific match and team side
- **THEN** the query utilizes the compound index `[eventId, teamSide]`.

### Requirement: Composite Annotation Aggregation Indexing
The Prisma schema SHALL include a compound index on `EventAnnotation` for `[eventId, type]` to accelerate match scoring calculations.

#### Scenario: Compiling Match Scores
- **WHEN** the system calculates goals, assists, and turnovers for an event
- **THEN** the query utilizes the compound index `[eventId, type]`.

### Requirement: Team User Status Indexing
The Prisma schema SHALL include a compound index on `User` for `[teamId, status]`.

#### Scenario: Listing Active Team Users
- **WHEN** the system lists members of a team by approval status
- **THEN** the query utilizes the compound index `[teamId, status]`.
