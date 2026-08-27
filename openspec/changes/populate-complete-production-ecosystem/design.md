## Context

El usuario necesita que todas las evaluaciones de negocio formuladas en las distintas fases de OpenSpec se apliquen y dejen poblada la plataforma en producción tras el despliegue limpio.

## Goals / Non-Goals

**Goals:**
- Crear un script maestro `scripts/populate-production-ecosystem.ts` que realice llamadas autenticadas a la API en producción para generar el ecosistema completo:
  1. Clubes y Divisiones con datos de marca.
  2. Nóminas masivas de jugadores (8-12 por club) con posiciones y dorsales.
  3. Torneos oficiales (uno finalizado con partidos, actas y SOTG, otro activo con fixtures).
  4. Prácticas tácticas con convocatorias y control de asistencia.
  5. Cuentas bancarias y transacciones de tesorería.
  6. Fichas de lesiones y evolución médica.
  7. Rivales y jugadas en el pizarrón táctico.
  8. Noticias y comentarios de la comunidad.
- Ejecutar el script contra producción y reportar el estado de hidratación.

## Decisions

1. **Uso de la API REST en Vivo:**
   - Toda la población se efectúa mediante solicitudes HTTP firmadas con JWT de Administrador (`adminSession`) para respetar la lógica de negocio, validaciones Zod, unicidad y disparadores de eventos.
