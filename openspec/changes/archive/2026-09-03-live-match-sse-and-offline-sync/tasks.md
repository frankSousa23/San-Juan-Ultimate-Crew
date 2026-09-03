## 1. Servidor SSE y Emisor de Eventos

- [x] 1.1 Crear `apps/api/src/lib/eventBroadcaster.ts` con soporte de `EventEmitter` para partidos en vivo.
- [x] 1.2 Agregar el endpoint SSE `GET /api/annotations/stream` y emitir en creación/eliminación de anotaciones en `apps/api/src/routes/annotations.ts`.

## 2. Integración Frontend y Sincronización Offline

- [x] 2.1 Integrar `EventSource` y cola de persistencia offline en `apps/web/src/components/LiveAnnotationsTable.tsx`.
- [x] 2.2 Certificar con compilación de producción (`npm run lint`) y pruebas unitarias (`npm test`) con 100% de aprobación.
