#!/bin/bash

# Script de diagnóstico avanzado del proyecto
# Ejecutar desde la raíz del proyecto con Git Bash

echo "🔍 Diagnóstico avanzado del proyecto San Juan Ultimate Crew"
echo "=========================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
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

print_info() {
    echo -e "${CYAN}[i]${NC} $1"
}

# Función para verificar comando
check_command() {
    if command -v $1 &> /dev/null; then
        print_success "$1 está instalado"
        return 0
    else
        print_error "$1 no está instalado"
        return 1
    fi
}

# Función para verificar puerto
check_port() {
    if netstat -an 2>/dev/null | grep -q ":$1 "; then
        print_success "Puerto $1 está en uso"
        return 0
    else
        print_warning "Puerto $1 no está en uso"
        return 1
    fi
}

# Función para verificar URL
check_url() {
    if curl -s $1 &> /dev/null; then
        print_success "$1 está respondiendo"
        return 0
    else
        print_warning "$1 no está respondiendo"
        return 1
    fi
}

# Información del sistema
print_header "INFORMACIÓN DEL SISTEMA"
echo -e "${PURPLE}OS:${NC} $(uname -s)"
echo -e "${PURPLE}Arquitectura:${NC} $(uname -m)"
echo -e "${PURPLE}Shell:${NC} $SHELL"
echo -e "${PURPLE}Directorio actual:${NC} $(pwd)"

# Verificar prerrequisitos
print_header "PRERREQUISITOS"
check_command "node"
if check_command "node"; then
    echo -e "${PURPLE}Versión Node.js:${NC} $(node --version)"
fi

check_command "npm"
if check_command "npm"; then
    echo -e "${PURPLE}Versión npm:${NC} $(npm --version)"
fi

check_command "docker"
if check_command "docker"; then
    echo -e "${PURPLE}Versión Docker:${NC} $(docker --version)"
    if docker info &> /dev/null; then
        print_success "Docker está corriendo"
    else
        print_error "Docker no está corriendo"
    fi
fi

check_command "git"
if check_command "git"; then
    echo -e "${PURPLE}Versión Git:${NC} $(git --version)"
fi

# Verificar estructura del proyecto
print_header "ESTRUCTURA DEL PROYECTO"
if [ -f "package.json" ]; then
    print_success "package.json encontrado"
    echo -e "${PURPLE}Nombre del proyecto:${NC} $(grep '"name"' package.json | cut -d'"' -f4)"
else
    print_error "package.json no encontrado"
fi

if [ -d "apps" ]; then
    print_success "Directorio apps/ encontrado"
    if [ -d "apps/api" ]; then
        print_success "apps/api/ encontrado"
    else
        print_error "apps/api/ no encontrado"
    fi
    if [ -d "apps/web" ]; then
        print_success "apps/web/ encontrado"
    else
        print_error "apps/web/ no encontrado"
    fi
else
    print_error "Directorio apps/ no encontrado"
fi

# Verificar archivos de configuración
print_header "ARCHIVOS DE CONFIGURACIÓN"
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

if [ -f "docker-compose.yml" ]; then
    print_success "docker-compose.yml encontrado"
else
    print_error "docker-compose.yml no encontrado"
fi

# Verificar dependencias
print_header "DEPENDENCIAS"
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

# Verificar servicios
print_header "SERVICIOS"
if docker compose ps | grep -q "db.*Up"; then
    print_success "Base de datos PostgreSQL está corriendo"
else
    print_warning "Base de datos PostgreSQL no está corriendo"
fi

check_port 4000
check_port 5173

# Verificar conectividad
print_header "CONECTIVIDAD"
check_url "http://localhost:4000/health"
check_url "http://localhost:5173"

# Verificar base de datos
print_header "BASE DE DATOS"
if docker exec $(docker compose ps -q db) pg_isready -U sju -d sju_dev &> /dev/null; then
    print_success "Base de datos está accesible"
    
    # Verificar tablas
    table_count=$(docker exec $(docker compose ps -q db) psql -U sju -d sju_dev -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
    if [ "$table_count" -gt 0 ]; then
        print_success "Base de datos tiene $table_count tablas"
    else
        print_warning "Base de datos no tiene tablas (ejecutar migraciones)"
    fi
else
    print_error "Base de datos no está accesible"
fi

# Verificar scripts
print_header "SCRIPTS"
if [ -f "scripts/setup-dev.sh" ]; then
    print_success "scripts/setup-dev.sh existe"
else
    print_warning "scripts/setup-dev.sh no existe"
fi

if [ -f "scripts/start-dev.sh" ]; then
    print_success "scripts/start-dev.sh existe"
else
    print_warning "scripts/start-dev.sh no existe"
fi

if [ -f "scripts/test-all.sh" ]; then
    print_success "scripts/test-all.sh existe"
else
    print_warning "scripts/test-all.sh no existe"
fi

# Resumen y recomendaciones
print_header "RESUMEN Y RECOMENDACIONES"

echo ""
echo -e "${BLUE}Estado general del proyecto:${NC}"

# Contar problemas
problems=0

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    ((problems++))
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado${NC}"
    ((problems++))
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker no está corriendo${NC}"
    ((problems++))
fi

if [ ! -f "apps/api/.env" ]; then
    echo -e "${YELLOW}⚠️  Archivo apps/api/.env no existe${NC}"
    ((problems++))
fi

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependencias no instaladas${NC}"
    ((problems++))
fi

if [ $problems -eq 0 ]; then
    echo -e "${GREEN}✅ Todo parece estar en orden${NC}"
    echo ""
    echo -e "${BLUE}Comandos recomendados:${NC}"
    echo -e "  ${YELLOW}npm run dev${NC} - Iniciar desarrollo"
    echo -e "  ${YELLOW}npm run test${NC} - Ejecutar pruebas"
else
    echo -e "${YELLOW}⚠️  Se encontraron $problems problemas${NC}"
    echo ""
    echo -e "${BLUE}Comandos para solucionar:${NC}"
    echo -e "  ${YELLOW}npm run setup${NC} - Configuración completa"
    echo -e "  ${YELLOW}./scripts/setup-dev.sh${NC} - Configuración manual"
fi

echo ""
echo -e "${PURPLE}Para más información, consulta DEVELOPMENT.md${NC}"
