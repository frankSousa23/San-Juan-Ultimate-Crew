## Context

La versión 1 del script runner cubrió los 5 flujos esenciales de la plataforma. Para alcanzar una certificación holística, el script `scripts/run-live-deploy-tests.ts` se expandirá para interactuar con las 12 entidades del dominio deportivo e incluir un módulo de estrés con `Promise.all` para medir la capacidad de respuesta concurrente de la base de datos PostgreSQL y el servidor Express en producción.

## Goals / Non-Goals

**Goals:**
- Extender el test runner con 9 fases modulares cubriendo Tesorería, Lesiones, Rivales, Pizarrón Táctico, Noticias/Comunidad, Relevos de Mesa Técnica, Asistencia, Seguridad/Feedback y Benchmark de Concurrencia.
- Implementar un runner de carga que despache 25 peticiones concurrentes simultáneas de lectura y 10 de escritura, calculando métricas de latencia (Min, Max, Avg, p95) y tasa de éxito.
- Manejar prefijos dinámicos en todas las entidades de prueba para garantizar aislamiento y evitar colisiones de datos.

**Non-Goals:**
- Generar ataques de denegación de servicio (DoS) masivos que superen los límites de ancho de banda del plan de hosting de Seenode. Las pruebas de concurrencia están calibradas dentro de los rangos seguros de operación (10-30 reqs simultáneas).

## Decisions

1. **Estructura Modular por Fases en TypeScript:**
   - *Decisión:* Mantener todas las fases organizadas secuencialmente dentro de `scripts/run-live-deploy-tests.ts`, utilizando una tabla consolidada de resultados y temporizadores de precisión.

2. **Benchmark Concurrente en Node sin Dependencias Externas Pesadas:**
   - *Decisión:* Emplear `Promise.all` con `fetch` y `performance.now()` en lugar de herramientas pesadas de CLI para mantener el script 100% portable y autónomo.

3. **Roles Dedicados para Pruebas RBAC:**
   - *Decisión:* Registrar y autenticar sesiones adicionales para `treasurer`, `coach`, y `directiva` para evaluar la matriz de permisos de forma fidedigna.

## Risks / Trade-offs

- **[Riesgo] Límites de rate-limiting de Express:**
  - *Mitigación:* Las ráfagas de carga se calibran para permanecer bajo los umbrales de rate-limiting del servidor en producción.
