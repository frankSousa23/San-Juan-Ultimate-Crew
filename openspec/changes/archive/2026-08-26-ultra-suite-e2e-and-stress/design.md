## Context

SIGEDIVO cuenta con 30 pruebas certificadas en producción. Para completar la cobertura absoluta de los 22 endpoints del backend, extenderemos el runner `scripts/run-live-deploy-tests.ts` para cubrir la biblioteca de recursos, canales de mensajería, evaluación SOTG oficial WFDF, leaderboards de estadísticas de torneo, creación masiva de fixtures (`batchFixtures`) y un benchmark de estrés extremo de 50 lecturas concurrentes y 20 escrituras simultáneas.

## Goals / Non-Goals

**Goals:**
- Extender el test runner a 40+ pruebas secuenciales y concurrentes.
- Evaluar los endpoints de `/api/resources`, `/api/channels`, `/api/messages`, `/api/stats` y `batchFixtures`.
- Ejecutar un benchmark de carga extrema con 50 peticiones simultáneas de lectura y 20 de escritura, reportando percentil p95, avg latency y 0% de pérdidas.

**Non-Goals:**
- Generar ataques de saturación masiva de red que agoten la cuota de transferencia del proveedor.

## Decisions

1. **Sesiones con Rol Coach y Directiva:**
   - Asignar roles adicionales de `coach` y `directiva` durante la fase 2 para validar la administración de recursos y fixtures de forma fidedigna.

2. **Validación de SOTG WFDF:**
   - Registrar planilla de espíritu evaluando las 5 dimensiones oficiales (0 a 4 puntos cada una, total 20 pts).

## Risks / Trade-offs

- **[Riesgo] Límites de rate-limiting:**
  - *Mitigación:* Calibrar los lotes de peticiones en ráfagas de 50 para respetar los límites de Node/Express en Seenode.
