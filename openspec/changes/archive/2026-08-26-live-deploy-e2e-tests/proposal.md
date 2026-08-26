## Why

El despliegue de producción de SIGEDIVO (Sistema de Gestión para el Disco Volador) en Seenode cuenta con una ventana operativa limitada (2 días restantes). Se requiere una suite completa de pruebas de integración y verificación end-to-end (E2E) directa contra el deploy para certificar el ciclo de vida completo de los datos (auth, multi-tenancy, roster, torneos, anotaciones en vivo SOTG y auditoría) garantizando que todas las reglas de negocio y restricciones RBAC funcionan de forma óptima.

## What Changes

- Creación de un script automatizado ejecutable de verificación integral contra el entorno de producción desplegado (`https://san-juan-ultimate-crew.seenode.app/api`).
- Suite de pruebas secuenciales que cubren:
  1. Autenticación de Administrador principal y validación de tokens JWT.
  2. Registro dinámico de múltiples usuarios simulados (jugadores, capitanes, oficiales de mesa) y aislamiento por equipo.
  3. Aprobación de cuentas y asignación de roles/equipos desde el módulo administrativo.
  4. Creación y validación de atletas en el Roster con control de dorsales únicos por equipo.
  5. Creación de Torneo padre, jerarquía de partidos de fase regular/eliminatoria y asignación de horarios/sedes.
  6. Configuración del Roster de Torneo (asignación de atletas a líneas O-Line/D-Line y banderas de refuerzo).
  7. Simulación de Mesa Técnica en Vivo con registro secuencial de acciones de juego (Goles, Asistencias, Defensas, Turnovers) y puntuación de Espíritu de Juego (SOTG).
  8. Verificación de agregación de estadísticas individuales/colectivas y consistencia en el registro de Auditoría.
  9. Pruebas de seguridad negativa (revisión de accesos no autorizados y aislamiento estricto entre equipos).

## Capabilities

### New Capabilities
- `e2e-live-verification`: Automatización y runner de pruebas extremo a extremo contra la API desplegada para auditar flujos de negocio, integridad de datos, RBAC y aislamiento multi-equipo.

### Modified Capabilities
<!-- Ninguna capacidad previa modificada -->

## Impact

- **APIs afectadas:** Endpoints públicos y protegidos de `/api/auth`, `/api/users`, `/api/teams`, `/api/players`, `/api/events`, `/api/annotations`, `/api/stats`, `/api/audit`.
- **Herramientas de testing:** Creación de runner de prueba en TypeScript/Node (`scripts/run-live-deploy-tests.ts` o suite E2E dedicada) con reporte detallado de resultados.
