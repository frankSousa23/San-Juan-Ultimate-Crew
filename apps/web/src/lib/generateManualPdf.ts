import { jsPDF } from 'jspdf'

export function generateSystemManualPdf(): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 16
  const contentWidth = pageWidth - margin * 2

  let pageNumber = 1

  function addHeader(title: string) {
    doc.setFillColor(30, 58, 138) // Navy Blue (#1e3a8a)
    doc.rect(0, 0, pageWidth, 12, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text('SIGEDIVO • MANUAL MAESTRO DE OPERACIONES Y DOCUMENTACIÓN OFICIAL', margin, 7.5)
    doc.text(title.toUpperCase(), pageWidth - margin, 7.5, { align: 'right' })
  }

  function addFooter() {
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text('Sistema de Gestión para el Disco Volador • Frank Sousa • SIGEDIVO 2026', margin, pageHeight - 7)
    doc.text(`Página ${pageNumber}`, pageWidth - margin, pageHeight - 7, { align: 'right' })
    pageNumber++
  }

  function newPage(headerTitle: string) {
    addFooter()
    doc.addPage()
    addHeader(headerTitle)
  }

  // ==========================================
  // PÁGINA 1: PORTADA INSTITUCIONAL
  // ==========================================
  doc.setFillColor(248, 250, 252)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  // Banda superior
  doc.setFillColor(30, 58, 138) // Navy
  doc.rect(0, 0, pageWidth, 75, 'F')

  // Acento dorado
  doc.setFillColor(217, 119, 6) // Amber/Gold
  doc.rect(0, 72, pageWidth, 4, 'F')

  // Logo / Título
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.setTextColor(255, 255, 255)
  doc.text('SIGEDIVO', margin, 35)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(224, 231, 255)
  doc.text('Plataforma Integral de Gestión Deportiva, Táctica y Administrativa', margin, 46)

  doc.setFontSize(9.5)
  doc.setTextColor(254, 243, 199)
  doc.text('Manual Maestro Oficial 2026 • Arquitectura, Roles, Módulos, Testing y Licencia', margin, 58)

  // Tarjeta central de presentación
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(margin, 88, contentWidth, 128, 3, 3, 'FD')
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(15, 23, 42)
  doc.text('MANUAL DEL USUARIO Y GUÍA TÉCNICA OFICIAL', margin + 8, 102)

  doc.setFontSize(9.5)
  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'normal')
  const summaryText = [
    'Este documento constituye el manual de referencia técnica y operativa para todos los miembros,',
    'directivos, capitanes, entrenadores, anotadores, atletas e invitados del sistema SIGEDIVO.',
    '',
    '• Arquitectura Multi-Equipo y Multi-División: Soporte para la convivencia de múltiples clubes',
    '  y categorías (Open, Femenino, Mixto, Master) con aislamiento seguro de datos por Team ID.',
    '• Control de Acceso RBAC: Matriz estricta de permisos jerárquicos y auditoría inmutable.',
    '• Pizarra Táctica y Marcador en Vivo: Registro instantáneo de jugadas, +/- y Espíritu de Juego.',
    '• Calidad de Software: Suite de pruebas unitarias, integración API y pruebas E2E con Playwright.',
    '• Software Libre y Código Abierto: Distribuido bajo Licencia MIT para la comunidad global.',
  ]
  let yPos = 112
  for (const line of summaryText) {
    doc.text(line, margin + 8, yPos)
    yPos += 5.2
  }

  // Cuadro informativo de seguridad y accesos
  doc.setFillColor(241, 245, 249)
  doc.roundedRect(margin + 8, 168, contentWidth - 16, 40, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(30, 58, 138)
  doc.text('POLÍTICA INSTITUCIONAL DE SEGURIDAD Y ACCESOS:', margin + 12, 175)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(51, 65, 85)
  doc.text('• Administrador Principal (frankalfonso1988@gmail.com): Aprobación de cuentas y configuración.', margin + 12, 182)
  doc.text('• Registros Nuevos: Ingresan en estado PENDIENTE hasta ser verificados y asignados a su rol y equipo.', margin + 12, 189)
  doc.text('• Modo Invitado (guest@sigedivo.com): Permite exploración inmediata en solo lectura sin registro.', margin + 12, 196)
  doc.text('• Auditoría: Registro inmutable de cada transacción con marca de tiempo UTC e IP autorizadora.', margin + 12, 203)

  // Metadatos inferiores
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139)
  doc.text('ESTADO DEL DOCUMENTO:', margin, 235)
  doc.setFont('helvetica', 'normal')
  doc.text('Aprobado y Vigente para Producción 2026', margin + 46, 235)

  doc.setFont('helvetica', 'bold')
  doc.text('AUTOR & DIRECCIÓN:', margin, 242)
  doc.setFont('helvetica', 'normal')
  doc.text('Frank Sousa (frankSousa23) • San Juan de los Morros, Guárico, Venezuela', margin + 46, 242)

  doc.setFont('helvetica', 'bold')
  doc.text('ORGANIZACIÓN:', margin, 249)
  doc.setFont('helvetica', 'normal')
  doc.text('SIGEDIVO • Sistema de Gestión para el Disco Volador (WFDF Compliant)', margin + 46, 249)

  addFooter()

  // ==========================================
  // PÁGINA 2: MATRIZ DE ROLES Y CONTROL DE ACCESO (RBAC)
  // ==========================================
  doc.addPage()
  addHeader('Matriz de Roles y Permisos (RBAC)')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(30, 58, 138)
  doc.text('1. MATRIZ DE CONTROL DE ACCESO BASADO EN ROLES (RBAC)', margin, 22)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(51, 65, 85)
  doc.text(
    'SIGEDIVO aplica un modelo RBAC estricto para garantizar la confidencialidad médica, la integridad contable y la autonomía operativa del cuerpo técnico en cada club y división.',
    margin,
    27,
    { maxWidth: contentWidth }
  )

  const roles = [
    {
      name: 'Super Admin (admin)',
      badge: 'Control Total',
      desc: 'Máxima autoridad técnica y administrativa. Aprueba usuarios, asigna roles y equipos, supervisa auditoría inmutable, gestiona parámetros globales y balances financieros.',
      perms: 'users:manage, audit:view, roster:manage, events:manage, finance:manage, annotations:manage, plays:manage, injuries:manage, rivals:manage, resources:manage, teams:manage',
    },
    {
      name: 'Directiva del Club (directiva)',
      badge: 'Gestión Institucional',
      desc: 'Supervisión de equipos, delegaciones y eventos oficiales. Acceso a rosters, calendarios de torneos, balances económicos y comunicación oficial con atletas.',
      perms: 'roster:manage, events:manage, finance:manage, annotations:manage, plays:manage, injuries:manage, rivals:manage, teams:view',
    },
    {
      name: 'Capitán de Equipo (captain)',
      badge: 'Liderazgo Deportivo',
      desc: 'Convocatoria y alineaciones (Línea O ofensiva y Línea D defensiva), estrategias en juego, toma de estadísticas en vivo durante partidos y rubricación de Espíritu de Juego (SOTG).',
      perms: 'roster:manage, events:manage, attendance:manage, annotations:manage, plays:manage, rivals:manage, injuries:manage, communications:manage',
    },
    {
      name: 'Entrenador / Coach (coach)',
      badge: 'Técnico y Táctico',
      desc: 'Planificación de sesiones de entrenamiento, publicación de esquemas tácticos en el Playbook, control de asistencia semanal y seguimiento clínico/rehabilitación de lesiones.',
      perms: 'events:manage, attendance:manage, plays:manage, resources:manage, injuries:manage, annotations:manage, communications:manage',
    },
    {
      name: 'Tesorero (treasurer)',
      badge: 'Finanzas y Cuotas',
      desc: 'Administración de cuentas bancarias y caja chica. Registro de ingresos (cuotas, inscripciones de torneos) y egresos (alquiler de canchas, equipamiento, hidratación).',
      perms: 'finance:manage, finance:view, roster:view, events:view, statistics:view',
    },
    {
      name: 'Mesa Técnica / Anotador (annotator)',
      badge: 'Estadísticas Oficiales',
      desc: 'Registro jugada a jugada en vivo: goles, asistencias, defensas (D), pérdidas de posesión (turnovers), tiempos fuera y cálculo de la rúbrica oficial WFDF de Espíritu de Juego.',
      perms: 'annotations:manage, annotations:view, statistics:view, events:view, roster:view, rivals:view',
    },
    {
      name: 'Jugador del Roster (player)',
      badge: 'Miembro Activo',
      desc: 'Consulta del calendario competitivo, confirmación de asistencia con 1 clic (RSVP), visualización de estadísticas individuales y de equipo, pizarrón táctico y canales de noticias.',
      perms: 'roster:view, events:view, attendance:view, statistics:view, plays:view, resources:view, annotations:view, communications:manage',
    },
    {
      name: 'Invitado / Visitante (guest)',
      badge: 'Muestra / Solo Lectura',
      desc: 'Rol demostrativo pre-aprobado. Permite a visitantes explorar el roster, calendario, estadísticas, pizarrón táctico, caimaneras y descargar toda la documentación técnica.',
      perms: 'roster:view, events:view, statistics:view, plays:view, resources:view, annotations:view, rivals:view',
    },
  ]

  let rY = 35
  for (const role of roles) {
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(margin, rY, contentWidth, 27, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(15, 23, 42)
    doc.text(role.name, margin + 4, rY + 5.5)

    doc.setFontSize(7.5)
    doc.setTextColor(30, 58, 138)
    doc.text(`[ ${role.badge} ]`, margin + contentWidth - 4, rY + 5.5, { align: 'right' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(51, 65, 85)
    doc.text(role.desc, margin + 4, rY + 11.5, { maxWidth: contentWidth - 8 })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(100, 116, 139)
    doc.text('Permisos:', margin + 4, rY + 22)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)
    doc.text(role.perms, margin + 18, rY + 22, { maxWidth: contentWidth - 22 })

    rY += 30
  }

  // ==========================================
  // PÁGINA 3: FLUJO DE REGISTRO, APROBACIÓN Y ARQUITECTURA MULTI-EQUIPO
  // ==========================================
  newPage('Flujo de Registro y Multi-Equipo')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(30, 58, 138)
  doc.text('2. FLUJO DE REGISTRO, APROBACIÓN Y AISLAMIENTO MULTI-EQUIPO', margin, 22)

  // Diagrama visual
  doc.setFillColor(238, 242, 255)
  doc.roundedRect(margin, 27, contentWidth, 36, 2, 2, 'F')
  doc.setDrawColor(199, 210, 254)
  doc.rect(margin, 27, contentWidth, 36)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(30, 58, 138)
  doc.text('CICLO DE VIDA DE UNA CUENTA DE USUARIO EN SIGEDIVO:', margin + 6, 33)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(30, 41, 59)
  doc.text('[1. Atleta se registra en /register] ──> [2. Estado Inicial: PENDING (Acceso Restringido)]', margin + 6, 40)
  doc.text('                                │', margin + 6, 44)
  doc.text('                                ▼', margin + 6, 48)
  doc.text('[3. Super Admin valida identidad en /admin/usuarios] ──> [4. Asigna Rol, Equipo y Dorsal]', margin + 6, 52)
  doc.text('                                │', margin + 6, 56)
  doc.text('                                ▼', margin + 6, 59)
  doc.text('[5. Estado: APPROVED ──> Login Exitoso con Acceso Completo a su Equipo Asignado]', margin + 6, 60)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(15, 23, 42)
  doc.text('3. GUÍA DETALLADA DE VISTAS Y MÓDULOS DEL SISTEMA (PARTE 1)', margin, 71)

  const modulesPart1 = [
    {
      title: '3.1 Roster del Equipo & Jugadores (/roster)',
      desc: 'Catálogo oficial de jugadores del club. Permite gestionar dorsales (números de camiseta únicos por equipo), posiciones oficiales (Manejador, Cortador, Híbrido), datos antropométricos (estatura en cm), trayectoria deportiva y estado (Activo, Lesionado, Suspendido).',
      mockup: '[ ROSTER ] #1 Franco Sousa (Manejador - 182cm) | #2 Carlos Mendoza (Cortador - 185cm) | #3 Eduardo Silva (Híbrido)',
    },
    {
      title: '3.2 Calendario, Eventos, Torneos & Convocatorias (/eventos)',
      desc: 'Gestión de la agenda competitiva: entrenamientos semanales, partidos amistosos y torneos nacionales. Incluye jerarquía de torneos padres con partidos asociados (Grupos, Semis, Final), registro de condiciones climáticas/viento y confirmación RSVP.',
      mockup: '[ EVENTO ] Torneo Nacional 2026 • Cancha 1 • Clima: Soleado • Viento: 18 km/h NE (Fuerte) | Convocatoria: Línea O / D',
    },
    {
      title: '3.3 Anotaciones en Vivo & Mesa Técnica (/eventos/:id/anotaciones)',
      desc: 'Pizarra táctica interactiva en tiempo real optimizada para tablets y smartphones en campo. Permite registrar goles, asistencias directas, bloqueos defensivos (D), pérdidas (turnovers), tiempos fuera y rúbrica WFDF de Espíritu de Juego (SOTG).',
      mockup: '[ LIVE SCORE ] Equipo Local 15 - 11 Dragones | Botones Rápidos: [+GOL] [+ASIST] [+DEFENSA D] [-PÉRDIDA] [SOTG 10/20]',
    },
    {
      title: '3.4 Finanzas & Libro Contable (/finanzas)',
      desc: 'Herramienta contable para Administradores y Tesoreros. Permite administrar cuentas bancarias y caja chica, registrar ingresos (cuotas mensuales, patrocinios, inscripciones) y egresos (canchas, hidratación, uniformes), con exportación CSV.',
      mockup: '[ FINANZAS ] Balance Neto: +$870.00 USD | Ingresos: $1,300.00 | Egresos: $430.00 | Cuentas: Banco ($650) / Caja ($220)',
    },
    {
      title: '3.5 Gestión Multi-Equipo y Divisiones (/admin/equipos)',
      desc: 'Módulo para Directiva y Super Admin. Permite registrar múltiples equipos (Open, Femenino, Mixto, Master), configurar colores institucionales, escudos vectoriales y monitorear métricas agregadas garantizando aislamiento de datos.',
      mockup: '[ EQUIPOS ] San Juan Ultimate (Open) | Guárico Frisbee (Femenino) | AADV All-Stars (Mixto) | Total: 3 Clubes Activos',
    },
  ]

  let mY = 77
  for (const mod of modulesPart1) {
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(203, 213, 225)
    doc.roundedRect(margin, mY, contentWidth, 31, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(30, 58, 138)
    doc.text(mod.title, margin + 4, mY + 5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.8)
    doc.setTextColor(51, 65, 85)
    doc.text(mod.desc, margin + 4, mY + 10.5, { maxWidth: contentWidth - 8 })

    // Mockup visual
    doc.setFillColor(241, 245, 249)
    doc.roundedRect(margin + 4, mY + 21.5, contentWidth - 8, 6.5, 1, 1, 'F')
    doc.setFont('courier', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(30, 41, 59)
    doc.text(mod.mockup, margin + 6, mY + 26)

    mY += 34
  }

  // ==========================================
  // PÁGINA 4: VISTAS (PARTE 2) Y MODO INVITADO
  // ==========================================
  newPage('Módulos Tácticos y Modo Invitado')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(30, 58, 138)
  doc.text('3. GUÍA DETALLADA DE VISTAS Y MÓDULOS DEL SISTEMA (PARTE 2)', margin, 22)

  const modulesPart2 = [
    {
      title: '3.6 Pizarrón Táctico & Playbook (/jugadas)',
      desc: 'Biblioteca de formaciones y esquemas tácticos interactivos: Vertical Stack (Break Flow), Horizontal Stack (Isolación central) y Defensa de Zona (3-3-1 Cup). Incluye desglose por fases, roles por posición y directrices para viento a favor o en contra.',
      mockup: '[ TÁCTICA ] Vertical Stack - Break Flow | Ofensiva | 1. Manejadores centro -> 2. Corte diagonal -> 3. Pase profundo',
    },
    {
      title: '3.7 Scouting de Equipos Rivales (/rivales)',
      desc: 'Base de conocimiento técnico sobre rivales de torneos: registro de fortalezas tácticas, debilidades defensivas, lanzadores zurdos clave, historial de enfrentamientos previos y notas de campo para preparar los planteamientos estratégicos.',
      mockup: '[ SCOUTING ] Caracas Ultimate Club | Fortalezas: Rompimiento horizontal | Debilidades: Zona con viento fuerte',
    },
    {
      title: '3.8 Seguimiento Médico & Gestión de Lesiones (/lesiones)',
      desc: 'Control clínico de salud del plantel: registro de lesiones (esguinces, contracturas, sobrecargas), severidad (Leve, Moderada, Grave), fecha del incidente, protocolo de rehabilitación y fecha estimada de alta médica para habilitación.',
      mockup: '[ PARTE MÉDICO ] Daniel Salazar • Esguince tobillo grado 1 (Leve) • Recuperación: 10 días • Estado: En Tratamiento',
    },
    {
      title: '3.9 Panel de Usuarios, Aprobación y Auditoría Inmutable (/admin/usuarios)',
      desc: 'Módulo exclusivo para el Super Admin. Visualiza solicitudes de registro pendientes, listado de usuarios, asignación dinámica de roles y registro inmutable de auditoría (logs de accesos, modificaciones, cambios contables y eliminaciones con IP).',
      mockup: '[ ADMIN ] Solicitudes Pendientes: 2 | [ Aprobar Jugador ] [ Asignar Dorsal #9 ] | Logs de Auditoría: 100% Verificado',
    },
  ]

  let m2Y = 27
  for (const mod of modulesPart2) {
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(203, 213, 225)
    doc.roundedRect(margin, m2Y, contentWidth, 31, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(30, 58, 138)
    doc.text(mod.title, margin + 4, m2Y + 5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.8)
    doc.setTextColor(51, 65, 85)
    doc.text(mod.desc, margin + 4, m2Y + 10.5, { maxWidth: contentWidth - 8 })

    doc.setFillColor(241, 245, 249)
    doc.roundedRect(margin + 4, m2Y + 21.5, contentWidth - 8, 6.5, 1, 1, 'F')
    doc.setFont('courier', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(30, 41, 59)
    doc.text(mod.mockup, margin + 6, m2Y + 26)

    m2Y += 34
  }

  // Sección especial del Modo Invitado y Caimaneras
  doc.setFillColor(240, 253, 244)
  doc.roundedRect(margin, m2Y + 2, contentWidth, 58, 2, 2, 'F')
  doc.setDrawColor(187, 247, 208)
  doc.rect(margin, m2Y + 2, contentWidth, 58)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(22, 101, 52)
  doc.text('4. GUÍA DEL MODO INVITADO, CAIMANERAS Y DEMO PÚBLICA', margin + 6, m2Y + 9)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.8)
  doc.setTextColor(20, 83, 45)
  const guestLines = [
    '• Acceso Inmediato en 1 Clic: En la pantalla de login (/login), el botón "Acceso Invitado" permite explorar',
    '  el Roster, Calendario, Estadísticas, Pizarrón Táctico y descargar este manual sin registrarse.',
    '• Modo Caimanera (Partidos Informales / Mixtos): Permite incorporar jugadores invitados o refuerzos temporales',
    '  en partidos de práctica. Cuando el jugador se registra formalmente, la mesa técnica puede fusionar',
    '  atómicamente todas sus estadísticas acumuladas a su perfil oficial.',
    '• Permisos de Solo Lectura: El modo invitado no permite alterar datos, crear transacciones financieras,',
    '  modificar alineaciones ni consultar los registros privados de auditoría.',
    '• Modo Oscuro (Dark Mode): Conmutador visual persistente (☀️/🌙) en la barra superior con contraste óptimo.',
    '• Solicitud de Membresía: Cualquier invitado puede completar el formulario de registro en /register para',
    '  solicitar su incorporación formal al equipo.',
  ]
  let gY = m2Y + 16
  for (const line of guestLines) {
    doc.text(line, margin + 6, gY)
    gY += 5
  }

  // ==========================================
  // PÁGINA 5: CANCHA REGLAMENTARIA WFDF, TÁCTICA Y SOTG
  // ==========================================
  newPage('Cancha Reglamentaria WFDF y Táctica')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(30, 58, 138)
  doc.text('5. DIMENSIONES OFICIALES WFDF, ESQUEMAS TÁCTICOS Y SOTG', margin, 22)

  // Dimensiones del campo
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(margin, 27, contentWidth, 76, 2, 2, 'FD')
  doc.setDrawColor(203, 213, 225)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(15, 23, 42)
  doc.text('5.1 Campo Oficial de Ultimate Frisbee sobre Césped (100m x 37m)', margin + 4, 34)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(51, 65, 85)
  const fieldText = [
    '• Longitud Total: 100 metros (64 metros de campo central más dos zonas de anotación de 18 metros en cada extremo).',
    '• Ancho Reglamentario: 37 metros.',
    '• Puntos de Marca de Brick (Brick Marks): Ubicados a 18 metros de cada línea de gol en el centro del campo (ancho 18.5m).',
    '• Disco Reglamentario: 175 gramos, 27 cm de diámetro (Discraft Ultra-Star o modelo aprobado por la WFDF).',
    '• Número de Jugadores: 7 vs 7 en césped (5 vs 5 en playa o sala). Partidos a 15 puntos o 90-100 minutos.',
  ]
  let fPos = 41
  for (const fLine of fieldText) {
    doc.text(fLine, margin + 4, fPos)
    fPos += 4.8
  }

  // Mini diagrama de campo
  doc.setFillColor(21, 128, 61) // Green
  doc.roundedRect(margin + 4, 67, contentWidth - 8, 30, 1, 1, 'F')
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.4)
  doc.rect(margin + 4, 67, contentWidth - 8, 30, 'S')

  // Endzones en mini diagrama
  const miniW = contentWidth - 8
  const endzW = miniW * 0.18
  doc.setFillColor(22, 101, 52)
  doc.rect(margin + 4, 67, endzW, 30, 'F')
  doc.rect(margin + 4 + miniW - endzW, 67, endzW, 30, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(254, 240, 138)
  doc.text('ENDZONE (18m)', margin + 4 + endzW / 2, 83, { align: 'center' })
  doc.text('ENDZONE (18m)', margin + 4 + miniW - endzW / 2, 83, { align: 'center' })

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.text('CAMPO CENTRAL DE JUEGO (64m x 37m)', margin + 4 + miniW / 2, 83, { align: 'center' })

  // Tácticas y Formaciones
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text('5.2 Formaciones Estratégicas y Espíritu de Juego (SOTG)', margin, 110)

  const tactics = [
    {
      title: 'Vertical Stack (V-Stack)',
      desc: '2 o 3 Manejadores en la base con 4 o 5 Cortadores alineados en columna vertical al centro, abriendo carriles abiertos (open side) y de rompimiento (break side).',
    },
    {
      title: 'Horizontal Stack (H-Stack)',
      desc: '3 Manejadores en abanico y 4 Cortadores distribuidos a lo ancho del campo. Genera 2 canales de aislamiento centrales ideales para pases profundos (hucks).',
    },
    {
      title: 'Defensa de Zona 3-3-1 Cup',
      desc: '3 jugadores en la Copa (Cup) asfixiando al lanzador, 3 medios conteniendo pases flotados y 1 jugador en el fondo previniendo pases largos en situaciones de viento.',
    },
    {
      title: 'Rúbrica Oficial de Espíritu de Juego (SOTG)',
      desc: 'Evaluación de 5 criterios al final del partido (0-4 pts por criterio, estándar 10/20): 1. Reglas, 2. Contacto/Faltas, 3. Imparcialidad, 4. Actitud Positiva, 5. Comunicación.',
    },
  ]

  let tY = 116
  for (const tac of tactics) {
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(margin, tY, contentWidth, 23, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(30, 58, 138)
    doc.text(tac.title, margin + 4, tY + 5.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.8)
    doc.setTextColor(51, 65, 85)
    doc.text(tac.desc, margin + 4, tY + 11.5, { maxWidth: contentWidth - 8 })

    tY += 26
  }

  // ==========================================
  // PÁGINA 6: METODOLOGÍA DE TESTING, CALIDAD Y ARQUITECTURA
  // ==========================================
  newPage('Testing y Calidad de Software')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(30, 58, 138)
  doc.text('6. METODOLOGÍA DE TESTING, CONTROL DE CALIDAD Y DESPLIEGUE', margin, 22)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(51, 65, 85)
  doc.text(
    'SIGEDIVO incorpora una estrategia de pruebas y calidad continua diseñada para garantizar cero fallos en partidos en vivo, aislamiento estricto de datos y compilación predictiva.',
    margin,
    27,
    { maxWidth: contentWidth }
  )

  const testingPillars = [
    {
      title: '1. Análisis Estático & Tipado Estricto (TypeScript + ESLint)',
      desc: 'El 100% de la base de código frontend y backend está tipada con TypeScript en modo estricto. Se ejecutan reglas de linting y formateo con Prettier para prevenir inconsistencias de tipos o errores en tiempo de ejecución.',
      badge: 'npm run lint',
    },
    {
      title: '2. Pruebas Unitarias y de Integración API (Vitest)',
      desc: 'Verificación de endpoints críticos: autenticación JWT, flujo de aprobación de roles, aislamiento por teamId, creación de eventos, anotaciones en vivo y cálculo contable.',
      badge: 'npm run test',
    },
    {
      title: '3. Pruebas End-to-End y Accesibilidad (Playwright + Axe WCAG)',
      desc: 'Automatización de flujos de usuario completos: login, gestión de roster, creación de eventos con viento, registro de goles en la mesa técnica, auditoría de permisos RBAC y contraste accesible.',
      badge: 'npm run test:e2e',
    },
    {
      title: '4. Verificación de Compilación y Bundle de Producción (Vite + Esbuild)',
      desc: 'Comprobación de resolución de dependencias, empaquetado minificado de componentes, generación de chunks optimizados y servidor Node.js autocontenido en dist/server.cjs.',
      badge: 'npm run build',
    },
  ]

  let testY = 36
  for (const pillar of testingPillars) {
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(203, 213, 225)
    doc.roundedRect(margin, testY, contentWidth, 27, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(30, 58, 138)
    doc.text(pillar.title, margin + 4, testY + 5.5)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(16, 185, 129)
    doc.text(`[ ${pillar.badge} ]`, margin + contentWidth - 4, testY + 5.5, { align: 'right' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.8)
    doc.setTextColor(51, 65, 85)
    doc.text(pillar.desc, margin + 4, testY + 11.5, { maxWidth: contentWidth - 8 })

    testY += 30
  }

  // Cuadro de comandos de terminal
  doc.setFillColor(15, 23, 42) // Dark Slate
  doc.roundedRect(margin, testY + 2, contentWidth, 54, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(254, 240, 138)
  doc.text('COMANDOS OFICIALES DE VERIFICACIÓN Y TESTING:', margin + 6, testY + 9)

  doc.setFont('courier', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(224, 231, 255)
  const cmds = [
    '# 1. Ejecutar análisis estático y reglas de linter',
    'npm run lint',
    '',
    '# 2. Compilar frontend (Vite) y empaquetar backend (esbuild)',
    'npm run build',
    '',
    '# 3. Ejecutar pruebas End-to-End con Playwright (Headless & Mobile Viewports)',
    'npm run test:e2e',
    '',
    '# 4. Iniciar servidor de producción local o en contenedor Docker',
    'npm start   # o: docker compose -f docker-compose.prod.yml up -d',
  ]
  let cY = testY + 15
  for (const cmd of cmds) {
    doc.text(cmd, margin + 6, cY)
    cY += 3.8
  }

  // ==========================================
  // PÁGINA 7: LICENCIA MIT, FAQS, DEDICATORIA Y SOPORTE
  // ==========================================
  newPage('Licencia, FAQs y Soporte Oficial')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(30, 58, 138)
  doc.text('7. LICENCIA MIT, PREGUNTAS FRECUENTES Y SOPORTE OFICIAL', margin, 22)

  // FAQs
  const faqs = [
    {
      q: '¿Por qué no puedo iniciar sesión inmediatamente después de registrarme?',
      a: 'Por seguridad e integridad de los datos deportivos del club, todos los registros entran en estado PENDIENTE. Un Administrador debe verificar la identidad del atleta y asignarle su rol, equipo y dorsal correspondiente.',
    },
    {
      q: '¿Cómo funciona la convivencia de múltiples equipos en la plataforma?',
      a: 'Cada equipo (Open, Femenino, Mixto) tiene su propio Roster, Finanzas, Eventos y Tácticas totalmente aislados. Los administradores globales pueden supervisar todos los equipos desde el módulo de administración.',
    },
    {
      q: '¿Cómo evalúa el sistema el Espíritu de Juego (SOTG)?',
      a: 'Al culminar cada encuentro oficial, el capitán o anotador califica de 0 a 4 puntos en cinco criterios WFDF: Reglas, Contacto, Imparcialidad, Actitud y Comunicación. La puntuación total estándar esperada es 10/20.',
    },
    {
      q: '¿Cuáles son los términos de uso y licencia del software?',
      a: 'SIGEDIVO se distribuye libre y gratuitamente bajo la Licencia MIT. Puedes utilizarlo, desplegarlo o adaptarlo citando la autoría y el repositorio oficial: https://github.com/frankSousa23/San-Juan-Ultimate-Crew.',
    },
  ]

  let fY = 28
  for (const faq of faqs) {
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(margin, fY, contentWidth, 23, 2, 2, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.rect(margin, fY, contentWidth, 23)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(30, 58, 138)
    doc.text(`P: ${faq.q}`, margin + 4, fY + 5.5, { maxWidth: contentWidth - 8 })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.8)
    doc.setTextColor(51, 65, 85)
    doc.text(`R: ${faq.a}`, margin + 4, fY + 11.5, { maxWidth: contentWidth - 8 })

    fY += 26
  }

  // Cuadro final de dedicatoria, donaciones y contacto institucional
  doc.setFillColor(30, 58, 138)
  doc.roundedRect(margin, fY + 4, contentWidth, 68, 3, 3, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text('SIGEDIVO • DEDICATORIA, CONTACTO Y APOYO AL PROYECTO', margin + 6, fY + 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.8)
  doc.setTextColor(224, 231, 255)
  const dedicationLines = [
    '• Dedicatoria: Este proyecto es un aporte de corazón a la comunidad venezolana y mundial del Ultimate Frisbee.',
    '  Dedicado a la Federación del Disco Volador de Venezuela (FDVV), Asociación Aragüeña del Disco Volador (AADV)',
    '  y para la consolidación de la Asociación Guariqueña del Disco Volador (AGDV).',
    '• Autor & Desarrollador Principal: Frank Sousa (frankalfonso1988@gmail.com) • San Juan de los Morros, Guárico.',
    '• Repositorio Oficial: https://github.com/frankSousa23/San-Juan-Ultimate-Crew',
    '• Apoyo y Donaciones para Hosting/Dominio: Binance: franksousa4@hotmail.com | PayPal: frankalfonso1988@gmail.com',
    '• Cumplimiento Normativo: World Flying Disc Federation (WFDF) Rules 2025-2028.',
  ]
  let dY = fY + 19
  for (const dLine of dedicationLines) {
    doc.text(dLine, margin + 6, dY)
    dY += 5.2
  }

  addFooter()

  return doc
}

export function downloadSystemManualPdf() {
  const doc = generateSystemManualPdf()
  doc.save('Manual_Completo_SIGEDIVO_2026.pdf')
}
