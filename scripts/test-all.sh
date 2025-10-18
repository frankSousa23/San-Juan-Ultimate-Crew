#!/bin/bash

# Script para ejecutar todas las pruebas
# Ejecutar desde la raíz del proyecto con Git Bash

echo "🧪 Ejecutando suite completa de pruebas..."

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

# Verificar que la base de datos esté disponible
print_status "Verificando base de datos..."
if ! docker info &> /dev/null; then
    print_error "Docker no está corriendo"
    exit 1
fi

if ! docker compose ps | grep -q "db.*Up"; then
    print_status "Levantando base de datos..."
    docker compose up -d
    sleep 5
fi

# Verificar conexión a la base de datos
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if docker exec $(docker compose ps -q db) pg_isready -U sju -d sju_dev &> /dev/null; then
        print_success "Base de datos disponible"
        break
    fi
    
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        print_error "Base de datos no disponible"
        exit 1
    fi
    
    sleep 1
done

# Tests de API
print_status "Ejecutando tests de API..."
cd apps/api

npm run test
if [ $? -ne 0 ]; then
    print_error "Tests de API fallaron"
    cd ../..
    exit 1
fi
print_success "Tests de API pasaron"

cd ../..

# Tests E2E
print_status "Ejecutando tests E2E..."
cd apps/web

npm run test:e2e
if [ $? -ne 0 ]; then
    print_error "Tests E2E fallaron"
    cd ../..
    exit 1
fi
print_success "Tests E2E pasaron"

cd ../..

print_success "🎉 ¡Todas las pruebas pasaron!"
