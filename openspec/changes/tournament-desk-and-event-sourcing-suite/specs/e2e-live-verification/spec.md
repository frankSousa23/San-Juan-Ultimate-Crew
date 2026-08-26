## ADDED Requirements

### Requirement: Scorekeeper Mathematical Consistency and Event Sourcing
El sistema DEBE garantizar que la sumatoria de goles registrados en las anotaciones play-by-play coincida de forma exacta con los contadores del marcador del partido (`scoreHome` y `scoreAway`), actualizándose en tiempo real con cada evento emitido.

#### Scenario: Goals aggregate matches match scoreboard
- **WHEN** la mesa técnica registra una secuencia de anotaciones para el equipo local y el equipo visitante
- **THEN** la consulta del evento (`GET /api/events/:id`) refleja los marcadores correspondientes idénticos al conteo acumulado de anotaciones.

### Requirement: Callahan Special Scoring and Defense Dual Tracking
El sistema DEBE permitir registrar una jugada de tipo Callahan (intercepción defensiva que resulta directamente en gol en la zona de anotación rival) computando simultáneamente el gol y la defensa para el mismo atleta sin requerir asistencia asociada.

#### Scenario: Callahan recorded on live table
- **WHEN** se registra una anotación con tipo `GOAL`, línea `D-Line` y sin `relatedPlayerId` indicada como Callahan
- **THEN** el sistema incrementa el marcador en +1 y las estadísticas individuales del atleta acreditan tanto el gol como la defensa.

### Requirement: Point Cancellation and Score Recalculation
El sistema DEBE permitir anular o eliminar una anotación errónea (por ejemplo, punto revocado por llamado de foul o fuera de banda), recalculando inmediatamente el marcador oficial y descontando las estadísticas del atleta.

#### Scenario: Scorekeeper deletes mistakenly registered goal
- **WHEN** el anotador oficial o administrador elimina una anotación mediante `DELETE /api/annotations/:id`
- **THEN** el sistema descuenta el punto del marcador del partido y la anotación deja de figurar en el reporte individual.

### Requirement: Guest and Reinforcement Atomic Merging Lifecycle
El sistema DEBE permitir fusionar atómicamente el historial de anotaciones de un jugador invitado o refuerzo temporal registrado por nombre libre hacia una cuenta de atleta formalmente creada y aprobada.

#### Scenario: Admin merges guest points to approved player account
- **WHEN** el administrador ejecuta `POST /api/annotations/merge-guest` con el nombre temporal y el nuevo `playerId`
- **THEN** todas las anotaciones históricas quedan reasignadas al nuevo atleta y son consultables en su perfil oficial.

### Requirement: WFDF Spirit of the Game (SOTG) Multi-Dimensional Scoring Engine
El sistema DEBE procesar y almacenar la evaluación de Espíritu de Juego (SOTG) en sus 5 dimensiones reglamentarias WFDF (Reglas, Faltas, Imparcialidad, Actitud, Comunicación), calculando la puntuación total (0-20) e integrándola en el promedio del torneo.

#### Scenario: Official annotator submits post-match SOTG sheet
- **WHEN** el anotador envía la planilla SOTG al endpoint `/api/annotations/sotg` tras la finalización del partido
- **THEN** el sistema persiste los 5 puntajes, calcula el total y actualiza el ranking de Espíritu del torneo.
