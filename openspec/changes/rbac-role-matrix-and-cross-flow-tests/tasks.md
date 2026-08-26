## 1. Batería de Pruebas de Seguridad Negativa RBAC

- [x] 1.1 Diseñar e implementar pruebas de rechazo (HTTP 403) para roles no autorizados en cuentas bancarias, transacciones financieras y balances contables en `scripts/run-live-deploy-tests.ts`.
- [x] 1.2 Implementar pruebas de rechazo (HTTP 403) para roles no administrativos en endpoints de aprobación de usuarios (`PATCH /api/users/:id/approval`), asignación de roles y buzón de feedback privado.
- [x] 1.3 Implementar pruebas de inmutabilidad del rol invitado/demostración (`guest`) bloqueando todas las solicitudes POST/PUT/PATCH/DELETE en atletas, eventos y finanzas.

## 2. Flujos de Negocio Cruzados Multi-Rol Encadenados

- [x] 2.1 Implementar caso de prueba para el ciclo de Salud y Táctica: Coach registra lesión médica grave -> Estado de salud del atleta pasa a `INJURED` -> Verificación de alerta en convocatoria táctica.
- [x] 2.2 Implementar caso de prueba para el ciclo de Torneo, Tesorería y Mesa Técnica: Directiva programa Torneo -> Tesorero valida pago de inscripción -> Capitán define roster -> Anotador oficial registra partido con mesa bloqueada.
- [x] 2.3 Implementar caso de prueba de Relevo Oficial de Mesa Técnica en Vivo (`shift-handover`) con verificación de exclusión estricta del anotador saliente.

## 3. Ejecución Integral de la Mega-Suite E2E y Certificación

- [x] 3.1 Ejecutar la suite expandida de 50 casos de prueba en vivo contra el despliegue de producción (`https://san-juan-ultimate-crew.seenode.app`) y verificar 100% PASS.
- [x] 3.2 Actualizar la documentación y matrices de prueba en `README.md`, `docs/TESTING.md` y `docs/REPORTE_BETA_DEPLOY.md`.
