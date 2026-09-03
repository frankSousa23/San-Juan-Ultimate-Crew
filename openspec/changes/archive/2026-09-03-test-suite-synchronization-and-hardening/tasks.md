## 1. Sincronización de Autenticación en Suites de Prueba

- [x] 1.1 Actualizar las credenciales de inicio de sesión de administrador en `roles.permissions.test.ts`, `players.test.ts`, `injuries.test.ts`, `messages.test.ts` y `resources.test.ts` a `passWORD23` (con soporte para fallback `123456`) y verificar que cada suite adquiera un token JWT válido.
- [x] 1.2 Proteger los bloques `beforeAll` en `injuries.test.ts` y `messages.test.ts` asegurando que los IDs requeridos (`playerId`, `channelId`) estén definidos antes de ejecutar consultas dependientes.

## 2. Robustecimiento de Validación y Verificación Global

- [x] 2.1 Refinar la validación de parámetros de consulta en `apps/api/src/routes/injuries.ts` y `apps/api/src/routes/messages.ts` para rechazar cadenas no numéricas como `\"undefined\"` con respuestas 400 estructuradas.
- [x] 2.2 Ejecutar `npm test` en el workspace raíz y certificar que las 23 suites y 143 pruebas de Vitest pasen al 100% (cero fallos).
