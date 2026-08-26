## Context

El sistema SIGEDIVO cuenta actualmente con 34 pruebas E2E en producción. Para certificar completamente la seguridad y resiliencia multi-rol, extenderemos `scripts/run-live-deploy-tests.ts` agregando fases de pruebas negativas (validación de HTTP 403 en roles no autorizados), inmutabilidad de cuentas públicas/invitado, y verificación de ciclos de vida de negocio cruzados.

## Goals / Non-Goals

**Goals:**
- Probar sistemáticamente que los 8 roles del sistema reciban 403 Forbidden al intentar ejecutar operaciones fuera de su ámbito.
- Probar que el usuario de demostración / invitado sea 100% inmune a mutaciones no autorizadas.
- Probar el ciclo cruzado: Lesión Médica -> Bloqueo en Convocatoria Táctica.
- Probar el ciclo cruzado: Creación de Torneo -> Cobro de Tesorería -> Anotación en Mesa Bloqueada.
- Probar el ciclo cruzado: Relevo en Vivo de Mesa Técnica y bloqueo estricto del anotador saliente.
- Elevar la suite de certificación a 50 pruebas automatizadas sin introducir latencias excesivas.

**Non-Goals:**
- Modificar el middleware de autenticación del backend (solo probar y verificar su comportamiento).

## Decisions

1. **Sesiones JWT Paralelas de Todos los Roles:**
   - La suite generará sesiones concurrentes para `admin`, `directiva`, `captain`, `coach`, `treasurer`, `annotator_1`, `annotator_2`, `player` y `guest`.
2. **Matriz de Pruebas Negativas:**
   - Se utilizarán aserciones con `expectedStatus: 403` o `401` para asegurar que el sistema bloquee intentos no autorizados.
3. **Flujos Cruzados Encadenados:**
   - Cada flujo validará el cambio de estado en un módulo y su repercusión inmediata en los módulos dependientes.

## Risks / Trade-offs

- **[Riesgo] Tiempo de ejecución del test runner:**
  - *Mitigación:* Ejecutar las pruebas de verificación de fronteras negativas en ráfagas asíncronas con `Promise.all` para mantener el tiempo de ejecución por debajo de 20 segundos.
