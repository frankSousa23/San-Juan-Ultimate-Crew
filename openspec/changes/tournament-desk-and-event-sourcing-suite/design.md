## Context

El sistema cuenta con una suite E2E de 50 casos de prueba aprobados al 100%. Para certificar la lógica deportiva y de mesa técnica en torneos, ampliaremos la suite con una fase dedicada a la consistencia matemática de marcadores, goles Callahan, anulación de anotaciones, fusión de invitados (`merge-guest`) y auditoría integral del proyecto.

## Goals / Non-Goals

**Goals:**
- Validar la consistencia matemática entre eventos individuales y marcadores agregados.
- Validar el flujo de juego Callahan y doble acreditación.
- Validar la revocación/eliminación de puntos y su reflejo inmediato en el marcador.
- Validar la fusión atómica de invitados/refuerzos (`merge-guest`).
- Validar el motor de cálculo SOTG en 5 dimensiones.
- Ejecutar una auditoría general completa de todos los módulos del proyecto.

**Non-Goals:**
- Modificar las fórmulas de desempate en el backend (solo evaluar y certificar su cumplimiento en producción).

## Decisions

1. **Creación de Partidos Especializados de Prueba:**
   - La suite programará un partido con anotador exclusivo para registrar la secuencia play-by-play (Gol regular, Callahan, punto anulado, punto de invitado) y verificar en cada paso la respuesta de la API.
2. **Auditoría Integral Post-Prueba:**
   - Se verificará la salud de la base de datos, el volumen de logs en `/api/audit`, la ausencia de memory leaks y la latencia promedio del servidor.

## Risks / Trade-offs

- **[Riesgo] Puntos residuales en estadísticas acumuladas:**
  - *Mitigación:* Usar identificadores únicos y limpiar o aislar partidos de torneo creados específicamente para la prueba.
