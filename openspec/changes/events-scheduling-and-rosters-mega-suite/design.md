## Context

El sistema cuenta con una suite E2E de 56 casos de prueba certificados al 100% en producción. Para auditar y estresar el subsistema de Eventos y Rosters a gran escala, incorporaremos una fase de pruebas masivas que genere múltiples tipos de eventos (Torneos, Partidos de eliminatoria, Prácticas, Clínicas, Caimaneras), nóminas completas de atletas distribuidas en varios equipos, asignación de líneas tácticas y pase de lista masivo.

## Goals / Non-Goals

**Goals:**
- Validar la creación y programación de múltiples tipos de eventos simultáneos.
- Validar la jerarquía de partidos en torneos (`GROUP_STAGE`, `SEMI_FINALS`, `FINALS`).
- Validar la generación masiva de atletas y control de dorsales por equipo.
- Validar la convocatoria táctica (`O-Line` / `D-Line`) y reglas de refuerzo (`isRefuerzo: true`).
- Validar el pase de lista masivo de asistencia (`Attendance`).
- Ejecutar la suite expandida (Fase 19) en producción y certificar 100% PASS.

**Non-Goals:**
- Modificar el esquema de la base de datos (se aprovechan los modelos existentes `Event`, `EventParticipant`, `Attendance`, `Player`, `Team`).

## Decisions

1. **Fase 19 Modular y Parametrizada:**
   - La suite creará 4 eventos distintos (Torneo con fixtures, Práctica, Clínica, Caimanera) y una nómina masiva de atletas para verificar la integridad de todos los endpoints relacionados.
2. **Medición de Tiempos de Respuesta:**
   - Se auditará que las operaciones masivas de convocatoria y asistencia se completen en tiempos inferiores a 500ms.
