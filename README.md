# 🥏 SIGEDIVO (Sistema de Gestión para el Disco Volador) — Plataforma de Gestión Deportiva del Disco Volador

![CI](https://github.com/frankSousa23/San-Juan-Ultimate-Crew/actions/workflows/ci.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%206-blue)
![Express](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-lightgrey)
![Prisma](https://img.shields.io/badge/ORM-Prisma%207%20%2B%20PostgreSQL-indigo)
![Release](https://img.shields.io/badge/Release-v1.0.0%20Open%20Source-purple)

---

## 🇻🇪 Dedicatoria y Contexto Deportivo

> *"Este proyecto es mi contribución de corazón a la comunidad venezolana y del mundo para el Ultimate Frisbee / Disco Volador, el deporte más bonito del mundo."*  
> **— Frank Sousa** (`frankSousa23`), San Juan de los Morros, Estado Guárico, Venezuela.

Durante más de 15 años residiendo en **San Juan de los Morros**, he viajado incansablemente al estado **Aragua, Carabobo, Yaracuy** y diversas regiones de Venezuela para competir en ligas, torneos y full days. Al ver la necesidad tecnológica que existía para organizar equipos, llevar estadísticas precisas en tiempo real y profesionalizar los eventos deportivos, dediqué este trabajo a unir a los atletas locales y brindar una herramienta abierta, moderna y gratuita.

Este sistema nace con el firme propósito de respaldar a la **Federación del Disco Volador de Venezuela (FDVV)**, a la **Asociación Aragüeña del Disco Volador (AADV)** y sentar las bases tecnológicas y organizativas para la creación y consolidación de la **Asociación Guariqueña del Disco Volador (AGDV)**.

---

## 📖 Licencia Pública, Open Source (MIT) y Términos de Uso

Este proyecto es software libre y de código abierto bajo la **[Licencia MIT](LICENSE)**.

### 🌟 Cláusulas de Uso y Atribución
- **Uso Libre y Gratuito:** Cualquier club deportivo, liga, federación, colegio, universidad o desarrollador en Venezuela y el mundo puede utilizar, desplegar y adaptar este sistema libremente.
- **Atribución Obligatoria:** Todo uso, bifurcación (*fork*) o proyecto derivado debe incluir el reconocimiento explícito y el enlace al repositorio oficial:
  > **Repositorio Oficial:** [https://github.com/frankSousa23/San-Juan-Ultimate-Crew](https://github.com/frankSousa23/San-Juan-Ultimate-Crew)  
  > **Autor:** Frank Sousa (`frankSousa23`) & SIGEDIVO (Sistema de Gestión para el Disco Volador).
- **Aportes y Mejoras Comunitarias:** ¡Toda contribución es bienvenida! Si deseas proponer nuevas funcionalidades, optimizaciones o reportar mejoras, te invitamos a abrir un *Pull Request* o *Issue*.

---

## 🚀 Módulos y Funcionalidades del Sistema

### 1. ⏱️ Pizarra Táctica y Anotaciones en Vivo (Optimizada para Torneo y Móvil)
- **Diseño Ultra-Responsive y Táctil:** Adaptado para tablets y teléfonos móviles en campo de juego con botones de gran tamaño (`touch-manipulation`, `active:scale-95`).
- **Marcador Gigante Sticky:** Marcador en tiempo real siempre visible en la parte superior al hacer scroll.
- **Registro Rápido en Vivo:**
  - ⚽ **Goles** con asignación táctil del asistente (`relatedPlayerId`).
  - ⚡ **Acceso Directo:** "Sin Asistencia / Callahan / Error Rival" en 1 toque.
  - 🛡️ **Defensas (D)** e intercepciones.
  - ❌ **Pérdidas (Turnovers)**.
- **Modos de Juego:**
  - **Modo Torneo / Versus:** Enfrentamientos oficiales contra equipos rivales con scouting de jugadores.
  - **Modo Scrimmage Interno:** Partidos de práctica entre Equipo Claro vs Equipo Oscuro.
- **Sincronización Automática:** Alimenta al instante la tabla de estadísticas de partido (`PlayerMatchStats`) y la evaluación de Espíritu de Juego (SOTG).

### 2. 🏃 Roster y Perfil de Jugadores
- Registro de dorsales únicos, posiciones tácticas (Manejador/Handler, Cortador/Cutter, Híbrido).
- Estado físico (Activo, Lesionado, Inactivo), estatura, experiencia y vinculación bidireccional con usuarios.

### 3. 📅 Eventos, Torneos y Convocatorias
- Jerarquía de torneos padres con partidos asociados (`GROUP_STAGE`, `QUARTER_FINALS`, `SEMI_FINALS`, `FINALS`).
- Convocatoria de jugadores asignados a líneas tácticas (**O-Line**, **D-Line**, **Flex**).
- Registro de asistencia en tiempo real (`presente`, `tarde`, `ausente`).

### 4. 💰 Finanzas y Tesorería
- Cuentas bancarias y caja chica, categorización de ingresos/egresos y cálculo automático de balances.

### 5. 🏥 Historial Médico y Lesiones
- Seguimiento evolutivo del estado del jugador (Activo -> En Recuperación -> Resuelto).

### 6. 📋 Libro de Jugadas y Estrategia
- Pizarra de jugadas ofensivas (Vertical Stack, Horizontal Stack) y defensivas (Zona 3-3-1, Fuerza Banda).

### 7. 🛡️ Scouting de Rivales
- Fichas técnicas de equipos contrarios y scouting individual de jugadores clave.

### 8. 💬 Comunicaciones, Noticias y Recursos
- Canales en tiempo real vinculados a torneos, noticias oficiales y reglamento oficial WFDF.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, TypeScript, Tailwind CSS, Heroicons, React Hot Toast |
| **Backend API** | Node.js, Express, TypeScript, Prisma ORM 7 (`@prisma/adapter-pg`) |
| **Base de Datos** | PostgreSQL 16 |
| **Testing** | Vitest 4 (Unit & Integration API), Playwright (E2E & Accesibilidad WCAG) |
| **Documentación** | Swagger UI / OpenAPI 3.0 en `/api-docs` |

---

## ⚡ Inicio Rápido en Desarrollo Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/frankSousa23/San-Juan-Ultimate-Crew.git
cd San-Juan-Ultimate-Crew

# 2. Instalar dependencias
npm install

# 3. Iniciar base de datos local con Docker
docker compose up -d

# 4. Sincronizar y poblar base de datos con el Seeder Enriquecido
npm --workspace apps/api run prisma:generate
npm --workspace apps/api run prisma:migrate
npm --workspace apps/api run prisma:seed

# 5. Iniciar servidores de desarrollo
npm run dev
```

- **Frontend Web:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:4000](http://localhost:4000)
- **Swagger API Docs:** [http://localhost:4000/api-docs](http://localhost:4000/api-docs)

---

## 🔐 Usuarios y Roles de Prueba

| Usuario | Contraseña | Rol | Descripción |
| :--- | :--- | :--- | :--- |
| `frankalfonso1988@gmail.com` | `123456` | `admin`, `player` | Administrador General (Dorsal #1) |
| `captain@sigedivo.com` | `123456` | `captain`, `player` | Capitán Ofensivo (Dorsal #2) |
| `coach@sigedivo.com` | `123456` | `coach`, `player` | Entrenador Táctico (Dorsal #3) |
| `treasurer@sigedivo.com` | `123456` | `treasurer`, `player` | Tesorero del Club (Dorsal #4) |
| `player@sigedivo.com` | `123456` | `player` | Jugador Titular (Dorsal #5) |
| `guest@sigedivo.com` | `123456` | `guest` | Refuerzo / Observador (Dorsal #6) |

---

## 🌐 Guía de Despliegue en Producción con Dominio Propio

Para desplegar este sistema en internet (en plataformas gratuitas o de bajo costo como Vercel, Render, Railway, Neon o en tu propio VPS con Docker y SSL), consulta nuestra guía oficial detallada:

👉 **[Guía Oficial de Despliegue (DEPLOYMENT_GUIDE.md)](docs/DEPLOYMENT_GUIDE.md)**

---

## 🧪 Comprobación de Calidad y Tests

```bash
# Auditoría integral del ciclo de datos completo (31/31 flujos)
node local/scripts/audit-full-system.mjs

# Tests unitarios y de integración de la API (139 tests)
npm --workspace apps/api run test:all:auth

# Tests E2E de Playwright y Accesibilidad WCAG
npm --workspace apps/web run test:e2e

# Verificación global de linting y compilación monorepo
npm run check
```

---

## 🤝 Contribuciones

1. Haz un Fork del repositorio.
2. Crea tu rama (`git checkout -b feature/nueva-mejora`).
3. Realiza tus cambios y verifica con `npm run check`.
4. Haz Commit (`git commit -m 'feat: agregar funcionalidad'`).
5. Sube tu rama (`git push origin feature/nueva-mejora`).
6. Abre un **Pull Request**.

---

## 📄 Licencia

Distribuido bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más información.
-e 
## 📚 Documentación Técnica Adicional

- [Diagrama de Flujo de Datos](./docs/FLUJO_DE_DATOS.md): Ciclo de vida y arquitectura del sistema.
- [Recomendaciones de Mejora](./docs/RECOMENDACIONES.md): Hoja de ruta para escalabilidad en la nube, marcadores en tiempo real (WebSockets) y modo Offline.
