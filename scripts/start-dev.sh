#!/bin/bash

# Script de inicio rápido para desarrollo
# Ejecutar desde la raíz del proyecto con Git Bash

echo "🚀 Iniciando San Juan Ultimate Crew..."

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

# Verificar que Docker esté corriendo
print_status "Verificando Docker..."
if ! docker info &> /dev/null; then
    print_error "Docker no está corriendo. Inicia Docker Desktop"
    exit 1
fi

# Verificar que la base de datos esté disponible
print_status "Verificando base de datos..."
if ! docker compose ps | grep -q "db.*Up"; then
    print_status "Levantando base de datos..."
    docker compose up -d
    sleep 3
fi

# Verificar que la API esté disponible
print_status "Verificando API..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:4000/health &> /dev/null; then
        print_success "API disponible"
        break
    fi
    
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        print_error "API no disponible después de $max_attempts intentos"
        echo ""
        echo -e "${YELLOW}💡 Soluciones:${NC}"
        echo -e "  1. Ejecuta: ${BLUE}npm run dev:api${NC}"
        echo -e "  2. O ejecuta: ${BLUE}./scripts/setup-dev.sh${NC}"
        exit 1
    fi
    
    sleep 1
done

# Iniciar frontend
print_status "Iniciando frontend..."
echo ""
echo -e "${GREEN}🎉 ¡Todo listo!${NC}"
echo -e "${BLUE}Frontend disponible en:${NC} http://localhost:5173"
echo -e "${BLUE}API disponible en:${NC} http://localhost:4000"
echo ""
echo -e "${YELLOW}Presiona Ctrl+C para detener${NC}"
echo ""

npm run dev:web
