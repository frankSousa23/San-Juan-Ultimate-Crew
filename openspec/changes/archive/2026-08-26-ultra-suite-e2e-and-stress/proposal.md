## Why

Para alcanzar la máxima verificación posible de SIGEDIVO antes del vencimiento del servidor de despliegue, es necesario extender la suite E2E a más de 40 casos de prueba que cubran la totalidad de los subsistemas restantes (Biblioteca de Recursos Multimedia, Canales de Chat en Tiempo Real, Planillas Oficiales de Espíritu de Juego SOTG WFDF, Tablas de Líderes y Estadísticas Avanzadas, Creación de Fixtures Masivos por Lotes y Stress Testing de Concurrencia Extrema con 50 lecturas y 20 escrituras simultáneas).

## What Changes

- Expansión de la suite `scripts/run-live-deploy-tests.ts` a 40+ casos de prueba automatizados integrando:
  1. **Recursos y Multimedia Educativa (`/api/resources`):** Creación y categorización de reglamentos WFDF, enlaces de video drills y búsqueda por etiquetas con guardias de seguridad RBAC.
  2. **Canales y Mensajería de Eventos (`/api/channels`, `/api/messages`):** Publicación de mensajes de chat en vivo por atletas y directiva en el canal del torneo.
  3. **Espíritu de Juego WFDF (`SpiritScore`):** Registro de planillas SOTG completas evaluando las 5 dimensiones oficiales (0 a 4 puntos cada una, total 20 pts) con notas cualitativas.
  4. **Estadísticas Avanzadas y Leaderboards (`/api/stats`):** Consulta y verificación de tablas de líderes (Goleadores, Asistidores, Defensas) y cálculo de índices de rendimiento Plus-Minus (+/-).
  5. **Fixtures Masivos y Ciclo de Torneo (`batchFixtures`):** Generación en lote de partidos de grupos, semifinales y final con cierre formal del torneo a estado `COMPLETED`.
  6. **Stress Testing Extremo:** Despacho de 50 peticiones de lectura y 20 peticiones de escritura simultáneas en ráfaga continua con métricas de percentil p95, avg latency y 0% de pérdidas.

## Capabilities

### New Capabilities
<!-- No se introducen nuevas capacidades; se expande la capacidad existente -->

### Modified Capabilities
- `e2e-live-verification`: Ampliación exhaustiva de los requisitos de verificación funcional para incluir Recursos Multimedia, Canales de Mensajería, Planilla Oficial WFDF de Espíritu de Juego, Leaderboards de Estadísticas, Fixtures Masivos y Stress Testing Extremo.

## Impact

- **APIs evaluadas:** `/api/resources`, `/api/channels`, `/api/messages`, `/api/stats`, `/api/events/tournament/:id/fixtures`.
- **Scripts:** Ampliación del test runner `scripts/run-live-deploy-tests.ts` a más de 40 aserciones continuas y ejecución de estrés de alta intensidad.
