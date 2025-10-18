# Script para ejecutar todas las pruebas
# Ejecutar desde la raíz del proyecto

Write-Host "🧪 Ejecutando suite completa de pruebas..." -ForegroundColor Green

# Verificar que la base de datos esté disponible
Write-Host "🗄️ Verificando base de datos..." -ForegroundColor Yellow
try {
    docker ps --format "table {{.Names}}" | Select-String "db" | Out-Null
    if (-not $?) {
        Write-Host "📦 Levantando base de datos..." -ForegroundColor Yellow
        docker compose up -d
        Start-Sleep -Seconds 5
    }
} catch {
    Write-Host "❌ Error con Docker" -ForegroundColor Red
    exit 1
}

# Tests de API
Write-Host "🔧 Ejecutando tests de API..." -ForegroundColor Yellow
Set-Location "apps/api"
try {
    npm run test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Tests de API fallaron" -ForegroundColor Red
        Set-Location "../.."
        exit 1
    }
    Write-Host "✅ Tests de API pasaron" -ForegroundColor Green
} catch {
    Write-Host "❌ Error ejecutando tests de API" -ForegroundColor Red
    Set-Location "../.."
    exit 1
}
Set-Location "../.."

# Tests E2E
Write-Host "🌐 Ejecutando tests E2E..." -ForegroundColor Yellow
Set-Location "apps/web"
try {
    npm run test:e2e
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Tests E2E fallaron" -ForegroundColor Red
        Set-Location "../.."
        exit 1
    }
    Write-Host "✅ Tests E2E pasaron" -ForegroundColor Green
} catch {
    Write-Host "❌ Error ejecutando tests E2E" -ForegroundColor Red
    Set-Location "../.."
    exit 1
}
Set-Location "../.."

Write-Host "🎉 ¡Todas las pruebas pasaron!" -ForegroundColor Green
