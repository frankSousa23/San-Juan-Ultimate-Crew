#!/bin/bash

# Script de verificación rápida del estado del proyecto
# Ejecutar desde la raíz del proyecto con Git Bash

echo "🔍 Verificación rápida del estado del proyecto..."

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
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Verificar Docker
print_status "Verificando Docker..."
if command -v docker &> /dev/null; then
    if docker info &> /dev/null; then
        print_success "Docker está corriendo"
    else
        print_error "Docker no está corriendo"
    fi
else
    print_error "Docker no está instalado"
fi

# Verificar base de datos
print_status "Verificando base de datos..."
if docker compose ps | grep -q "db.*Up"; then
    print_success "Base de datos está corriendo"
else
    print_warning "Base de datos no está corriendo"
fi

# Verificar archivos de configuración
print_status "Verificando archivos de configuración..."
if [ -f "apps/api/.env" ]; then
    print_success "apps/api/.env existe"
else
    print_warning "apps/api/.env no existe"
fi

if [ -f "apps/web/.env.local" ]; then
    print_success "apps/web/.env.local existe"
else
    print_warning "apps/web/.env.local no existe"
fi

# Verificar dependencias
print_status "Verificando dependencias..."
if [ -d "node_modules" ]; then
    print_success "Dependencias del root instaladas"
else
    print_warning "Dependencias del root no instaladas"
fi

if [ -d "apps/api/node_modules" ]; then
    print_success "Dependencias de API instaladas"
else
    print_warning "Dependencias de API no instaladas"
fi

if [ -d "apps/web/node_modules" ]; then
    print_success "Dependencias de Web instaladas"
else
    print_warning "Dependencias de Web no instaladas"
fi

# Verificar API
print_status "Verificando API..."
if curl -s http://localhost:4000/health &> /dev/null; then
    print_success "API está respondiendo"
else
    print_warning "API no está respondiendo"
fi

# Verificar Web
print_status "Verificando Web..."
if curl -s http://localhost:5173 &> /dev/null; then
    print_success "Web está respondiendo"
else
    print_warning "Web no está respondiendo"
fi

echo ""
echo -e "${BLUE}Comandos útiles:${NC}"
echo -e "  ${YELLOW}./scripts/setup-dev.sh${NC}  - Configurar entorno completo"
echo -e "  ${YELLOW}./scripts/start-dev.sh${NC}   - Inicio rápido"
echo -e "  ${YELLOW}npm run dev${NC}              - Iniciar todo"
echo -e "  ${YELLOW}./scripts/test-all.sh${NC}    - Ejecutar pruebas"
