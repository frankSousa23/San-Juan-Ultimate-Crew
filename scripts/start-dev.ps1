# Script de inicio rápido para desarrollo
# Ejecutar desde la raíz del proyecto

Write-Host "🚀 Iniciando San Juan Ultimate Crew..." -ForegroundColor Green

# Verificar que Docker esté corriendo
Write-Host "📦 Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerStatus = docker ps --format "table {{.Names}}" | Select-String "db"
    if (-not $dockerStatus) {
        Write-Host "🗄️ Levantando base de datos..." -ForegroundColor Yellow
        docker compose up -d
        Start-Sleep -Seconds 3
    }
} catch {
    Write-Host "❌ Error con Docker" -ForegroundColor Red
    exit 1
}

# Verificar que la API esté disponible
Write-Host "🔍 Verificando API..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0

do {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:4000/health" -TimeoutSec 2 -ErrorAction Stop
        Write-Host "✅ API disponible" -ForegroundColor Green
        break
    } catch {
        $attempt++
        if ($attempt -ge $maxAttempts) {
            Write-Host "❌ API no disponible después de $maxAttempts intentos" -ForegroundColor Red
            Write-Host "💡 Ejecuta: npm run dev:api" -ForegroundColor Yellow
            exit 1
        }
        Start-Sleep -Seconds 1
    }
} while ($attempt -lt $maxAttempts)

# Iniciar frontend
Write-Host "🌐 Iniciando frontend..." -ForegroundColor Yellow
npm run dev:web
