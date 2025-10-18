#!/bin/bash

# Script de build optimizado para producción
# Ejecutar desde la raíz del proyecto con Git Bash

echo "🏗️ Build optimizado para producción..."

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

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. Ejecuta desde la raíz del proyecto."
    exit 1
fi

# Limpiar builds anteriores
print_status "Limpiando builds anteriores..."
rm -rf apps/api/dist
rm -rf apps/web/dist
print_success "Builds anteriores limpiados"

# Verificar dependencias
print_status "Verificando dependencias..."
if [ ! -d "node_modules" ]; then
    print_status "Instalando dependencias del root..."
    npm ci --production=false
fi

if [ ! -d "apps/api/node_modules" ]; then
    print_status "Instalando dependencias de API..."
    cd apps/api && npm ci --production=false && cd ../..
fi

if [ ! -d "apps/web/node_modules" ]; then
    print_status "Instalando dependencias de Web..."
    cd apps/web && npm ci --production=false && cd ../..
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

# Build de API
print_status "Compilando API..."
cd apps/api
npm run build
if [ $? -ne 0 ]; then
    print_error "Error compilando API"
    exit 1
fi
print_success "API compilada exitosamente"
cd ../..

# Build de Web
print_status "Compilando Web..."
cd apps/web
npm run build
if [ $? -ne 0 ]; then
    print_error "Error compilando Web"
    exit 1
fi
print_success "Web compilada exitosamente"
cd ../..

# Verificar archivos generados
print_status "Verificando archivos generados..."

if [ ! -d "apps/api/dist" ]; then
    print_error "Directorio apps/api/dist no encontrado"
    exit 1
fi

if [ ! -f "apps/api/dist/index.js" ]; then
    print_error "apps/api/dist/index.js no encontrado"
    exit 1
fi

if [ ! -d "apps/web/dist" ]; then
    print_error "Directorio apps/web/dist no encontrado"
    exit 1
fi

if [ ! -f "apps/web/dist/index.html" ]; then
    print_error "apps/web/dist/index.html no encontrado"
    exit 1
fi

print_success "Todos los archivos generados correctamente"

# Mostrar información del build
print_status "Información del build:"

echo -e "${BLUE}API:${NC}"
echo -e "  ${YELLOW}Directorio:${NC} apps/api/dist"
echo -e "  ${YELLOW}Archivo principal:${NC} apps/api/dist/index.js"
echo -e "  ${YELLOW}Tamaño:${NC} $(du -sh apps/api/dist | cut -f1)"

echo -e "${BLUE}Web:${NC}"
echo -e "  ${YELLOW}Directorio:${NC} apps/web/dist"
echo -e "  ${YELLOW}Archivo principal:${NC} apps/web/dist/index.html"
echo -e "  ${YELLOW}Tamaño:${NC} $(du -sh apps/web/dist | cut -f1)"

# Crear archivo de información del build
BUILD_INFO_FILE="build-info.json"
cat > $BUILD_INFO_FILE << EOF
{
  "buildDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "buildTime": "$(date +%s)",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "gitBranch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)",
  "api": {
    "distPath": "apps/api/dist",
    "mainFile": "apps/api/dist/index.js",
    "size": "$(du -sh apps/api/dist | cut -f1)"
  },
  "web": {
    "distPath": "apps/web/dist",
    "mainFile": "apps/web/dist/index.html",
    "size": "$(du -sh apps/web/dist | cut -f1)"
  }
}
EOF

print_success "Información del build guardada en $BUILD_INFO_FILE"

# Crear script de inicio para producción
PROD_START_SCRIPT="start-production.sh"
cat > $PROD_START_SCRIPT << 'EOF'
#!/bin/bash

# Script de inicio para producción
echo "🚀 Iniciando San Juan Ultimate Crew en producción..."

# Verificar que el build existe
if [ ! -f "apps/api/dist/index.js" ]; then
    echo "❌ Build de API no encontrado. Ejecuta ./scripts/build-optimized.sh primero"
    exit 1
fi

if [ ! -f "apps/web/dist/index.html" ]; then
    echo "❌ Build de Web no encontrado. Ejecuta ./scripts/build-optimized.sh primero"
    exit 1
fi

# Verificar variables de entorno
if [ ! -f "apps/api/.env" ]; then
    echo "⚠️  Archivo apps/api/.env no encontrado"
    echo "💡 Crea el archivo con las variables de producción"
fi

# Iniciar API
echo "🔧 Iniciando API..."
cd apps/api
NODE_ENV=production npm start &
API_PID=$!
cd ../..

# Esperar a que la API esté lista
echo "⏳ Esperando a que la API esté lista..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:4000/health &> /dev/null; then
        echo "✅ API lista"
        break
    fi
    
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ API no disponible después de $max_attempts intentos"
        kill $API_PID 2>/dev/null
        exit 1
    fi
    
    sleep 1
done

echo "🎉 ¡Aplicación iniciada en producción!"
echo "📡 API: http://localhost:4000"
echo "🌐 Web: Sirve los archivos desde apps/web/dist"
echo ""
echo "Para detener: kill $API_PID"

# Mantener el script corriendo
wait $API_PID
EOF

chmod +x $PROD_START_SCRIPT
print_success "Script de inicio para producción creado: $PROD_START_SCRIPT"

print_success "🎉 ¡Build optimizado completado!"
echo ""
echo -e "${BLUE}Próximos pasos:${NC}"
echo -e "  1. ${YELLOW}Configurar variables de entorno de producción${NC}"
echo -e "  2. ${YELLOW}./start-production.sh${NC} - Iniciar en producción"
echo -e "  3. ${YELLOW}Configurar servidor web para servir apps/web/dist${NC}"
