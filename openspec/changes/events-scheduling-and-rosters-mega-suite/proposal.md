## Why

Para certificar la robustez y escalabilidad operativa de SIGEDIVO en la gestión deportiva a gran escala, es necesario someter el subsistema de Eventos, Cronogramas y Rosters a pruebas masivas de concurrencia, jerarquías de torneos (fase de grupos, semifinales, finales, caimaneras y prácticas), convocatorias tácticas de alta densidad (14-28 atletas por nómina), reglas de aislamiento por club y validación de reglas de refuerzos (`isRefuerzo: true`).

## What Changes

- **1. Generación y Gestión Masiva de Tipos de Eventos y Horarios:**
  - Creación de torneos oficiales (`TOURNAMENT`) con múltiples partidos dependientes (`GROUP_STAGE`, `SEMI_FINALS`, `THIRD_PLACE`, `FINALS`) en horarios escalonados y canchas simultáneas.
  - Creación de jornadas intensivas (`FULL_DAY_OPEN`, `FULL_DAY_MIXTO`), prácticas regulares (`PRACTICE`), clínicas formativas (`TRAINING`) y caimaneras internas (`SCRIMMAGE`).
- **2. Alta Densidad de Rosters y Atletas Multi-Club:**
  - Registro de múltiples clubes y generación paralela de nóminas de 14 a 20 atletas por club con posiciones WFDF (`HANDLER`, `CUTTER`, `HYBRID`).
  - Validación de no colisión de dorsales intra-club y coexistencia inter-club.
- **3. Convocatorias Tácticas Masivas y Reglas de Pertenencia (`EventParticipant`):**
  - Convocatoria de nóminas completas distribuidas en `O-Line` y `D-Line`.
  - Validación de regla de refuerzos: un atleta ajeno solo puede ser convocado con `isRefuerzo: true`.
  - Pase de lista masivo (`Attendance`: `present`, `late`, `absent`) para entrenamientos y partidos.
- **4. Expansión de la Suite de Certificación en Vivo:**
  - Incorporación de la Fase 19 en `scripts/run-live-deploy-tests.ts` elevando la suite a más de 65 casos de prueba ejecutados contra producción.
  - Auditoría integral de rendimiento y coherencia relacional en base de datos.

## Capabilities

### New Capabilities
<!-- No se crean capacidades nuevas, se extiende la suite de verificación de eventos y rosters -->

### Modified Capabilities
- `e2e-live-verification`: Se agregan requerimientos de generación masiva de eventos multietapa, validación de horarios simultáneos, convocatorias tácticas de alta densidad y auditoría de reglas de rosters y refuerzos.

## Impact

- **Test Suite (`scripts/run-live-deploy-tests.ts`):** Ampliación masiva de casos de prueba automáticos en producción.
- **Backend / API:** Validación intensiva de `/api/events`, `/api/events/batch-fixtures`, `/api/players`, `/api/teams` y `/api/attendances`.
