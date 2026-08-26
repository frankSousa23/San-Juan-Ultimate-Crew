## Purpose

Proveer una suite de verificación y pruebas automatizadas de extremo a extremo que evalúa el ciclo de vida completo de los datos, el control de acceso basado en roles (RBAC), el aislamiento multi-equipo y la lógica deportiva en el despliegue activo de SIGEDIVO.

## ADDED Requirements

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
