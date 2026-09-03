# Capability: e2e-live-verification

## Purpose

Proveer una suite de verificación y pruebas automatizadas de extremo a extremo que evalúa el ciclo de vida completo de los datos, el control de acceso basado en roles (RBAC), el aislamiento multi-equipo y la lógica deportiva en el despliegue activo de SIGEDIVO.

## Requirements

### Requirement: Admin Authentication and Session Validation
El sistema DEBE permitir la autenticación del usuario administrador principal y emitir un token JWT válido con rol `admin` para autorizar las operaciones críticas de configuración.

#### Scenario: Admin login with valid credentials
- **WHEN** se envían las credenciales de administrador válidas al endpoint `/api/auth/login`
- **THEN** el sistema retorna código HTTP 200, un token JWT y los datos del usuario con el rol `admin`.

### Requirement: Multi-Team User Registration and Role Request Flow
El sistema DEBE permitir el registro de nuevos usuarios asignándolos a equipos específicos y gestionando sus solicitudes de roles de forma aislada.

#### Scenario: User registers and requests team role
- **WHEN** un nuevo usuario se registra con email, nombre y solicita un equipo específico con rol `player` o `captain`
- **THEN** el sistema crea la cuenta en estado `PENDING` y genera la solicitud de rol asociada al equipo seleccionado.

### Requirement: Admin User Approval and Role Assignment
El sistema DEBE permitir a los administradores revisar, aprobar o rechazar usuarios pendientes, asignando formalmente sus roles en el sistema.

#### Scenario: Admin approves pending user
- **WHEN** el administrador envía una solicitud de aprobación con el ID del usuario y los roles autorizados
- **THEN** el usuario cambia a estado `APPROVED`, se le asignan los roles correspondientes y puede autenticarse para acceder a sus funciones permitidas.

### Requirement: Team Roster Management and Multi-Tenancy Isolation
El sistema DEBE permitir gestionar atletas en el roster y garantizar que los usuarios no administradores solo tengan visibilidad y control sobre los atletas de su propio equipo.

#### Scenario: Captain manages team roster
- **WHEN** un usuario con rol de capitán crea un atleta con dorsal único en su equipo
- **THEN** el atleta se crea exitosamente y el capitán puede listar y actualizar a los atletas de su club.

#### Scenario: Strict team isolation
- **WHEN** un usuario de un Equipo A consulta el roster o intenta modificar a un atleta perteneciente al Equipo B
- **THEN** el sistema no incluye los atletas del Equipo B en sus consultas y deniega cualquier modificación cruzada no autorizada.

### Requirement: Tournament Creation and Match Hierarchy
El sistema DEBE permitir la creación de eventos de tipo torneo (`TOURNAMENT`) y la programación jerárquica de partidos dependientes (`MATCH` / `GROUP_STAGE` / `FINALS`) con horarios y sedes.

#### Scenario: Scheduling tournament and child matches
- **WHEN** el administrador crea un torneo padre y programa partidos asociados entre equipos participantes con anotador oficial asignado
- **THEN** el sistema persiste la jerarquía de eventos con el campo `parentId` vinculado al torneo padre y calcula el calendario correctamente.

### Requirement: Live Game Annotations and SOTG Scoring
El sistema DEBE registrar las acciones de juego en vivo (Goles, Asistencias, Defensas, Turnovers), actualizar el marcador del partido y almacenar las calificaciones de Espíritu de Juego (SOTG).

#### Scenario: Technical table records game points and spirit score
- **WHEN** el anotador oficial registra una secuencia de anotaciones con jugador, tipo de jugada y línea táctica (O-Line/D-Line), seguido de la planilla SOTG
- **THEN** el sistema actualiza el marcador en tiempo real, persiste las estadísticas individuales en `PlayerMatchStats` y guarda el `SpiritScore`.

### Requirement: Treasury and Financial Transaction Validation
El sistema DEBE permitir la creación de cuentas contables, categorías de ingresos y egresos, registro de transacciones financieras y cálculo automático del balance consolidado con restricciones RBAC exclusivas para `treasurer` y `admin`.

#### Scenario: Treasurer records financial movements
- **WHEN** un usuario con rol `treasurer` crea una cuenta, categorías de flujo y registra transacciones de ingreso y gasto
- **THEN** el sistema persiste las transacciones y el resumen general `/api/transactions/summary/overall` calcula correctamente los totales de ingresos, egresos y saldo neto.

