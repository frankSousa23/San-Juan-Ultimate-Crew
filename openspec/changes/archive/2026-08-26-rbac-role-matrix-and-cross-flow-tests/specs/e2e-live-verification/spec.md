## ADDED Requirements

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
