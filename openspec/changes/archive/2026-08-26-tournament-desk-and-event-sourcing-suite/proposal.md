## Why

Para consolidar la fiabilidad deportiva del sistema en torneos oficiales y partidos en vivo, es fundamental certificar la consistencia matemática del marcador en tiempo real, el registro de goles y defensas atómicas (incluyendo goles Callahan y asistencias vinculadas), la anulación y recalculo de puntos, la fusión de refuerzos e invitados (`POST /api/annotations/merge-guest`), la evaluación del Espíritu de Juego (SOTG WFDF en 5 dimensiones) y los criterios de desempate en la tabla de clasificación.

## What Changes

- **1. Evaluación de Consistencia Matemática y Event Sourcing en Mesa Técnica:**
  - Validación de coincidencia exacta entre la suma de anotaciones individuales y el marcador oficial del partido (`scoreHome` / `scoreAway`).
  - Validación de anotación especial *Callahan* (Gol + Defensa simultáneos para el mismo atleta sin asistencia requerida).
  - Validación de anulación de punto (DELETE annotation) con descuento automático e inmediato en el marcador global y estadísticas individuales.
- **2. Fusión Atómica de Invitados y Refuerzos (`merge-guest`):**
  - Registro de anotaciones a atletas temporales sin cuenta formal (`opponentPlayerName` o invitado).
  - Ejecución de `POST /api/annotations/merge-guest` para fusionar y transferir todo el historial acumulado al nuevo atleta tras su aprobación.
- **3. Planilla Oficial SOTG WFDF (Espíritu de Juego):**
  - Envío y cálculo de puntuación en las 5 dimensiones (Reglas, Contacto, Imparcialidad, Actitud, Comunicación) con escala 0-20.
  - Validación de restricción de envío exclusivo para el Anotador Oficial, Capitán o Administrador.
- **4. Tablas de Posiciones y Algoritmo de Desempate de Torneo:**
  - Verificación de asignación de puntos por partido (Victoria: 2, Derrota: 0).
  - Cálculo de diferencial de gol y ranking consolidado en `/api/events/tournament/:id/stats`.
- **5. Expansión del Runner E2E y Auditoría Integral del Proyecto:**
  - Extensión del script `scripts/run-live-deploy-tests.ts` incorporando las nuevas fases de torneo y mesa técnica.
  - Auditoría integral de compilación, endpoints, base de datos y cobertura de los 8 roles del sistema.

## Capabilities

### New Capabilities
<!-- No se crean capacidades nuevas, se extiende la suite de verificación de torneos y mesa técnica -->

### Modified Capabilities
- `e2e-live-verification`: Se agregan requerimientos de consistencia matemática de marcador, jugada Callahan, anulación de puntos, fusión atómica de invitados y cálculo SOTG WFDF.

## Impact

- **Test Suite (`scripts/run-live-deploy-tests.ts`):** Incorporación de nuevas fases de prueba de torneo, elevando la suite a una cobertura aún más amplia y robusta.
- **Backend / API:** Validación en vivo de los endpoints `/annotations`, `/annotations/sotg`, `/annotations/merge-guest`, `/events/:id` y `/events/tournament/:id/stats`.
