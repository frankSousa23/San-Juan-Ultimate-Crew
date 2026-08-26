## ADDED Requirements

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
