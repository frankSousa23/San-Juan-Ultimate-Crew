#!/bin/bash

# Script para crear archivos .env desde templates
# Ejecutar desde la raíz del proyecto con Git Bash

echo "📝 Creando archivos de configuración..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Crear .env para API
if [ ! -f "apps/api/.env" ]; then
    cat > apps/api/.env << 'EOF'
# Database
DATABASE_URL="postgresql://sju:sju@localhost:5432/sju_dev"

# Server
PORT=4000
NODE_ENV=development

# CORS
CORS_ORIGIN="http://localhost:5173,http://localhost:5176"

# Authentication (set to true to enable JWT auth)
AUTH_REQUIRED=false
JWT_SECRET="dev-secret-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# File Uploads
MAX_FILE_SIZE=10485760
UPLOAD_DIR="./uploads"
EOF
    print_success "Creado apps/api/.env"
else
    print_warning "apps/api/.env ya existe"
fi

# Crear .env.local para Web
if [ ! -f "apps/web/.env.local" ]; then
    cat > apps/web/.env.local << 'EOF'
# API Configuration
VITE_API_URL=http://localhost:4000

# App Configuration
VITE_APP_NAME="San Juan Ultimate Crew"
VITE_APP_VERSION="1.0.0"
EOF
    print_success "Creado apps/web/.env.local"
else
    print_warning "apps/web/.env.local ya existe"
fi

echo ""
echo -e "${BLUE}Archivos de configuración creados.${NC}"
echo -e "${YELLOW}Nota:${NC} Revisa y ajusta las variables según tu entorno."
