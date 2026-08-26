## Context

SIGEDIVO está desplegado en producción en `https://san-juan-ultimate-crew.seenode.app/` con backend en Express/TypeScript y base de datos PostgreSQL mediante Prisma. La arquitectura cuenta con autenticación JWT, RBAC multidimensional (`admin`, `captain`, `player`, `annotator`, etc.) y aislamiento lógico multi-equipo en consultas y mutaciones.

## Goals / Non-Goals

**Goals:**
- Implementar un runner de pruebas automatizado en Node/TypeScript (`scripts/run-live-deploy-tests.ts`) capaz de conectarse directamente a la URL de producción o a un entorno local de staging.
- Automatizar la secuencia completa de pruebas: autenticación, registro/aprobación de usuarios, asignación de equipos, creación de atletas con validación de dorsales, torneos con fixture jerárquico, mesa técnica de anotaciones y estadísticas.
- Producir un reporte estructurado y comprensivo en consola y archivo de log con métricas de tiempo de respuesta y estado de cada aserción (Pass/Fail).
- Mantener idempotencia y limpieza de datos creados durante el test para no ensuciar la base de datos de producción.

**Non-Goals:**
- Modificar el esquema de la base de datos o introducir dependencias pesadas de UI testing (como Selenium/Cypress completos) cuando la verificación vía API REST cubre la totalidad de la lógica de negocio y seguridad.
- Ejecutar migraciones destructivas o truncados en la base de datos de producción durante las pruebas.

## Decisions

1. **Test Runner con Axios / Fetch nativo en TypeScript:**
   - *Decisión:* Usar un script standalone en TypeScript ejecutable con `tsx` o `node` que simula múltiples sesiones de usuario manteniendo sus respectivos tokens JWT en memoria.
   - *Alternativas consideradas:* Jest/Vitest directamente contra la API remota (más rígido para flujos secuenciales multi-usuario) vs Script de integración por pasos (más flexible y con reportes interactivos por colores).

2. **Manejo de Cuentas de Prueba con Prefijo `e2e_test_`:**
   - *Decisión:* Los usuarios, atletas y torneos creados llevarán el prefijo `e2e_test_` con timestamp para evitar colisiones con datos reales existentes y permitir limpieza controlada al finalizar el ciclo.

3. **Verificación de Seguridad Negativa (Control de Aislamiento):**
   - *Decisión:* Incluir aserciones donde un usuario del Equipo A intenta deliberadamente modificar un recurso del Equipo B, verificando que el servidor responda con código 403/404.

## Risks / Trade-offs

- **[Riesgo] Latencia de red o cuelgues del hosting gratuito:**
  - *Mitigación:* Configurar timeouts adecuados (10s por petición) y reintentos en caso de respuestas intermitentes.
- **[Riesgo] Límites de rate-limiting en producción:**
  - *Mitigación:* Añadir pequeñas pausas (100-200ms) entre llamadas secuenciales para no saturar los límites de middleware de seguridad.
