## Purpose

Provides a 5-axis pentagonal skill radar chart, core role metrics for Handlers and Cutters, tactical efficiency gauges, and longitudinal team performance trends.

## ADDED Requirements

### Requirement: 5-Axis Pentagonal Skill Radar
The system SHALL calculate and display an interactive 5-axis pentagonal radar chart for teams and players, measuring Catching, Throwing, Defense, Spirit of the Game (SOTG), and Stamina on a normalized 0-100 scale.

#### Scenario: Visualizing Team Skill Radar
- **WHEN** a user visits `/dashboard`
- **THEN** the dashboard renders the team average pentagonal radar polygon overlaid with grid lines and labeled vertices (Catching, Throwing, Defense, Spirit, Stamina).

#### Scenario: Inspecting Individual Player Radar
- **WHEN** a user navigates to `/estadisticas` or selects an athlete in `/roster`
- **THEN** the system displays the athlete's individual 5-axis polygon compared against the squad benchmark.

### Requirement: Core Roles Specialization Analytics
The dashboard SHALL categorize and display specialized performance indicators differentiated by core Ultimate roles: Handlers and Cutters.

#### Scenario: Displaying Handler Metrics
- **WHEN** the Handler breakdown card is viewed
- **THEN** the system displays throwing accuracy percentage, assist counts, reset completion rate, and stall-out resistance under mark pressure.

#### Scenario: Displaying Cutter Metrics
- **WHEN** the Cutter breakdown card is viewed
- **THEN** the system displays catching reliability percentage, goal scores, separation speed ratings, and deep-cut completion rate.

### Requirement: Tactical Efficiency Gauges
The dashboard and statistics views SHALL provide visual gauges for Huck Accuracy (percentage of successful passes exceeding 30 yards) and Stall-out Resistance (percentage of possessions resolved before stall count reaches 7).

#### Scenario: Viewing Tactical Gauges
- **WHEN** an authenticated user opens `/dashboard` or `/estadisticas`
- **THEN** the UI displays circular or radial gauges for Huck Accuracy and Stall-out Resistance with status colors (e.g. green for >75%, amber for 60-75%, red for <60%).