#### Scenario: Non-treasurer forbidden from financial operations
- **WHEN** un usuario con rol `player` o `annotator` intenta crear o modificar transacciones contables
- **THEN** el servidor deniega la operación retornando código HTTP 403 Forbidden.

### Requirement: Medical Injury Life-cycle and Roster Status Impact
El sistema DEBE gestionar el historial médico de lesiones de los atletas, clasificando su severidad y actualizando el estado de disponibilidad del jugador entre `ACTIVE`, `INJURED` y `RECOVERING`.

#### Scenario: Registering and resolving player injury
- **WHEN** se reporta una lesión activa para un atleta y posteriormente se actualiza su estado médico a `RESOLVED`
- **THEN** el sistema registra el evento médico en `Injury` y restaura el estado del atleta a `ACTIVE` tras el alta médica.

### Requirement: Rival Scouting and Opponent Scoring
El sistema DEBE permitir registrar clubes rivales, almacenar fichas técnicas de atletas oponentes y computar anotaciones efectuadas por rivales en partidos oficiales.

#### Scenario: Creating rival and registering opponent point
- **WHEN** se crea un club rival con sus jugadores y la mesa técnica registra un gol a favor del equipo visitante utilizando `opponentPlayerName` o `rivalPlayerId`
- **THEN** el marcador del partido incrementa para el equipo visitante sin alterar las estadísticas individuales de los atletas locales.

### Requirement: Tactical Playbook Management
El sistema DEBE permitir a entrenadores y directiva crear, clasificar (`OFFENSE`, `DEFENSE`, `DRILL`) y consultar jugadas tácticas con diagramas y descripciones.

#### Scenario: Creating and querying tactical plays
- **WHEN** un entrenador crea una jugada táctica ofensiva y consulta el listado filtrando por categoría
- **THEN** el sistema persiste la jugada y la retorna correctamente en las búsquedas categorizadas.

### Requirement: News Forum, Community Comments and Channel Messaging
El sistema DEBE soportar la publicación de noticias institucionales fijadas (`isPinned`), comentarios de usuarios autenticados, control de bloqueo de comentarios y mensajería en canales de eventos.

#### Scenario: Publishing news post and submitting comments
- **WHEN** se publica una noticia fijada y usuarios de diferentes roles envían comentarios
- **THEN** los comentarios se asocian al post con el nombre y rol del autor, y se bloquean nuevas respuestas si el post se marca como `commentsLocked`.

### Requirement: Mesa Técnica Setup, Locks and Live Shift Handover
El sistema DEBE permitir la configuración del personal de mesa técnica, el bloqueo de acta oficial (`isAnnotatorLocked`) y el relevo en caliente de anotadores oficiales (`shift-change`).

#### Scenario: Official shift handover during match
- **WHEN** el anotador oficial activo ejecuta un relevo de turno hacia otro usuario autorizado mediante `/api/events/:id/mesa-tecnica/shift-change`
- **THEN** el campo `officialAnnotatorId` del evento se actualiza inmediatamente transfiriendo la potestad de registro al nuevo anotador.

### Requirement: Field Attendance and Punctuality Tracking
El sistema DEBE registrar la asistencia y puntualidad de los atletas a eventos y prácticas mediante los estados `present`, `late` y `absent`.

#### Scenario: Recording event attendance
- **WHEN** se registra el pase de lista para los participantes de un evento con estados de presencia y notas de retardo
- **THEN** el sistema almacena el registro en `Attendance` y permite auditar el porcentaje de asistencia.

### Requirement: Account Security, Reset Links and User Feedback
El sistema DEBE permitir a los administradores generar enlaces seguros de reseteo de contraseña y ofrecer un canal centralizado para recepción de feedback sobre fallos y sugerencias.

#### Scenario: Generating reset token and submitting user feedback
- **WHEN** el administrador genera un enlace de reseteo para un usuario y un atleta envía un reporte de bug o sugerencia a `/api/feedback`
- **THEN** se genera un token criptográfico único con vigencia de 24 horas y el feedback queda registrado en el buzón administrativo.

### Requirement: Load and Concurrency Stress Benchmarking
El sistema DEBE procesar ráfagas de peticiones concurrentes de lectura y escritura manteniendo una tasa de éxito del 100% (0% de errores 5xx) y una latencia promedio inferior a 1500ms bajo carga distribuida.

