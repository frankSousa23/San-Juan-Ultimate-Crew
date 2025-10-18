#!/bin/bash

# Script de configuración inicial para desarrollo
# Ejecutar desde la raíz del proyecto con Git Bash

echo "🚀 Configurando entorno de desarrollo..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar Docker
print_status "Verificando Docker..."
if ! command -v docker &> /dev/null; then
    print_error "Docker no encontrado. Instala Docker Desktop"
    exit 1
fi

if ! docker info &> /dev/null; then
    print_error "Docker no está corriendo. Inicia Docker Desktop"
    exit 1
fi

print_success "Docker encontrado y funcionando"

# Crear archivos .env si no existen
print_status "Configurando variables de entorno..."

if [ ! -f "apps/api/.env" ]; then
    if [ -f "apps/api/.env.example" ]; then
        cp apps/api/.env.example apps/api/.env
        print_success "Creado apps/api/.env"
    else
        print_warning "apps/api/.env.example no encontrado, creando .env básico..."
        cat > apps/api/.env << EOF
# Database
DATABASE_URL="postgresql://sju:sju@localhost:5432/sju_dev"

# Server
PORT=4000
NODE_ENV=development

# CORS
CORS_ORIGIN="http://localhost:5173,http://localhost:5176"

# Authentication
AUTH_REQUIRED=false
JWT_SECRET="dev-secret-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
EOF
        print_success "Creado apps/api/.env básico"
    fi
fi

if [ ! -f "apps/web/.env.local" ]; then
    if [ -f "apps/web/.env.example" ]; then
        cp apps/web/.env.example apps/web/.env.local
        print_success "Creado apps/web/.env.local"
    else
        print_warning "apps/web/.env.example no encontrado, creando .env.local básico..."
        cat > apps/web/.env.local << EOF
# API Configuration
VITE_API_URL=http://localhost:4000

# App Configuration
VITE_APP_NAME="San Juan Ultimate Crew"
VITE_APP_VERSION="1.0.0"
EOF
        print_success "Creado apps/web/.env.local básico"
    fi
fi

# Levantar base de datos
print_status "Levantando PostgreSQL..."
docker compose up -d
sleep 5

# Verificar que la base de datos esté funcionando
print_status "Verificando conexión a la base de datos..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker exec $(docker compose ps -q db) pg_isready -U sju -d sju_dev &> /dev/null; then
        print_success "Base de datos disponible"
        break
    fi
    
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        print_error "Base de datos no disponible después de $max_attempts intentos"
        exit 1
    fi
    
    sleep 1
done

# Instalar dependencias
print_status "Instalando dependencias..."
npm install
if [ $? -ne 0 ]; then
    print_error "Error instalando dependencias"
    exit 1
fi
print_success "Dependencias instaladas"

# Configurar base de datos
print_status "Configurando base de datos..."
cd apps/api

print_status "Generando Prisma Client..."
npm run prisma:generate
if [ $? -ne 0 ]; then
    print_error "Error generando Prisma Client"
    exit 1
fi

print_status "Ejecutando migraciones..."
npm run prisma:migrate
if [ $? -ne 0 ]; then
    print_error "Error ejecutando migraciones"
    exit 1
fi

print_status "Cargando datos iniciales..."
npm run prisma:seed
if [ $? -ne 0 ]; then
    print_error "Error cargando datos iniciales"
    exit 1
fi

cd ../..

print_success "¡Configuración completada!"
echo ""
echo -e "${GREEN}🎉 ¡Todo listo para desarrollar!${NC}"
echo ""
echo -e "${BLUE}Comandos útiles:${NC}"
echo -e "  ${YELLOW}npm run dev${NC}          - Iniciar API y Web en paralelo"
echo -e "  ${YELLOW}npm run dev:api${NC}      - Solo API"
echo -e "  ${YELLOW}npm run dev:web${NC}      - Solo Web"
echo -e "  ${YELLOW}./scripts/start-dev.sh${NC} - Inicio rápido"
echo -e "  ${YELLOW}./scripts/test-all.sh${NC}  - Ejecutar todas las pruebas"
echo ""
echo -e "${BLUE}Usuarios de prueba:${NC}"
echo -e "  ${YELLOW}Admin:${NC}  admin@example.com / admin123"
echo -e "  ${YELLOW}Guest:${NC}  guest@example.com / admin123"
echo -e "  ${YELLOW}Player:${NC} player@example.com / admin123"
