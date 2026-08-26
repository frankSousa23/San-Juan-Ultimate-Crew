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
