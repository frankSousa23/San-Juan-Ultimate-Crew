#!/bin/bash

# Script principal de desarrollo - San Juan Ultimate Crew
# Ejecutar desde la raíz del proyecto con Git Bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                San Juan Ultimate Crew                       ║"
echo "║                    Script de Desarrollo                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Función para mostrar menú
show_menu() {
    echo -e "\n${BLUE}¿Qué quieres hacer?${NC}"
    echo -e "${YELLOW}1.${NC} 🚀 Configuración inicial completa"
    echo -e "${YELLOW}2.${NC} 🔍 Verificar estado del proyecto"
    echo -e "${YELLOW}3.${NC} 🎯 Iniciar desarrollo (API + Web)"
    echo -e "${YELLOW}4.${NC} 🔧 Solo API"
    echo -e "${YELLOW}5.${NC} 🌐 Solo Web"
    echo -e "${YELLOW}6.${NC} 🗄️  Gestionar base de datos"
    echo -e "${YELLOW}7.${NC} 🧪 Ejecutar pruebas"
    echo -e "${YELLOW}8.${NC} 📊 Diagnóstico avanzado"
    echo -e "${YELLOW}9.${NC} ❓ Ayuda"
    echo -e "${YELLOW}0.${NC} 🚪 Salir"
    echo ""
}

# Función para pausa
pause() {
    echo -e "\n${YELLOW}Presiona Enter para continuar...${NC}"
    read
}

# Función para verificar prerrequisitos básicos
check_basic_requirements() {
    echo -e "${BLUE}Verificando prerrequisitos básicos...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js no está instalado${NC}"
        return 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker no está instalado${NC}"
        return 1
    fi
    
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker no está corriendo${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Prerrequisitos básicos OK${NC}"
    return 0
}

# Función para configuración inicial
setup_initial() {
    echo -e "${BLUE}🚀 Iniciando configuración inicial...${NC}"
    
    if ! check_basic_requirements; then
        echo -e "${RED}❌ Prerrequisitos no cumplidos${NC}"
        pause
        return
    fi
    
    echo -e "${YELLOW}Ejecutando configuración completa...${NC}"
    ./scripts/create-env-files.sh
    ./scripts/setup-dev.sh
    
    echo -e "${GREEN}✅ Configuración completada${NC}"
    pause
}

# Función para verificar estado
check_status() {
    echo -e "${BLUE}🔍 Verificando estado del proyecto...${NC}"
    ./scripts/quick-check.sh
    pause
}

# Función para iniciar desarrollo completo
start_dev() {
    echo -e "${BLUE}🎯 Iniciando desarrollo completo...${NC}"
    
    if ! check_basic_requirements; then
        echo -e "${RED}❌ Prerrequisitos no cumplidos${NC}"
        pause
        return
    fi
    
    echo -e "${YELLOW}Iniciando API y Web en paralelo...${NC}"
    echo -e "${CYAN}Frontend: http://localhost:5173${NC}"
    echo -e "${CYAN}API: http://localhost:4000${NC}"
    echo -e "${YELLOW}Presiona Ctrl+C para detener${NC}"
    echo ""
    
    npm run dev
}

# Función para solo API
start_api() {
    echo -e "${BLUE}🔧 Iniciando solo API...${NC}"
    echo -e "${CYAN}API: http://localhost:4000${NC}"
    echo -e "${YELLOW}Presiona Ctrl+C para detener${NC}"
    echo ""
    
    npm run dev:api
}

# Función para solo Web
start_web() {
    echo -e "${BLUE}🌐 Iniciando solo Web...${NC}"
    echo -e "${CYAN}Frontend: http://localhost:5173${NC}"
    echo -e "${YELLOW}Presiona Ctrl+C para detener${NC}"
    echo ""
    
    npm run dev:web
}

# Función para gestionar base de datos
manage_database() {
    echo -e "${BLUE}🗄️ Gestión de base de datos${NC}"
    echo -e "${YELLOW}1.${NC} Levantar base de datos"
    echo -e "${YELLOW}2.${NC} Detener base de datos"
    echo -e "${YELLOW}3.${NC} Reiniciar base de datos"
    echo -e "${YELLOW}4.${NC} Ejecutar migraciones"
    echo -e "${YELLOW}5.${NC} Cargar datos iniciales"
    echo -e "${YELLOW}6.${NC} Reset completo"
    echo -e "${YELLOW}0.${NC} Volver al menú principal"
    echo ""
    read -p "Selecciona una opción: " db_choice
    
    case $db_choice in
        1) npm run db:up ;;
        2) npm run db:down ;;
        3) npm run db:reset ;;
        4) npm run prisma:migrate ;;
        5) npm run prisma:seed ;;
        6) npm run prisma:reset ;;
        0) return ;;
        *) echo -e "${RED}Opción inválida${NC}" ;;
    esac
    
    pause
}

