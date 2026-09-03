## 1. Activación de Rate Limiting y Validación de Entorno

- [x] 1.1 Implementar `shouldSkipRateLimit` condicional en `apps/api/src/middleware/security.ts`.
- [x] 1.2 Crear el módulo de validación con Zod `apps/api/src/lib/env.ts` e importarlo en `apps/api/src/app.ts`.

## 2. Verificación Integral de Seguridad y Pruebas

- [x] 2.1 Verificar que el servidor compile y arranque con las variables validadas.
- [x] 2.2 Certificar la suite completa de pruebas unitarias (`npm test`) y build de producción (`npm run lint`).