#### Scenario: Concurrent annotations and stats querying
- **WHEN** se ejecutan múltiples peticiones simultáneas de registro de anotaciones y consultas de estadísticas
- **THEN** el servidor procesa todas las transacciones de forma atómica sin condiciones de carrera y reporta métricas de latencia p50, p95 y tasa de éxito.

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

### Requirement: Negative RBAC Security Matrix Validation
El sistema DEBE rechazar de forma estricta (código HTTP 403 Forbidden / 401 Unauthorized) todas las operaciones que excedan los privilegios definidos para cada rol (`player`, `coach`, `captain`, `treasurer`, `annotator`, `marketing`, `directiva`, `guest`).

#### Scenario: Non-treasurer roles blocked from financial accounts and transactions
- **WHEN** un usuario con rol `player`, `coach` o `captain` intenta crear una cuenta contable (`POST /api/finances/accounts`) o registrar un movimiento de caja
- **THEN** el sistema rechaza la petición con código HTTP 403 Forbidden y mensaje de error de permisos insuficientes.

#### Scenario: Non-admin roles blocked from administrative user approval and role escalation
- **WHEN** un usuario con rol `treasurer`, `player` o `annotator` intenta aprobar un usuario pendiente (`PATCH /api/users/:id/approval`) o alterar roles administrativos
- **THEN** el sistema rechaza la petición con código HTTP 403 Forbidden.

### Requirement: Guest User Mutation Immunity Enforcement
El sistema DEBE garantizar que las sesiones asociadas al rol `guest` o al usuario de demostración pública no puedan realizar mutaciones en la base de datos (creación, edición o eliminación de registros).

#### Scenario: Guest user attempts mutation operations
- **WHEN** el usuario de demostración (`guest`) envía solicitudes `POST`, `PUT`, `PATCH` o `DELETE` a los endpoints de atletas, eventos, finanzas o configuraciones
- **THEN** el sistema bloquea la mutación retornando código HTTP 403 Forbidden o 401 Unauthorized sin alterar los datos persistidos.

### Requirement: Cross-Role Medical Injury to Tactical Line Convocatoria Workflow
El sistema DEBE conectar el ciclo de vida médico con la convocatoria táctica, de modo que el registro de una lesión médica modifique la visibilidad y disponibilidad del atleta para el armado de líneas (O-Line / D-Line).

#### Scenario: Coach reports injury and captain reviews tactical readiness
- **WHEN** el entrenador registra una lesión de severidad moderada o severa para un atleta en `/api/injuries`
- **THEN** el estado de salud del atleta cambia inmediatamente a `INJURED`, reflejándose en el roster y en la lista de convocables del capitán.

### Requirement: Cross-Role Tournament Financial Clearance and Technical Desk Workflow
El sistema DEBE permitir coordinar el flujo integral de torneos entre directiva (creación), tesorería (registro de canon de inscripción), capitanía (armado de nómina) y mesa técnica oficial (acta digital).

#### Scenario: Multi-role coordination in tournament lifecycle
- **WHEN** la directiva crea el torneo, el tesorero registra el pago de cuotas, el capitán designa los 14 atletas y el anotador oficial abre el partido bloqueado
- **THEN** el sistema valida que cada rol ejecute su parte del ciclo de vida sin interferir en los módulos de los demás roles.

### Requirement: Real-Time Live Shift Handover Handshake and Lockout Verification
El sistema DEBE garantizar que la transferencia de mesa técnica (`shift-handover`) conceda el control de anotación exclusivo al nuevo anotador designado y restrinja al anotador saliente mientras la mesa esté bloqueada.

#### Scenario: Shift handover locks out outgoing annotator
- **WHEN** el Anotador 1 transfiere la mesa en vivo al Anotador 2 en un partido bloqueado
- **THEN** el Anotador 2 adquiere permisos para registrar puntos y el Anotador 1 es bloqueado con HTTP 403 al intentar registrar anotaciones posteriores.

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

### Requirement: Master Production Ecosystem Population
El sistema DEBE soportar la población masiva e integral de todas sus entidades de negocio interconectadas (clubes, nóminas completas por equipo, torneos concluidos y activos con actas de anotación, evaluaciones SOTG, control de asistencia, cuentas y transacciones financieras, fichas de lesiones y evolución médica, noticias comunitarias y pizarrones tácticos).

#### Scenario: Full production ecosystem populated and queryable
- **WHEN** se ejecuta la hidratación integral de datos en producción
- **THEN** todas las vistas web de la plataforma presentan información rica, coherente y navegable sin contadores en cero ni listas vacías.
