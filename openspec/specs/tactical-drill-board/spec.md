# tactical-drill-board Specification

## Purpose
Provides official WFDF tactical drill boards with interactive simulations of Vertical Stack offense, break-side cut progressions, and zone defenses on regulation playing fields.

## Requirements

### Requirement: Vertical Stack Drill Simulation
The tactical playbook SHALL provide a preconfigured "Vertical Stack Offense & Break-Side Cut" drill board containing 7 offensive positions (Handlers O1/Reset, Stack O5/O6/O7, Cutters O3/O4), opposing tight defensive marks (X), movement paths, and animated disc throw trajectories.

#### Scenario: Viewing Vertical Stack Drill
- **WHEN** a user navigates to `/jugadas` and selects the "Vertical Stack: Corte al Break-side" play
- **THEN** the tactical canvas renders all 7 offensive players with their role designations, defensive marks, throw trajectory to O4, and the movement vector for O3 clearing space.

#### Scenario: Running Drill Animation
- **WHEN** a coach clicks the "Simular Corte / Animar Jugada" action on the tactical board
- **THEN** the canvas animates the cut movement of cutter O4 toward the endzone and the disc flight path from handler O1 to O4.

### Requirement: Zone Defense 3-3-1 Tactical Formation
The tactical playbook SHALL provide a preconfigured "Defensa Zonal 3-3-1 (Cup, Wall, Deep)" preset diagramming the 3 cup marks, 3 wall containment defenders, and 1 deep-deep defender relative to wind and field zones.

#### Scenario: Selecting Zone Defense Preset
- **WHEN** a user filters plays by category `DEFENSE` and chooses "Defensa Zona: 3-3-1 Cup"
- **THEN** the tactical canvas displays the distinct Cup, Wall, and Deep zones with positional labels and defensive coverage angles.

### Requirement: Regulation WFDF Field Canvas
The interactive tactical board and free whiteboard SHALL display field proportions consistent with the WFDF rulebook, including marked 70-yard playing field proper, 40-yard width, endzones, and brick marks.

#### Scenario: Displaying Regulation Field Lines
- **WHEN** any tactical board view is opened
- **THEN** the board renders endzone boundary lines, brick marks, and yardage indicators.
