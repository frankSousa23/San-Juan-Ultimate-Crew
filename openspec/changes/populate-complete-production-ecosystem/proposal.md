## Why

Tras los despliegues y actualizaciones en la nube, el entorno en producción requiere ser poblado y alimentado con todo el conjunto integral de datos, escenarios de torneos concluidos y activos, estadísticas históricas y vivas por atleta, nóminas masivas por club, cuentas y transacciones financieras, fichas de lesiones y evolución médica, pizarrones tácticos y comunidad, para que la plataforma web esté completamente funcional y viva para los usuarios.

## What Changes

- **1. Script Maestro de Población y Evaluación Ecosistémica (`scripts/populate-production-ecosystem.ts`):**
  - **Clubes y Divisiones:** Población de 10+ clubes con tags, colores, categorías e identidad.
  - **Plantillas Oficiales (Rosters):** Generación de 8-12 atletas por club con dorsales únicos, posiciones WFDF (`HANDLER`, `CUTTER`, `HYBRID`) y estados activos.
  - **Torneos y Calendario Multietapa:**
    - *Torneo Apertura 2026 (COMPLETED):* Semifinales, 3er puesto y Gran Final con Box Scores completos, anotaciones vinculadas (goles, asistencias, defensas, Callahans) y planillas SOTG WFDF.
    - *Copa Nacional de Campeones 2026 (ONGOING/UPCOMING):* Fixtures jerárquicos escalonados en canchas 1 y 2.
    - *Prácticas Tácticas y Clínicas:* Convocatorias con líneas `O-Line`, `D-Line`, Refuerzos y pase de lista de asistencia (`present`, `late`, `absent`).
  - **Tesorería y Finanzas:** Cuentas bancarias y caja chica, cuotas de torneos, compras de discos e hidratación, y balance contable consolidado positivo.
  - **Control Médico y Lesiones:** Registro de lesiones activas, tratamientos de fisioterapia y altas médicas (`RESOLVED`).
  - **Pizarrón Táctico y Rivales:** Clubes rivales con fortalezas/debilidades y catálogo de jugadas tácticas explicadas.
  - **Comunidad y Comunicación:** Noticias oficiales fijadas con comentarios y canales de chat activos por evento.
- **2. Ejecución Directa en Producción:**
  - Ejecutar el script maestro contra el entorno de producción (`https://san-juan-ultimate-crew.seenode.app`) para dejar todas las vistas de la aplicación web pobladas con datos reales y consistentes.

## Capabilities

### New Capabilities
<!-- No se crean capacidades nuevas, se amplía el ecosistema de datos y evaluaciones vivas -->

### Modified Capabilities
- `e2e-live-verification`: Amplía la cobertura para verificar la presencia de un ecosistema completo de datos vivos en producción tras un despliegue limpio.

## Impact

- **Producción (`https://san-juan-ultimate-crew.seenode.app`):** Todas las secciones de la interfaz web (Equipos, Rosters, Eventos, Estadísticas, Finanzas, Lesiones, Noticias, Táctica) quedarán pobladas y plenamente navegables.
- **Scripts (`scripts/populate-production-ecosystem.ts`):** Nueva herramienta automatizada para hidratar la base de datos con escenarios de negocio realistas en cualquier momento.
