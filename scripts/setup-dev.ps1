# Script de configuración inicial para desarrollo
# Ejecutar desde la raíz del proyecto

Write-Host "🚀 Configurando entorno de desarrollo..." -ForegroundColor Green

# Verificar Docker
Write-Host "📦 Verificando Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✅ Docker encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker no encontrado. Instala Docker Desktop" -ForegroundColor Red
    exit 1
}

# Crear archivos .env si no existen
Write-Host "⚙️ Configurando variables de entorno..." -ForegroundColor Yellow

if (-not (Test-Path "apps/api/.env")) {
    Copy-Item "apps/api/.env.example" "apps/api/.env" -ErrorAction SilentlyContinue
    Write-Host "✅ Creado apps/api/.env" -ForegroundColor Green
}

if (-not (Test-Path "apps/web/.env.local")) {
    Copy-Item "apps/web/.env.example" "apps/web/.env.local" -ErrorAction SilentlyContinue
    Write-Host "✅ Creado apps/web/.env.local" -ForegroundColor Green
}

# Levantar base de datos
Write-Host "🗄️ Levantando PostgreSQL..." -ForegroundColor Yellow
docker compose up -d
Start-Sleep -Seconds 5

# Instalar dependencias
Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
npm install

# Generar Prisma Client
Write-Host "🔧 Configurando base de datos..." -ForegroundColor Yellow
Set-Location "apps/api"
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
Set-Location "../.."

Write-Host "🎉 ¡Configuración completada!" -ForegroundColor Green
Write-Host "Para iniciar el desarrollo ejecuta: npm run dev" -ForegroundColor Cyan
