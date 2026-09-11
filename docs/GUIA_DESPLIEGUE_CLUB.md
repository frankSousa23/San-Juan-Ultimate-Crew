# 🥏 Guía Oficial de Despliegue para Clubes y Asociaciones — SIGEDIVO

Bienvenido a la **Guía Oficial de Despliegue de SIGEDIVO (Sistema de Gestión para el Disco Volador)**. Esta plataforma es de código abierto (Licencia MIT) y cuenta con una **arquitectura White-Label (Marca Blanca)** diseñada para que cualquier club deportivo, academia, liga o asociación regional pueda clonar este repositorio y poner en marcha su propia plataforma independiente en pocos minutos.

---

## 📋 Índice
1. [Filosofía White-Label y Modelo de Instancia](#1-filosofía-white-label-y-modelo-de-instancia)
2. [Variables de Personalización de Marca](#2-variables-de-personalización-de-marca)
3. [Requisitos Previos](#3-requisitos-previos)
4. [Opción A: Despliegue Inmediato con Docker Compose (Recomendado)](#4-opción-a-despliegue-inmediato-con-docker-compose-recomendado)
5. [Opción B: Despliegue en VPS (Ubuntu / Debian con Node.js y PM2)](#5-opción-b-despliegue-en-vps-ubuntu--debian-con-nodejs-y-pm2)
6. [Opción C: Despliegue en Plataformas Cloud (Render, Railway, Fly.io)](#6-opción-c-despliegue-en-plataformas-cloud-render-railway-flyio)
7. [Primeros Pasos y Configuración Inicial del Administrador](#7-primeros-pasos-y-configuración-inicial-del-administrador)
8. [Respaldos y Mantenimiento de Base de Datos](#8-respaldos-y-mantenimiento-de-base-de-datos)

---

## 1. Filosofía White-Label y Modelo de Instancia

En SIGEDIVO, **cada despliegue representa a una Organización Anfitriona**.
- **Para un Club Deportivo** (ej. *El Pueblito Ultimate Club*):
  - La organización gestiona su plantilla completa de atletas (padre maestro).
  - Las "Escuadras" o "Ramas" internas representan sus divisiones (*Equipo A - Open*, *Equipo B - Desarrollo*, *Femenino*, *Mixto*, *Master*).
  - En cada torneo o partido, se convocan listas o rosters específicos con jugadores de esa plantilla.
  - Los rivales externos (*Mamuts*, *Waraos*, *Fénix*, etc.) se registran en el módulo de Rivales para scouting y enfrentamientos.
- **Para una Asociación Regional o Liga** (ej. *Asociación Guariqueña del Disco Volador - AGDV*, *Asociación Aragüeña del Disco Volador - AADV*):
  - La instancia centraliza los atletas afiliados, el calendario regional de campeonatos y la mesa técnica oficial.

---

## 2. Variables de Personalización de Marca

En `apps/web/.env`, puedes configurar la identidad visual y textual de tu organización:

| Variable | Tipo / Ejemplo | Descripción |
| :--- | :--- | :--- |
| `VITE_ORG_NAME` | `"El Pueblito Ultimate Club"` | Nombre formal y completo de la organización. |
| `VITE_ORG_SHORT_NAME` | `"El Pueblito"` | Nombre corto o acrónimo para barras de navegación. |
| `VITE_APP_TITLE` | `"SIGEDIVO | El Pueblito"` | Título de la pestaña del navegador. |
| `VITE_PRIMARY_COLOR` | `"#16a34a"` (Verde Esmeralda) | Color primario de énfasis de la interfaz. |
| `VITE_LOGO_URL` | `"/logo.png"` o URL HTTPS | Ruta al escudo o logotipo oficial. |
| `VITE_ORG_TYPE` | `"CLUB"` o `"ASSOCIATION"` | Tipo de entidad anfitriona. |
| `VITE_CONTACT_EMAIL` | `"contacto@elpueblitocrew.com"` | Correo de contacto y soporte. |

### Ejemplos de Configuración Rápida

#### Ejemplo 1: Club Deportivo (El Pueblito)
```env
VITE_API_URL=http://localhost:3000/api
VITE_ORG_NAME="El Pueblito Ultimate Club"
VITE_ORG_SHORT_NAME="El Pueblito"
VITE_APP_TITLE="El Pueblito Ultimate • SIGEDIVO"
VITE_PRIMARY_COLOR="#059669"
VITE_ORG_TYPE="CLUB"
VITE_CONTACT_EMAIL="directiva@elpueblitocrew.org"
```

#### Ejemplo 2: Asociación Regional (AGDV)
```env
VITE_API_URL=https://api.agdv.org.ve/api
VITE_ORG_NAME="Asociación Guariqueña del Disco Volador"
VITE_ORG_SHORT_NAME="AGDV"
VITE_APP_TITLE="Portal Oficial AGDV • SIGEDIVO"
VITE_PRIMARY_COLOR="#0284c7"
VITE_ORG_TYPE="ASSOCIATION"
VITE_CONTACT_EMAIL="presidencia@agdv.org.ve"
```

---

## 3. Requisitos Previos

Para desplegar localmente o en un servidor:
- **Git** instalado.
- **Docker** y **Docker Compose** (recomendado para producción y pruebas rápidas).
- O alternativamente:
  - **Node.js 20 LTS** o superior.
  - **PostgreSQL 15+**.
  - **npm** v10+.

---

## 4. Opción A: Despliegue Inmediato con Docker Compose (Recomendado)

La forma más rápida y aislada de levantar la base de datos, la API backend y el frontend:

```bash
# 1. Clonar el repositorio
git clone https://github.com/frankSousa23/San-Juan-Ultimate-Crew.git
cd San-Juan-Ultimate-Crew

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Iniciar todos los servicios
docker compose up -d --build
```

- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:3000/api`
- **Base de Datos PostgreSQL:** Puerto interno `5432`

---

## 5. Opción B: Despliegue en VPS (Ubuntu / Debian con Node.js y PM2)

Si dispones de un servidor VPS (DigitalOcean, Hetzner, Linode, AWS EC2):

### 1. Clonar y dependencias
```bash
git clone https://github.com/frankSousa23/San-Juan-Ultimate-Crew.git /var/www/sigedivo
cd /var/www/sigedivo
npm install
```

### 2. Configurar Base de Datos y Prisma
Edita `.env` en la raíz con la cadena de conexión de PostgreSQL:
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/sigedivo_db?schema=public"
JWT_SECRET="clave_secreta_segura_de_al_menos_32_caracteres"
PORT=3000
NODE_ENV=production
```
Ejecuta las migraciones y el cliente Prisma:
```bash
npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma
npx prisma generate --schema=packages/database/prisma/schema.prisma
```

### 3. Compilar Backend y Frontend
```bash
# Compilar backend
npm --workspace apps/api run build

# Compilar frontend
npm --workspace apps/web run build
```

### 4. Iniciar con PM2
```bash
npm install -g pm2
pm2 start dist/index.js --name "sigedivo-api" --cwd apps/api
pm2 save
pm2 startup
```

### 5. Configurar Nginx para Servir el Frontend y Redirigir el API
Crea `/etc/nginx/sites-available/sigedivo`:
```nginx
server {
    listen 80;
    server_name tu-dominio-del-club.com;

    # Frontend SPA
    location / {
        root /var/www/sigedivo/apps/web/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy a API Backend
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Habilita el sitio y añade SSL gratuito con Certbot:
```bash
sudo ln -s /etc/nginx/sites-available/sigedivo /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d tu-dominio-del-club.com
```

---

## 6. Opción C: Despliegue en Plataformas Cloud (Render, Railway, Fly.io)

Puedes vincular este repositorio directamente a servicios PaaS:

1. **Base de Datos:** Crea una instancia gestionada de PostgreSQL (ej. Neon, Supabase o el PostgreSQL integrado de Render/Railway).
2. **Servicio Web Backend (`apps/api`):**
   - **Build Command:** `npm install && npm run build --workspace apps/api`
   - **Start Command:** `node apps/api/dist/index.js`
   - **Environment Variables:** `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`.
3. **Servicio Web Frontend (`apps/web`):**
   - **Build Command:** `npm run build --workspace apps/web`
   - **Publish Directory:** `apps/web/dist`
   - **Environment Variables:** `VITE_API_URL`, `VITE_ORG_NAME`, `VITE_ORG_SHORT_NAME`, etc.

---

## 7. Primeros Pasos y Configuración Inicial del Administrador

1. Una vez desplegado, accede a la página de inicio.
2. Ingresa con las credenciales de administrador configuradas en tus variables de entorno o mediante el seeder inicial.
3. Dirígete a **Gestión de Equipos / Escuadras** (`/admin/teams`) para crear las divisiones internas de tu club (ej. *Equipo A*, *Equipo B*, *Femenino*, *Mixto*).
4. Registra a tus atletas en el **Roster** oficial.
5. ¡Comienza a planificar entrenamientos, torneos y registrar estadísticas en vivo!

---

## 8. Respaldos y Mantenimiento de Base de Datos

Para respaldar tu información médica, financiera y deportiva:

```bash
# Crear copia de seguridad
pg_dump -U usuario -h localhost -d sigedivo_db > backup_sigedivo_$(date +%Y%m%d).sql

# Restaurar copia de seguridad si es necesario
psql -U usuario -h localhost -d sigedivo_db < backup_sigedivo_20260911.sql
```

Para actualizar tu instancia con las últimas mejoras del proyecto oficial:
```bash
git pull origin main
npm install
npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma
npm --workspace apps/api run build
npm --workspace apps/web run build
pm2 restart sigedivo-api
```

---

*Desarrollado con pasión para la comunidad deportiva por Frank Sousa (`frankSousa23`) y SIGEDIVO.*
