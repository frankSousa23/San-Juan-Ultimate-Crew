## 1. Evaluación de Consistencia Matemática y Event Sourcing en Mesa Técnica

- [x] 1.1 Diseñar e implementar pruebas de consistencia matemática del marcador en tiempo real (`scoreHome` / `scoreAway`) tras registro secuencial de goles en `scripts/run-live-deploy-tests.ts`.
- [x] 1.2 Implementar prueba de anotación especial Callahan verificando acreditación simultánea de gol y defensa para el mismo atleta.
- [x] 1.3 Implementar prueba de anulación/eliminación de anotación errónea (`DELETE /api/annotations/:id`) y validar recálculo inmediato del marcador oficial.

## 2. Fusión de Invitados y Evaluación SOTG WFDF

- [x] 2.1 Implementar caso de prueba de fusión atómica de invitados/refuerzos (`POST /api/annotations/merge-guest`) transfiriendo historial al atleta aprobado.
- [x] 2.2 Implementar caso de prueba de envío y cálculo de planilla oficial SOTG WFDF (5 dimensiones) y verificación en tabla de posiciones.

## 3. Certificación E2E Ampliada y Auditoría Integral del Proyecto

- [x] 3.1 Ejecutar la suite expandida de pruebas en vivo contra producción (`https://san-juan-ultimate-crew.seenode.app`) y certificar 100% PASS.
- [x] 3.2 Realizar auditoría integral de funcionamiento de todo el proyecto (Frontend, Backend, APIs, Base de Datos y Roles RBAC).
