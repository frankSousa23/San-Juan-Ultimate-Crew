# 🚀 Hoja de Ruta y Recomendaciones de Mejora y Escalabilidad (SIGEDIVO)

Este documento reúne las recomendaciones técnicas y arquitectónicas estratégicas para guiar las futuras etapas de evolución del **Sistema de Gestión para el Disco Volador (SIGEDIVO)**.

---

## 🧭 1. Hoja de Ruta Tecnológica por Fases

| Fase | Enfoque Principal | Estado | Tecnologías Clave | Impacto Deportivo |
| :--- | :--- | :---: | :--- | :--- |
| **Fase 1** | Arquitectura Base & Lanzamiento Comunitario | ✅ Completado | React 18, Vite 6, Express, PostgreSQL, Prisma | Roster, Eventos, Marcadores en Vivo, Finanzas y Roles |
| **Fase 2** | Multi-Equipo & Aislamiento de Datos | ✅ Completado | Multi-tenant por `teamId`, Índices compuestos, Admin de Equipos | Clubes, categorías Open/Femenino/Master operando simultáneamente |
| **Fase 3** | Marcadores en Vivo y PWA Offline First | 🟡 En Desarrollo | WebSockets / Socket.io, Workbox PWA, IndexedDB | Registro sin internet en canchas remotas y transmisión en vivo |
| **Fase 4** | Federación Nacional & Multi-Asociación | ⚪ Planificado | Multi-tenancy federado (`organizationId`), RBAC federado | Despliegue oficial para FDVV, AADV, AGDV y clubes afiliados |
| **Fase 5** | Analítica Táctica con IA y Streaming Overlay | ⚪ Planificado | Gemini API, Canvas Overlay para OBS, Exportación WFDF | Cobertura profesional de transmisiones y scouting con IA |

---

## ⚡ 2. Marcadores en Tiempo Real (WebSockets / SSE)

### Contexto
Actualmente, la actualización del marcador en la mesa técnica se realiza vía peticiones REST HTTP optimistas. Para que el público, entrenadores en banca y fanáticos puedan ver las anotaciones al instante desde sus teléfonos sin recargar:

### Propuesta Técnica
- **Implementar Socket.io / WebSockets** en el backend Express:
  - Crear salas (*rooms*) por partido: `socket.join("match_${eventId}")`.
  - Cuando la mesa técnica registra un gol, emitir el evento `score:updated` a la sala del partido.
- **Beneficio:** 
  - Latencia menor a 100ms.
  - Tablero de marcador público proyectable en pantallas gigantes de estadios o torneos.

---

## 📶 3. Modo Offline-First y Progressive Web App (PWA)

### Contexto
En muchas canchas de entrenamiento y complejos deportivos en Venezuela y Latinoamérica, la cobertura de datos celulares puede ser intermitente o nula.

### Propuesta Técnica
1. **Manifest y Service Workers (Vite PWA Plugin):**
   - Cachear la aplicación completa para que abra instantáneamente aún sin conexión a internet.
2. **Almacenamiento Local Robusto con IndexedDB (Dexie.js / LocalForage):**
   - Guardar las anotaciones y asistencias en la base de datos local del navegador en campo.
3. **Cola de Sincronización (Background Sync API):**
   - Al recuperar la señal de internet, enviar automáticamente todas las acciones acumuladas en una única transacción por lotes (`POST /api/annotations/batch`).

---

## 🏢 4. Arquitectura Multi-Asociación y Jerarquía Federada

### Contexto
Conforme el sistema crezca de equipos y clubes a dar soporte a la **Federación del Disco Volador de Venezuela (FDVV)**, **Asociación Aragüeña (AADV)**, **Asociación Guariqueña (AGDV)** y federaciones internacionales:

### Propuesta de Esquema de Datos
Añadir una capa superior de organización sobre los equipos:

```prisma
model Organization {
  id          Int       @id @default(autoincrement())
  slug        String    @unique // ej: 'fdvv', 'aadv', 'agdv'
  name        String
  type        OrgType   // 'FEDERATION', 'ASSOCIATION', 'CLUB'
  teams       Team[]
  events      Event[]
  createdAt   DateTime  @default(now())
}
```

- **Ventajas:**
  - Aislamiento total entre asociaciones independientes.
  - Vistas consolidadas y tabuladores para torneos nacionales organizados por la Federación.

---

## 📄 5. Exportación Oficial WFDF y Generación de Hojas de Anotación en PDF

- **Actas de Partido Digitales:** Generación automática de hojas de juego en PDF con formato estándar internacional (**WFDF Game Sheet**), incluyendo estadísticas de Spirit of the Game (SOTG), lista de goleadores, asistidores y firmas digitales de los capitanes.
- **Exportación Abierta:** Soporte para descargas en formatos CSV, JSON y XLSX compatibles con software de torneos internacionales (UltiAnalytics, Leaguevine, Score Reporter).

---

## 📺 6. Superposición Gráfica para Transmisiones (OBS Live Stream Overlay)

- **Ruta de Marcador Transparente (`/overlay/match/:id`):**
  - Vista minimalista con fondo transparente que puede ser capturada directamente como fuente de navegador en **OBS Studio** o **vMix**.
  - Permite que las transmisiones de streaming en YouTube o Twitch muestren en vivo el marcador, tiempo de juego, timeouts restantes y nombres de los equipos actualizados en tiempo real.

---

## 🔒 7. Optimización y Seguridad de Base de Datos

1. **Agrupador de Conexiones (Connection Pooling):** Utilizar **PgBouncer** o pools nativos de PostgreSQL para soportar picos masivos de consultas durante finales de torneos.
2. **Caché en Memoria (Redis):** Cachear los rankings de goleadores y clasificaciones públicas con invalidación por eventos para reducir la carga en la base de datos relacional.
3. **Respaldo Automatizado:** Configurar volcados diarios cifrados (`pg_dump`) almacenados en almacenamiento de objetos (S3 / Cloud Storage).
