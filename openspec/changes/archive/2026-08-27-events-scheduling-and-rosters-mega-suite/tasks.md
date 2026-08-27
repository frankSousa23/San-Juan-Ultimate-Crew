## 1. Creación Masiva de Tipos de Eventos y Programación de Horarios

- [x] 1.1 Diseñar e implementar pruebas de creación de Torneos oficiales con fixtures jerárquicos multietapa (`GROUP_STAGE`, `SEMI_FINALS`, `FINALS`) y horarios escalonados en `scripts/run-live-deploy-tests.ts`.
- [x] 1.2 Implementar pruebas de creación para Prácticas regulares (`PRACTICE`), Clínicas formativas (`TRAINING`) y Caimaneras internas (`SCRIMMAGE`) con división de bandos (`LIGHT` vs `DARK`).

## 2. Generación Masiva de Rosters y Convocatorias Tácticas

- [x] 2.1 Implementar generación paralela de nóminas masivas de atletas (14 a 20 atletas por club) con posiciones WFDF y validación de unicidad de dorsal intra-club.
- [x] 2.2 Implementar convocatoria masiva de nóminas completas a eventos deportivos (`EventParticipant`) con asignación de líneas tácticas (`O-Line`, `D-Line`) y validación de bandera de refuerzo (`isRefuerzo: true`).

## 3. Control Masivo de Asistencia y Certificación E2E en Vivo

- [x] 3.1 Implementar pase de lista masivo de asistencia (`Attendance`: `present`, `late`, `absent`) para la nómina completa en entrenamientos y partidos.
- [x] 3.2 Ejecutar la suite expandida (Fase 19) en vivo contra producción (`https://san-juan-ultimate-crew.seenode.app`) y certificar 100% PASS de todas las pruebas.
