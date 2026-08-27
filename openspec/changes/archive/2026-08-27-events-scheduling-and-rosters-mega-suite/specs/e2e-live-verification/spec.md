## ADDED Requirements

### Requirement: Multi-Stage Event Hierarchy and Scaled Scheduling
El sistema DEBE soportar la creación y programación de torneos oficiales con fixtures jerárquicos multietapa (`GROUP_STAGE`, `SEMI_FINALS`, `THIRD_PLACE`, `FINALS`), garantizando la integridad de fechas (`startsAt`, `endsAt`), sedes y asociación con el evento padre.

#### Scenario: Batch fixtures scheduled across multiple stages
- **WHEN** el administrador o directiva programa fixtures masivos para un torneo
- **THEN** los eventos hijos se crean enlazados con `parentId`, conservando sus categorías de partido y horarios respectivos.

### Requirement: High-Density Multi-Club Rosters and Jersey Uniqueness
El sistema DEBE soportar la creación masiva de atletas asignados a sus respectivos clubes con validación estricta de unicidad de dorsal por equipo y tolerancia de duplicados entre clubes distintos.

#### Scenario: Mass player creation with team number uniqueness
- **WHEN** se crean múltiples atletas en lotes paralelos para distintos clubes
- **THEN** el sistema registra a cada atleta con su posición y rechaza cualquier colisión de dorsal dentro del mismo club.

### Requirement: Event Tactical Lineup and Reinforcement Policy
El sistema DEBE permitir convocar nóminas completas a eventos deportivos (`EventParticipant`) asignando líneas tácticas (`O-Line`, `D-Line`, `Flex`), exigiendo que los atletas pertenezcan al equipo o estén explícitamente marcados como refuerzo (`isRefuerzo: true`).

#### Scenario: Tactical squad lineup assigned with reinforcement validation
- **WHEN** el capitán o directiva convoca atletas a un partido oficial
- **THEN** las líneas tácticas quedan asentadas y los refuerzos quedan claramente identificados para el cómputo de estadísticas.

### Requirement: Mass Attendance and Attendance Lifecycle Audit
El sistema DEBE procesar pases de lista masivos en entrenamientos y partidos, registrando los estados de asistencia (`present`, `late`, `absent`, `injured`) y vinculando las notas de justificación.

#### Scenario: Coach performs mass attendance roll call
- **WHEN** el entrenador asienta la asistencia de la plantilla completa para una sesión de entrenamiento
- **THEN** los registros de asistencia quedan persistidos y disponibles para métricas de disciplina.
