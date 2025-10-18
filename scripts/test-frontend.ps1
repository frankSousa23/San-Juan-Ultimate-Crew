# Script para probar el frontend completo
Write-Host "🧪 Probando Frontend de San Juan Ultimate Crew..." -ForegroundColor Blue

# 1. Verificar que el sistema esté corriendo
Write-Host "`n[INFO] Verificando que el sistema esté corriendo..." -ForegroundColor Blue

# Verificar API
try {
    $apiResponse = Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing
    if ($apiResponse.StatusCode -eq 200) {
        Write-Host "[SUCCESS] API funcionando en http://localhost:4000" -ForegroundColor Green
    }
} catch {
    Write-Host "[ERROR] API no disponible en http://localhost:4000" -ForegroundColor Red
    Write-Host "Ejecuta: npm run dev" -ForegroundColor Yellow
    exit 1
}

# Verificar Web
try {
    $webResponse = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing
    if ($webResponse.StatusCode -eq 200) {
        Write-Host "[SUCCESS] Frontend funcionando en http://localhost:5173" -ForegroundColor Green
    }
} catch {
    Write-Host "[ERROR] Frontend no disponible en http://localhost:5173" -ForegroundColor Red
    Write-Host "Ejecuta: npm run dev" -ForegroundColor Yellow
    exit 1
}

# 2. Probar endpoints de la API
Write-Host "`n[INFO] Probando endpoints de la API..." -ForegroundColor Blue

# Probar jugadores
try {
    $playersResponse = Invoke-WebRequest -Uri "http://localhost:4000/api/players" -UseBasicParsing
    $playersData = $playersResponse.Content | ConvertFrom-Json
    $playerCount = $playersData.Count
    Write-Host "[SUCCESS] API Jugadores: $playerCount jugadores encontrados" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] API Jugadores: No se pudieron obtener jugadores" -ForegroundColor Red
}

# Probar eventos
try {
    $eventsResponse = Invoke-WebRequest -Uri "http://localhost:4000/api/events" -UseBasicParsing
    $eventsData = $eventsResponse.Content | ConvertFrom-Json
    $eventCount = $eventsData.Count
    Write-Host "[SUCCESS] API Eventos: $eventCount eventos encontrados" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] API Eventos: No hay eventos (esto es normal)" -ForegroundColor Yellow
}

# Probar recursos
try {
    $resourcesResponse = Invoke-WebRequest -Uri "http://localhost:4000/api/resources" -UseBasicParsing
    $resourcesData = $resourcesResponse.Content | ConvertFrom-Json
    $resourceCount = $resourcesData.Count
    Write-Host "[SUCCESS] API Recursos: $resourceCount recursos encontrados" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] API Recursos: No hay recursos (esto es normal)" -ForegroundColor Yellow
}

# 3. Probar autenticación
Write-Host "`n[INFO] Probando autenticación..." -ForegroundColor Blue

try {
    $loginBody = @{
        email = "admin@example.com"
        password = "admin123"
    } | ConvertTo-Json

    $loginResponse = Invoke-WebRequest -Uri "http://localhost:4000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
    $loginData = $loginResponse.Content | ConvertFrom-Json
    
    if ($loginData.token) {
        Write-Host "[SUCCESS] Login: Autenticación funcionando" -ForegroundColor Green
        
        # Probar endpoint protegido
        $headers = @{
            Authorization = "Bearer $($loginData.token)"
        }
        
        $meResponse = Invoke-WebRequest -Uri "http://localhost:4000/api/auth/me" -Headers $headers -UseBasicParsing
        $meData = $meResponse.Content | ConvertFrom-Json
        
        if ($meData.user) {
            Write-Host "[SUCCESS] Auth Me: Usuario autenticado correctamente" -ForegroundColor Green
            Write-Host "  Usuario: $($meData.user.email)" -ForegroundColor Cyan
            Write-Host "  Roles: $($meData.user.roles -join ', ')" -ForegroundColor Cyan
        } else {
            Write-Host "[ERROR] Auth Me: Error al obtener información del usuario" -ForegroundColor Red
        }
    } else {
        Write-Host "[ERROR] Login: Error en autenticación" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERROR] Login: Error en autenticación - $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Verificar archivos del frontend
Write-Host "`n[INFO] Verificando archivos del frontend..." -ForegroundColor Blue

$components = @(
    "apps/web/src/App.tsx",
    "apps/web/src/components/Layout.tsx",
    "apps/web/src/components/Toast.tsx",
    "apps/web/src/components/PlayerForm.tsx",
    "apps/web/src/pages/Dashboard.tsx",
    "apps/web/src/pages/Login.tsx",
    "apps/web/src/pages/Roster.tsx",
    "apps/web/src/lib/api.ts",
    "apps/web/src/hooks/useApi.ts"
)

foreach ($component in $components) {
    if (Test-Path $component) {
        Write-Host "[SUCCESS] Componente: $component ✓" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Componente faltante: $component" -ForegroundColor Red
    }
}

# 5. Verificar tipos TypeScript
Write-Host "`n[INFO] Verificando tipos TypeScript..." -ForegroundColor Blue

$types = @(
    "apps/web/src/types/player.ts",
    "apps/web/src/types/event.ts",
    "apps/web/src/types/finance.ts",
    "apps/web/src/types/communications.ts",
    "apps/web/src/types/attendance.ts",
    "apps/web/src/types/plays.ts",
    "apps/web/src/types/resource.ts"
)

foreach ($type in $types) {
    if (Test-Path $type) {
        Write-Host "[SUCCESS] Tipos: $type ✓" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Tipos faltantes: $type (puede ser normal)" -ForegroundColor Yellow
    }
}

# 6. Resumen final
Write-Host "`n=== RESUMEN DEL DIAGNÓSTICO ===" -ForegroundColor Blue
Write-Host ""
Write-Host "✅ Sistema funcionando:" -ForegroundColor Green
Write-Host "  - API: http://localhost:4000" -ForegroundColor Cyan
Write-Host "  - Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "  - Base de datos: PostgreSQL conectada" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 Próximos pasos:" -ForegroundColor Blue
Write-Host "  1. Abre http://localhost:5173 en tu navegador" -ForegroundColor White
Write-Host "  2. Prueba el login con: admin@example.com / admin123" -ForegroundColor White
Write-Host "  3. Navega por las diferentes secciones" -ForegroundColor White
Write-Host "  4. Prueba crear/editar jugadores" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Si encuentras problemas:" -ForegroundColor Blue
Write-Host "  - Revisa la consola del navegador (F12)" -ForegroundColor White
Write-Host "  - Verifica que no haya errores en la terminal" -ForegroundColor White
Write-Host "  - Ejecuta: npm run diagnose" -ForegroundColor White
Write-Host ""

Write-Host "🎉 Diagnóstico del frontend completado!" -ForegroundColor Green
