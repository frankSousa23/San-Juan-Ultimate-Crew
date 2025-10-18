# Script simplificado para probar el frontend
Write-Host "Probando Frontend de San Juan Ultimate Crew..." -ForegroundColor Blue

# Verificar API
try {
    $apiResponse = Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing
    Write-Host "API funcionando en http://localhost:4000" -ForegroundColor Green
} catch {
    Write-Host "API no disponible" -ForegroundColor Red
    exit 1
}

# Verificar Web
try {
    $webResponse = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing
    Write-Host "Frontend funcionando en http://localhost:5173" -ForegroundColor Green
} catch {
    Write-Host "Frontend no disponible" -ForegroundColor Red
    exit 1
}

# Probar jugadores
try {
    $playersResponse = Invoke-WebRequest -Uri "http://localhost:4000/api/players" -UseBasicParsing
    $playersData = $playersResponse.Content | ConvertFrom-Json
    Write-Host "API Jugadores: $($playersData.Count) jugadores encontrados" -ForegroundColor Green
} catch {
    Write-Host "Error obteniendo jugadores" -ForegroundColor Red
}

# Probar login
try {
    $loginBody = @{
        email = "admin@example.com"
        password = "admin123"
    } | ConvertTo-Json

    $loginResponse = Invoke-WebRequest -Uri "http://localhost:4000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
    $loginData = $loginResponse.Content | ConvertFrom-Json
    
    if ($loginData.token) {
        Write-Host "Login funcionando correctamente" -ForegroundColor Green
    }
} catch {
    Write-Host "Error en login" -ForegroundColor Red
}

Write-Host ""
Write-Host "Sistema funcionando correctamente!" -ForegroundColor Green
Write-Host "Abre http://localhost:5173 en tu navegador" -ForegroundColor Cyan
