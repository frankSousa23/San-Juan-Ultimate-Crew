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
