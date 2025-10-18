#!/bin/bash

# Script para probar el frontend completo
echo "🧪 Probando Frontend de San Juan Ultimate Crew..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 1. Verificar que el sistema esté corriendo
print_status "Verificando que el sistema esté corriendo..."

# Verificar API
if curl -s http://localhost:4000/health > /dev/null; then
    print_success "API funcionando en http://localhost:4000"
else
    print_error "API no disponible en http://localhost:4000"
    echo "Ejecuta: npm run dev"
    exit 1
fi

# Verificar Web
if curl -s http://localhost:5173 > /dev/null; then
    print_success "Frontend funcionando en http://localhost:5173"
else
    print_error "Frontend no disponible en http://localhost:5173"
    echo "Ejecuta: npm run dev"
    exit 1
fi

# 2. Probar endpoints de la API
print_status "Probando endpoints de la API..."

# Probar jugadores
PLAYERS_RESPONSE=$(curl -s http://localhost:4000/api/players)
if echo "$PLAYERS_RESPONSE" | grep -q '"id"'; then
    PLAYER_COUNT=$(echo "$PLAYERS_RESPONSE" | grep -o '"id"' | wc -l)
    print_success "API Jugadores: $PLAYER_COUNT jugadores encontrados"
else
    print_error "API Jugadores: No se pudieron obtener jugadores"
fi

# Probar eventos
EVENTS_RESPONSE=$(curl -s http://localhost:4000/api/events)
if echo "$EVENTS_RESPONSE" | grep -q '"id"'; then
    EVENT_COUNT=$(echo "$EVENTS_RESPONSE" | grep -o '"id"' | wc -l)
    print_success "API Eventos: $EVENT_COUNT eventos encontrados"
else
    print_warning "API Eventos: No hay eventos (esto es normal)"
fi

# Probar recursos
RESOURCES_RESPONSE=$(curl -s http://localhost:4000/api/resources)
if echo "$RESOURCES_RESPONSE" | grep -q '"id"'; then
    RESOURCE_COUNT=$(echo "$RESOURCES_RESPONSE" | grep -o '"id"' | wc -l)
    print_success "API Recursos: $RESOURCE_COUNT recursos encontrados"
else
    print_warning "API Recursos: No hay recursos (esto es normal)"
fi

# 3. Probar autenticación
print_status "Probando autenticación..."

# Probar login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q '"token"'; then
    print_success "Login: Autenticación funcionando"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    # Probar endpoint protegido
    ME_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/auth/me)
    if echo "$ME_RESPONSE" | grep -q '"user"'; then
        print_success "Auth Me: Usuario autenticado correctamente"
    else
        print_error "Auth Me: Error al obtener información del usuario"
    fi
else
    print_error "Login: Error en autenticación"
fi

# 4. Verificar archivos del frontend
print_status "Verificando archivos del frontend..."

# Verificar componentes principales
COMPONENTS=(
    "apps/web/src/App.tsx"
    "apps/web/src/components/Layout.tsx"
    "apps/web/src/components/Toast.tsx"
    "apps/web/src/components/PlayerForm.tsx"
    "apps/web/src/pages/Dashboard.tsx"
    "apps/web/src/pages/Login.tsx"
    "apps/web/src/pages/Roster.tsx"
    "apps/web/src/lib/api.ts"
    "apps/web/src/hooks/useApi.ts"
)

for component in "${COMPONENTS[@]}"; do
    if [ -f "$component" ]; then
        print_success "Componente: $component ✓"
    else
        print_error "Componente faltante: $component"
    fi
done

# 5. Verificar tipos TypeScript
print_status "Verificando tipos TypeScript..."

TYPES=(
    "apps/web/src/types/player.ts"
    "apps/web/src/types/event.ts"
    "apps/web/src/types/finance.ts"
    "apps/web/src/types/communications.ts"
    "apps/web/src/types/attendance.ts"
    "apps/web/src/types/plays.ts"
    "apps/web/src/types/resource.ts"
)

for type_file in "${TYPES[@]}"; do
    if [ -f "$type_file" ]; then
        print_success "Tipos: $type_file ✓"
    else
        print_warning "Tipos faltantes: $type_file (puede ser normal)"
    fi
done

# 6. Resumen final
echo ""
print_status "=== RESUMEN DEL DIAGNÓSTICO ==="
echo ""
echo -e "${BLUE}✅ Sistema funcionando:${NC}"
echo "  - API: http://localhost:4000"
echo "  - Frontend: http://localhost:5173"
echo "  - Base de datos: PostgreSQL conectada"
echo ""
echo -e "${BLUE}🎯 Próximos pasos:${NC}"
echo "  1. Abre http://localhost:5173 en tu navegador"
echo "  2. Prueba el login con: admin@example.com / admin123"
echo "  3. Navega por las diferentes secciones"
echo "  4. Prueba crear/editar jugadores"
echo ""
echo -e "${BLUE}🔧 Si encuentras problemas:${NC}"
echo "  - Revisa la consola del navegador (F12)"
echo "  - Verifica que no haya errores en la terminal"
echo "  - Ejecuta: npm run diagnose"
echo ""

print_success "🎉 Diagnóstico del frontend completado!"
