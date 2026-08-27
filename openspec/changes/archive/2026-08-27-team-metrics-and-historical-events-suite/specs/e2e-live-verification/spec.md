## ADDED Requirements

### Requirement: Team Metrics Aggregation and Entity Counting
El sistema DEBE resolver e incluir los conteos agregados (`_count: { players, users, events }`) al consultar el catálogo de equipos (`GET /api/teams`), garantizando que la vista de administración de equipos refleje las cantidades reales de miembros y eventos de cada club.

#### Scenario: Admin views teams listing with real entity counts
- **WHEN** un usuario consulta `GET /api/teams`
- **THEN** la respuesta incluye `_count` con valores numéricos no nulos representando los atletas, usuarios y eventos asociados a cada equipo.

### Requirement: Completed Match Player Statistics Aggregation
El sistema DEBE acumular y servir las estadísticas históricas individuales (`goals`, `assists`, `defenses`, `turnovers`, `pointsPlayed`) de los atletas en partidos concluidos (`status: 'COMPLETED'`), haciéndolas consultables en `/api/stats` y en el perfil de cada jugador.

#### Scenario: Player match statistics computed across completed events
- **WHEN** se consulta el resumen estadístico de un atleta con historial de partidos finalizados
- **THEN** el sistema retorna la sumatoria consolidada de sus goles, asistencias, bloqueos y puntos jugados.
