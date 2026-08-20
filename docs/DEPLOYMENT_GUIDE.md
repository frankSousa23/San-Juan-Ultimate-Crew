# 🌐 Guía Oficial de Despliegue en Producción (SIGEDIVO)

Esta guía detalla el proceso para desplegar el **Sistema de Gestión para el Disco Volador (SIGEDIVO)** en entornos de producción, tanto en servidores dedicados/VPS mediante Docker como en plataformas PaaS modernas (Vercel, Render, Railway, Neon, Fly.io).

---

## 📋 Requisitos Previos

- **Node.js** 20.x o 22.x LTS y **npm** 10+.
- **Docker & Docker Compose** (para despliegue autocontenido en VPS).
- **Instancia de PostgreSQL 16+** (local o en la nube como Neon, Supabase o Render PostgreSQL).
- **Dominio Propio** (opcional pero recomendado para producción con certificado SSL).

---

## 🛠️ Variables de Entorno de Producción

Crea un archivo `.env` en la raíz del proyecto (basado en `.env.example`):

```env
# Puerto de ejecución
PORT=3000
NODE_ENV=production

# Base de Datos PostgreSQL
DATABASE_URL="postgresql://sigedivo_user:tu_contraseña_segura@localhost:5432/sigedivo_db?schema=public"

# Seguridad y Autenticación JWT
JWT_SECRET="genera_una_clave_jwt_criptograficamente_fuerte_de_al_menos_64_caracteres"

# Dominio y CORS
CORS_ORIGIN="https://tudominio.com"

# URL de la API para el cliente (Frontend)
VITE_API_URL="/api"
```

---

## 🐳 Opción 1: Despliegue Todo-en-Uno con Docker Compose (Recomendado para VPS)

El repositorio incluye archivos de configuración para Docker Compose listos para producción.

### 1. Clonar el repositorio en el servidor
```bash
git clone https://github.com/frankSousa23/San-Juan-Ultimate-Crew.git /opt/sigedivo
cd /opt/sigedivo
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
nano .env # Ajusta tus claves y credenciales
```

### 3. Iniciar los contenedores con Docker Compose
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 4. Ejecutar migraciones y sembrado inicial
```bash
docker compose exec api npx prisma migrate deploy
docker compose exec api npx tsx prisma/seed.ts
```

### 5. Configurar NGINX y Certificado SSL (Let's Encrypt / Certbot)
Configura un proxy inverso en NGINX apuntando al puerto local `3000`:

```nginx
server {
    server_name tudominio.com www.tudominio.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Genera el certificado SSL gratuito:
```bash
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

---

## ☁️ Opción 2: Despliegue en la Nube (PaaS / Serverless)

### A. Base de Datos en Neon o Supabase
1. Crea un proyecto gratuito en [Neon](https://neon.tech) o [Supabase](https://supabase.com).
2. Copia la cadena de conexión `DATABASE_URL` (incluyendo `?sslmode=require`).

### B. Backend y Frontend Unificado en Render / Railway
1. Conecta tu repositorio de GitHub en el panel de Render o Railway.
2. Selecciona **Web Service** con entorno **Node**.
3. **Build Command:** `npm run build`
4. **Start Command:** `npm start`
5. Configura las variables de entorno (`DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `PORT=3000`).
6. Ejecuta en la consola de despliegue:
   ```bash
   npx prisma migrate deploy
   ```

---

## 🔄 Respaldo y Mantenimiento de la Base de Datos

Para programar un respaldo diario automático de PostgreSQL mediante `cron`:

```bash
# Crear directorio de respaldos
mkdir -p /opt/backups/sigedivo

# Tarea cron diaria a las 3:00 AM (crontab -e)
0 3 * * * pg_dump -U sigedivo_user -h localhost sigedivo_db | gzip > /opt/backups/sigedivo/db_$(date +\%Y\%m\%d).sql.gz
```

Para restaurar una copia de seguridad:
```bash
gunzip -c /opt/backups/sigedivo/db_20260820.sql.gz | psql -U sigedivo_user -h localhost sigedivo_db
```
