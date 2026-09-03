# medical-return-to-play Specification

## Purpose
Establishes the sports clearance semaphore (Apto, Limitado, Baja Médica), injury recovery estimation, and graduated Return-to-Play readaptation protocols.

## Requirements

### Requirement: Sports Clearance Semaphore
The system SHALL classify and display each athlete's physical readiness status with visual semaphore indicators: Apto (Full Clearance), Limitado (Conditional Clearance), and Baja Médica (Medical Leave).

#### Scenario: Displaying Clearance Status
- **WHEN** user visits `/lesiones` or views player profile in `/roster`
- **THEN** the system displays the athlete's current clearance badge with corresponding status color (green, amber, or red).

### Requirement: Estimated Recovery Timeline
The medical record module SHALL calculate and display remaining recovery days and projected return dates based on diagnosis and injury severity.

#### Scenario: Calculating Days Remaining
- **WHEN** an injury record with an expected recovery date is displayed
- **THEN** the system calculates remaining days until projected return and displays a recovery progress percentage.

### Requirement: Return-to-Play Readaptation Checklist
The system SHALL provide a structured 5-stage Return-to-Play (RTP) progression protocol for recovering athletes.

#### Scenario: Tracking RTP Stages
- **WHEN** medical staff reviews an ongoing injury in `/lesiones`
- **THEN** the system displays completion checkboxes for the 5 RTP phases (Reposo, Movilidad, Carrera, Sin Contacto, Alta Competitiva).
