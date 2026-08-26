## Why

Aunque el sistema cuenta con 34 pruebas E2E y pruebas de concurrencia aprobadas, es crucial certificar de forma exhaustiva las fronteras de seguridad negativas (HTTP 403 / 401) para cada uno de los 8 roles del sistema (`player`, `captain`, `coach`, `treasurer`, `annotator`, `marketing`, `directiva`, `guest`) y evaluar los flujos de negocio cruzados en cadena (Lesión Médica -> Bloqueo en Convocatoria Táctica, Inscripción a Torneo -> Pago en Tesorería -> Anotación Oficial en Mesa Bloqueada, y Relevo de Mesa en Tiempo Real).

## What Changes

- **1. Batería de Pruebas Negativas de Seguridad RBAC (Negative Boundary Matrix):**
  - Validación de bloqueo (HTTP 403) para `player`, `coach` y `captain` en endpoints de creación de cuentas bancarias y transacciones financieras.
  - Validación de bloqueo (HTTP 403) para `treasurer`, `player` y `annotator` en endpoints de aprobación de usuarios y modificación de roles administrativos.
  - Validación de inmutabilidad total para el rol `guest` (HTTP 403 en todas las operaciones de mutación POST/PUT/DELETE).
  - Validación de bloqueo de buzón de feedback privado para roles no autorizados.
- **2. Flujos de Negocio Cruzados Multi-Rol (Cross-Role Business Cycles):**
  - **Flujo A (Salud & Convocatoria):** Registro de lesión moderada/grave por parte del Coach -> Validación de visibilidad y estado de alerta para el Capitán al armar las líneas O-Line/D-Line.
  - **Flujo B (Torneo, Finanzas & Mesa Técnica):** Creación de torneo por Directiva -> Registro de pago de inscripción por Tesorería -> Confección de Roster por Capitán -> Anotación oficial por Anotador designado con mesa bloqueada.
  - **Flujo C (Relevo de Mesa Oficial & Aislamiento):** Anotador 1 transfiere la mesa en vivo a Anotador 2 -> Anotador 2 valida la sesión y anota -> Anotador 1 pierde el permiso de escritura mientras la mesa permanezca bloqueada.
- **3. Expansión del Runner de Certificación E2E (`scripts/run-live-deploy-tests.ts`):**
  - Integración de 16 nuevos casos de prueba, llevando la suite oficial a **50 casos de prueba E2E automatizados certificados en producción**.

## Capabilities

### New Capabilities
<!-- No se crean capacidades nuevas, se extiende la suite de certificación -->

### Modified Capabilities
- `e2e-live-verification`: Se agregan requerimientos de verificación de fronteras negativas RBAC, inmutabilidad de invitados y flujos de negocio multi-rol encadenados.

## Impact

- **Test Suite (`scripts/run-live-deploy-tests.ts`):** Ampliación del script con fases dedicadas para fronteras de seguridad RBAC y ciclos multi-rol.
- **Backend / Frontend:** Verificación estricta de las reglas de negocio existentes sin romper compatibilidad.