# Función para ejecutar pruebas
run_tests() {
    echo -e "${BLUE}🧪 Ejecutando pruebas...${NC}"
    echo -e "${YELLOW}1.${NC} Todas las pruebas"
    echo -e "${YELLOW}2.${NC} Solo tests de API"
    echo -e "${YELLOW}3.${NC} Solo tests E2E"
    echo -e "${YELLOW}4.${NC} Smoke test"
    echo -e "${YELLOW}0.${NC} Volver al menú principal"
    echo ""
    read -p "Selecciona una opción: " test_choice
    
    case $test_choice in
        1) npm run test ;;
        2) cd apps/api && npm run test && cd ../.. ;;
        3) cd apps/web && npm run test:e2e && cd ../.. ;;
        4) npm run smoke:e2e ;;
        0) return ;;
        *) echo -e "${RED}Opción inválida${NC}" ;;
    esac
    
    pause
}

# Función para diagnóstico avanzado
advanced_diagnosis() {
    echo -e "${BLUE}📊 Ejecutando diagnóstico avanzado...${NC}"
    ./scripts/diagnose.sh
    pause
}

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}❓ Ayuda - San Juan Ultimate Crew${NC}"
    echo ""
    echo -e "${YELLOW}Comandos directos útiles:${NC}"
    echo -e "  ${CYAN}npm run setup${NC}     - Configuración inicial completa"
    echo -e "  ${CYAN}npm run dev${NC}       - Iniciar API + Web"
    echo -e "  ${CYAN}npm run check${NC}     - Verificar estado"
    echo -e "  ${CYAN}npm run test${NC}      - Ejecutar pruebas"
    echo -e "  ${CYAN}npm run db:up${NC}     - Levantar base de datos"
    echo -e "  ${CYAN}npm run db:down${NC}   - Detener base de datos"
    echo ""
    echo -e "${YELLOW}Scripts individuales:${NC}"
    echo -e "  ${CYAN}./scripts/setup-dev.sh${NC}  - Configuración completa"
    echo -e "  ${CYAN}./scripts/start-dev.sh${NC}  - Inicio rápido"
    echo -e "  ${CYAN}./scripts/quick-check.sh${NC} - Verificación rápida"
    echo -e "  ${CYAN}./scripts/diagnose.sh${NC}   - Diagnóstico avanzado"
    echo ""
    echo -e "${YELLOW}URLs importantes:${NC}"
    echo -e "  ${CYAN}Frontend:${NC} http://localhost:5173"
    echo -e "  ${CYAN}API:${NC} http://localhost:4000"
    echo -e "  ${CYAN}Health:${NC} http://localhost:4000/health"
    echo ""
    echo -e "${YELLOW}Usuarios de prueba:${NC}"
    echo -e "  ${CYAN}Admin:${NC}  admin@example.com / admin123"
    echo -e "  ${CYAN}Guest:${NC}  guest@example.com / admin123"
    echo -e "  ${CYAN}Player:${NC} player@example.com / admin123"
    echo ""
    echo -e "${PURPLE}Para más información, consulta DEVELOPMENT.md${NC}"
    pause
}

# Menú principal
while true; do
    show_menu
    read -p "Selecciona una opción (0-9): " choice
    
    case $choice in
        1) setup_initial ;;
        2) check_status ;;
        3) start_dev ;;
        4) start_api ;;
        5) start_web ;;
        6) manage_database ;;
        7) run_tests ;;
        8) advanced_diagnosis ;;
        9) show_help ;;
        0) 
            echo -e "${GREEN}👋 ¡Hasta luego!${NC}"
            exit 0
            ;;
        *) 
            echo -e "${RED}❌ Opción inválida. Por favor, selecciona 0-9.${NC}"
            pause
            ;;
    esac
done
