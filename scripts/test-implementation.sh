#!/bin/bash

# Script para probar la implementación completa
# Ejecutar desde la raíz del proyecto con Git Bash

echo "🧪 Probando implementación completa..."

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

# Verificar que Docker esté corriendo
print_status "Verificando Docker..."
if ! docker info &> /dev/null; then
    print_error "Docker no está corriendo"
    exit 1
fi

# Verificar que la base de datos esté disponible
print_status "Verificando base de datos..."
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

# Instalar dependencias si es necesario
print_status "Verificando dependencias..."
if [ ! -d "node_modules" ]; then
    print_status "Instalando dependencias..."
    npm install
fi

if [ ! -d "apps/api/node_modules" ]; then
    print_status "Instalando dependencias de API..."
    cd apps/api && npm install && cd ../..
fi

if [ ! -d "apps/web/node_modules" ]; then
    print_status "Instalando dependencias de Web..."
    cd apps/web && npm install && cd ../..
fi

# Generar Prisma Client
print_status "Generando Prisma Client..."
cd apps/api
npm run prisma:generate
if [ $? -ne 0 ]; then
    print_error "Error generando Prisma Client"
    exit 1
fi
cd ../..

# Ejecutar migraciones
print_status "Ejecutando migraciones..."
cd apps/api
npm run prisma:migrate
if [ $? -ne 0 ]; then
    print_error "Error ejecutando migraciones"
    exit 1
fi
cd ../..

# Cargar datos iniciales
print_status "Cargando datos iniciales..."
cd apps/api
npm run prisma:seed
if [ $? -ne 0 ]; then
    print_error "Error cargando datos iniciales"
    exit 1
fi
cd ../..

# Compilar API
print_status "Compilando API..."
cd apps/api
npm run build
if [ $? -ne 0 ]; then
    print_error "Error compilando API"
    exit 1
fi
cd ../..

# Compilar Web
print_status "Compilando Web..."
cd apps/web
npm run build
if [ $? -ne 0 ]; then
    print_error "Error compilando Web"
    exit 1
fi
cd ../..

# Tests de API
print_status "Ejecutando tests de API..."
cd apps/api
npm run test
if [ $? -ne 0 ]; then
    print_error "Tests de API fallaron"
    exit 1
fi
print_success "Tests de API pasaron"
cd ../..

# Verificar que la API esté disponible
print_status "Verificando API..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:4000/health &> /dev/null; then
        print_success "API está respondiendo"
        break
    fi
    
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        print_warning "API no está respondiendo (puede que no esté corriendo)"
        break
    fi
    
    sleep 1
done

print_success "🎉 ¡Implementación probada exitosamente!"
echo ""
echo -e "${BLUE}Próximos pasos:${NC}"
echo -e "  1. ${YELLOW}npm run dev${NC} - Iniciar desarrollo"
echo -e "  2. ${YELLOW}npm run test${NC} - Ejecutar todas las pruebas"
echo -e "  3. ${YELLOW}npm run check${NC} - Verificar estado"
