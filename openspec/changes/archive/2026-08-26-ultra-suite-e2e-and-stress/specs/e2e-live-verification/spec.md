## ADDED Requirements

### Requirement: Educational Resources and Multimedia Document Library
El sistema DEBE permitir la creación, clasificación (`RULEBOOK`, `DRILL_VIDEO`, `TACTICAL_DOC`) y consulta por tags de recursos multimedia y reglamentos deportivos, restringiendo la administración exclusivamente a roles autorizados (`coach`, `admin`, `directiva`).

#### Scenario: Coach publishes training drill and players search by tags
- **WHEN** un entrenador crea un recurso de video con tags y un jugador realiza una búsqueda filtrada
- **THEN** el sistema persiste el recurso y lo retorna en las búsquedas por etiquetas, bloqueando ediciones por parte de usuarios sin permisos administrativos.

### Requirement: Real-Time Event Channels and Chat Messaging
El sistema DEBE proveer canales de comunicación vinculados a eventos y permitir la emisión y consulta cronológica de mensajes entre atletas y personal del club.

#### Scenario: Participants send and retrieve match channel messages
- **WHEN** un capitán y un jugador publican mensajes en el canal del evento
- **THEN** el sistema persiste los mensajes en `Message` y retorna el historial ordenado cronológicamente.

### Requirement: Official WFDF Spirit of the Game (SOTG) Assessment
El sistema DEBE permitir el registro de planillas oficiales de Espíritu de Juego (SOTG) evaluando las 5 dimensiones normativas de la WFDF (Reglas, Faltas y Contacto, Imparcialidad, Actitud Positiva y Comunicación) en una escala de 0 a 4 puntos por criterio con comentarios cualitativos.

#### Scenario: Submitting complete SOTG score sheet
- **WHEN** se envía una planilla de evaluación de espíritu de juego para un partido con puntajes en las 5 dimensiones
- **THEN** el sistema almacena el registro en `SpiritScore` y vincula la calificación al evento correspondiente.

### Requirement: Tournament Leaderboards and Advanced Player Statistics
El sistema DEBE calcular y presentar tablas de líderes individuales (Top Goleadores, Top Asistencias, Top Defensas) y métricas de rendimiento acumulado para el torneo.

#### Scenario: Querying tournament leaderboards
- **WHEN** se consulta el endpoint de estadísticas consolidadas `/api/stats`
- **THEN** el sistema retorna los rankings de rendimiento individual calculados a partir de las anotaciones oficiales del torneo.

### Requirement: Batch Fixture Scheduling and Championship Progression
El sistema DEBE permitir la creación masiva de partidos dependientes mediante `batchFixtures` y soportar la progresión de estados del torneo hasta su conclusión final (`COMPLETED`).

#### Scenario: Batch scheduling and closing championship
- **WHEN** el administrador genera el fixture completo de fases (grupos, semifinales y final) y marca el torneo como completado
- **THEN** el sistema persiste la estructura completa de partidos hijos y actualiza el estado global del evento padre.

### Requirement: Extreme Concurrency and High-Throughput Stress Benchmarking
El sistema DEBE procesar ráfagas extremas de 50 peticiones de lectura concurrentes y 20 escrituras simultáneas en ráfaga manteniendo una tasa de éxito del 100% y latencias estables.

#### Scenario: Extreme multi-endpoint load burst
- **WHEN** se ejecutan 50 lecturas concurrentes y 20 escrituras atómicas simultáneas
- **THEN** el servidor responde a todas las peticiones con códigos 2xx sin caídas de servicio.
