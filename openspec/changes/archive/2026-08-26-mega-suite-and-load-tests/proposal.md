## Why

Para completar la certificación integral de SIGEDIVO en su despliegue activo en Seenode antes del vencimiento del servidor, es imperativo expandir la cobertura de pruebas al 100% de los módulos funcionales del sistema (Finanzas, Salud/Lesiones, Scouting/Rivales, Pizarrón Táctico, Noticias/Comunidad, Relevo de Mesa Técnica, Asistencia en Cancha, Reseteo de Contraseñas y Buzón de Feedback), e incorporar pruebas de carga y concurrencia para medir la resiliencia y tiempos de respuesta del servidor bajo tráfico simultáneo.

## What Changes

- Expansión de la suite de pruebas E2E en `scripts/run-live-deploy-tests.ts` para cubrir:
  1. **Tesorería y Finanzas:** Creación de cuentas, categorías, transacciones de ingreso/gasto/transferencia y validación de balances consolidados con restricciones de rol `treasurer`/`admin`.
  2. **Salud y Lesiones:** Registro médico de lesiones (severidad, diagnóstico, estado `ACTIVE` -> `RECOVERING` -> `RESOLVED`) y su impacto en la disponibilidad del atleta.
  3. **Scouting y Rivales:** Creación de clubes rivales, registro de jugadores oponentes y anotaciones versus en partidos oficiales.
  4. **Pizarrón Táctico:** Creación y filtrado de jugadas de ataque (`OFFENSE`), defensa (`DEFENSE`) y ejercicios (`DRILL`).
  5. **Noticias y Comunidad:** Publicación de noticias fijadas (`isPinned`), comentarios de usuarios autenticados, bloqueo de comentarios y mensajería en canales de evento.
  6. **Relevos de Mesa Técnica:** Configuración de staff de mesa, bloqueo de actas oficiales (`isAnnotatorLocked`) y relevo rápido de turno (`shift-change`) en tiempo real.
  7. **Pase de Lista y Asistencia:** Registro de estados (`present`, `late`, `absent`) y agregación de métricas de compromiso.
  8. **Seguridad y Feedback:** Generación de enlaces criptográficos de reseteo de contraseña y buzón de feedback (`BUG`, `FEATURE`, `UX`).
  9. **Pruebas de Carga y Concurrencia (Load Testing):** Simulación de múltiples peticiones concurrentes de lectura y escritura (anotaciones simultáneas) midiendo latencia promedio, p95 y tasa de éxito (0% drop rate).

## Capabilities

### New Capabilities
<!-- Ninguna nueva capacidad; se expande la capacidad existente -->

### Modified Capabilities
- `e2e-live-verification`: Ampliación de los requisitos de verificación funcional para incluir la totalidad de los módulos del club (Finanzas, Lesiones, Rivales, Pizarrón Táctico, Noticias, Relevos de Mesa, Asistencia, Feedback) y pruebas de concurrencia y carga.

## Impact

- **APIs evaluadas:** `/api/accounts`, `/api/transactions`, `/api/injuries`, `/api/rivals`, `/api/plays`, `/api/news`, `/api/messages`, `/api/attendance`, `/api/feedback`, `/api/users/:id/reset-link`, `/api/events/:id/mesa-tecnica`.
- **Scripts:** Actualización del runner `scripts/run-live-deploy-tests.ts` e incorporación de módulo de benchmark de carga.
