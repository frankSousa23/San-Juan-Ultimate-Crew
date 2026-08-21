import { jsPDF } from 'jspdf'

export function generateSystemManualPdf(): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 18
  const contentWidth = pageWidth - margin * 2

  let pageNumber = 1

  function addHeader(title: string) {
    doc.setFillColor(30, 58, 138) // Navy Blue (#1e3a8a)
    doc.rect(0, 0, pageWidth, 12, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text('SIGEDIVO (SISTEMA DE GESTIÓN PARA EL DISCO VOLADOR) • MANUAL OFICIAL', margin, 7.5)
    doc.text(title.toUpperCase(), pageWidth - margin, 7.5, { align: 'right' })
  }

  function addFooter() {
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text('Manual de Operaciones, Roles y Permisos • SIGEDIVO 2026', margin, pageHeight - 7)
    doc.text(`Página ${pageNumber}`, pageWidth - margin, pageHeight - 7, { align: 'right' })
    pageNumber++
  }

  function newPage(headerTitle: string) {
    addFooter()
    doc.addPage()
    addHeader(headerTitle)
  }

  // ==========================================
  // PORTADA (PÁGINA 1)
  // ==========================================
  // Fondo decorativo
  doc.setFillColor(248, 250, 252)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  // Banda superior
  doc.setFillColor(30, 58, 138) // Navy
  doc.rect(0, 0, pageWidth, 75, 'F')

  // Acento dorado
  doc.setFillColor(217, 119, 6) // Amber/Gold
  doc.rect(0, 72, pageWidth, 4, 'F')

  // Logo / Icono
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.setTextColor(255, 255, 255)
  doc.text('SIGEDIVO', margin, 35)

  doc.setFontSize(13)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(224, 231, 255)
  doc.text('Plataforma Integral de Gestión Deportiva, Táctica y Administrativa', margin, 46)

  doc.setFontSize(10)
  doc.setTextColor(254, 243, 199)
  doc.text('Edición Oficial 2026 • Documento Maestro de Operaciones', margin, 58)

  // Tarjeta central de presentación
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(margin, 90, contentWidth, 120, 3, 3, 'FD')
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(15, 23, 42)
  doc.text('MANUAL DEL USUARIO (VERSIÓN BETA MULTI-EQUIPO)', margin + 8, 106)

  doc.setFontSize(11)
  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'normal')
  const summaryText = [
    'Este documento constituye el manual de referencia oficial para todos los miembros, directivos,',
    'capitanes, entrenadores, anotadores e invitados del sistema SIGEDIVO.',
    '',
    '• Múltiples Equipos y Aislamiento de Datos: SIGEDIVO soporta la convivencia de múltiples',
    'equipos en una misma plataforma. Cada usuario opera exclusivamente dentro del contexto',
    'de su equipo (Open, Femenino, Mixto), protegiendo la privacidad de los datos operativos.',
    '',
    'Contiene el desglose exhaustivo de la arquitectura de acceso, la matriz de roles y permisos,',
    'la explicación funcional detallada de cada vista del sistema y el protocolo de aprobación',
    'de nuevos usuarios mediante el rol Super Administrador.',
  ]
  let yPos = 118
  for (const line of summaryText) {
    doc.text(line, margin + 8, yPos)
    yPos += 5.5
  }

  // Cuadro informativo de usuarios iniciales
  doc.setFillColor(241, 245, 249)
  doc.roundedRect(margin + 8, 160, contentWidth - 16, 42, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30, 58, 138)
  doc.text('POLÍTICA DE SEGURIDAD Y ACCESOS INICIALES TRAS RESTAURACIÓN:', margin + 12, 168)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(51, 65, 85)
  doc.text('• Administrador Inicial (frankalfonso1988@gmail.com): Pre-aprobado para gestión, configuración y aprobación.', margin + 12, 175)
  doc.text('', margin + 12, 182)
  doc.text('• Nuevos Registros: Todos los nuevos usuarios inician en estado PENDIENTE hasta ser aprobados.', margin + 12, 189)
  doc.text('• Privacidad del Admin: El acceso administrativo no se expone públicamente en el login.', margin + 12, 196)

  // Metadatos inferiores
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text('ESTADO DEL DOCUMENTO:', margin, 235)
  doc.setFont('helvetica', 'normal')
  doc.text('Aprobado y Vigente', margin + 48, 235)

  doc.setFont('helvetica', 'bold')
  doc.text('VERSIÓN DEL SISTEMA:', margin, 242)
  doc.setFont('helvetica', 'normal')
  doc.text('v2.5 (Producción 2026)', margin + 48, 242)

  doc.setFont('helvetica', 'bold')
  doc.text('ORGANIZACIÓN:', margin, 249)
  doc.setFont('helvetica', 'normal')
  doc.text('SIGEDIVO • Sistema Global de Gestión para el Disco Volador', margin + 48, 249)

  addFooter()

  // ==========================================
  // PÁGINA 2: MATRIZ DE ROLES Y PERMISOS
  // ==========================================
  doc.addPage()
  addHeader('Matriz de Roles y Permisos')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(30, 58, 138)
  doc.text('1. MATRIZ DE ROLES Y CONTROL DE ACCESO (RBAC)', margin, 24)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(51, 65, 85)
  doc.text(
    'El sistema SIGEDIVO implementa un modelo de Control de Acceso Basado en Roles (RBAC) estricto para proteger la información del club y garantizar que cada integrante cuente con las herramientas adecuadas a su función.',
    margin,
    30,
    { maxWidth: contentWidth }
  )

  // Tabla de roles
  const roles = [
    {
      name: 'Super Admin (admin)',
      badge: 'Control Total',
      desc: 'Máxima autoridad del sistema. Aprueba nuevos usuarios, asigna roles, gestiona auditoría, configura parámetros globales y administra finanzas.',
      perms: 'users:manage, audit:view, roster:manage, events:manage, finance:manage, annotations:manage, plays:manage, injuries:manage, rivals:manage, resources:manage',
    },
    {
      name: 'Capitán (captain)',
      badge: 'Liderazgo Deportivo',
      desc: 'Responsable de la convocatoria, alineaciones (Línea O y Línea D), estrategias en juego, toma de estadísticas en vivo y espíritu de juego (SOTG).',
      perms: 'roster:manage, events:manage, attendance:manage, annotations:manage, plays:manage, rivals:manage, injuries:manage, communications:manage',
    },
    {
      name: 'Entrenador / Coach (coach)',
      badge: 'Técnico y Táctico',
      desc: 'Planificación de entrenamientos, diseño y publicación de jugadas en el pizarrón táctico, control de asistencias y seguimiento de recuperación médica.',
      perms: 'events:manage, attendance:manage, plays:manage, resources:manage, injuries:manage, annotations:manage, communications:manage',
    },
    {
      name: 'Tesorero (treasurer)',
      badge: 'Finanzas y Cuotas',
      desc: 'Administración de cuentas bancarias y caja chica, registro de ingresos (cuotas, inscripciones de torneos) y egresos (canchas, hidratación, material).',
      perms: 'finance:manage, finance:view, roster:view, events:view, statistics:view',
    },
    {
      name: 'Anotador / Mesa Técnica (annotator)',
      badge: 'Estadísticas Oficiales',
      desc: 'Registro en tiempo real de eventos de partido: goles, asistencias, defensas, caídas, pérdidas, tiempos fuera y evaluación de Espíritu de Juego.',
      perms: 'annotations:manage, annotations:view, statistics:view, events:view, roster:view, rivals:view',
    },
    {
      name: 'Jugador del Roster (player)',
      badge: 'Miembro Activo',
      desc: 'Consulta de calendario de eventos, confirmación de asistencia, visualización de estadísticas individuales y de equipo, pizarrón táctico y canales.',
      perms: 'roster:view, events:view, attendance:view, statistics:view, plays:view, resources:view, annotations:view, communications:manage',
    },
    {
      name: 'Invitado / Visitante (guest)',
      badge: 'Muestra / Solo Lectura',
      desc: 'Rol de muestra pública pre-aprobado. Permite a visitantes explorar el roster, calendario, estadísticas, jugadas de ejemplo y descargar este manual.',
      perms: 'roster:view, events:view, statistics:view, plays:view, resources:view, annotations:view, rivals:view',
    },
  ]

  let rY = 44
  for (const role of roles) {
    // Caja del rol
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(margin, rY, contentWidth, 29, 2, 2, 'FD')

    // Título y badge
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(15, 23, 42)
    doc.text(role.name, margin + 4, rY + 6)

    doc.setFontSize(8)
    doc.setTextColor(30, 58, 138)
    doc.text(`[ ${role.badge} ]`, margin + contentWidth - 4, rY + 6, { align: 'right' })

    // Descripción
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(51, 65, 85)
    doc.text(role.desc, margin + 4, rY + 13, { maxWidth: contentWidth - 8 })

    // Permisos
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.text('Permisos:', margin + 4, rY + 23)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)
    doc.text(role.perms, margin + 20, rY + 23, { maxWidth: contentWidth - 24 })

    rY += 32
  }

  // ==========================================
  // PÁGINA 3: FLUJO DE APROBACIÓN Y VISTAS (PARTE 1)
  // ==========================================
  newPage('Flujo de Aprobaciones y Vistas')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(30, 58, 138)
  doc.text('2. FLUJO DE REGISTRO, APROBACIÓN Y ACCESO', margin, 24)

  // Diagrama del flujo de aprobación
  doc.setFillColor(238, 242, 255)
  doc.roundedRect(margin, 29, contentWidth, 38, 2, 2, 'F')
  doc.setDrawColor(199, 210, 254)
  doc.rect(margin, 29, contentWidth, 38)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(30, 58, 138)
  doc.text('DIAGRAMA DE REGISTRO Y ACTIVACIÓN DE CUENTAS:', margin + 6, 36)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(30, 41, 59)
  doc.text('[1. Usuario Completa Registro en /register] ──> [2. Estado Inicial: PENDING (Bloqueado)]', margin + 6, 44)
  doc.text('                             │', margin + 6, 49)
  doc.text('                             ▼', margin + 6, 53)
  doc.text('[3. Super Admin Revisa en Panel de Usuarios] ──> [4. Asigna Rol/Jugador y Clic en "Aprobar"]', margin + 6, 57)
  doc.text('                             │', margin + 6, 61)
  doc.text('                             ▼', margin + 6, 64)
  doc.text('[5. Estado: APPROVED ──> Usuario puede Iniciar Sesión con sus Credenciales con éxito]', margin + 6, 65)

  // Módulos funcionales
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(15, 23, 42)
  doc.text('3. GUÍA DETALLADA DE VISTAS Y FUNCIONALIDADES', margin, 76)

  const modulesPart1 = [
    {
      title: '3.1 Roster del Equipo & Jugadores (/roster)',
      desc: 'Catálogo de jugadores del club. Permite gestionar dorsales (números de camiseta), posiciones oficiales (Manejador, Cortador, Híbrido), datos antropométricos (estatura en cm), trayectoria y estado deportivo (Activo, Lesionado, Suspendido).',
      mockup: '[ ROSTER DEL EQUIPO ] | #1 Franco Sousa (Manejador - 182cm) | #2 Carlos Mendoza (Cortador) | #3 Eduardo Silva (Híbrido)',
    },
    {
      title: '3.2 Calendario, Eventos & Viento (/eventos)',
      desc: 'Gestión de la agenda competitiva: entrenamientos semanales, partidos amistosos y torneos nacionales. Incluye jerarquía de sub-eventos (partidos de grupos, cuartos, semifinales) y registro de condiciones climáticas y viento (fuerza y dirección de ráfagas).',
      mockup: '[ EVENTO ] Torneo Nacional 2026 • 24/Ago 09:00 • Cancha 1 | Clima: Soleado • Viento: 18 km/h NE (Fuerte)',
    },
    {
      title: '3.3 Anotaciones en Vivo & Estadísticas de Partido (/eventos/:id/anotaciones)',
      desc: 'Módulo interactivo en tiempo real para capitanes y anotadores. Permite registrar goles, asistencias, bloqueos/defensas, pérdidas, caídas y evaluar el Espíritu de Juego (SOTG) del equipo rival según la rúbrica internacional WFDF.',
      mockup: '[ LIVE SCORE ] Equipo Local 15 - 11 Dragones | Botones de 1 Clic: [+GOL] [+ASIST] [+DEFENSA] [-PÉRDIDA] [SOTG]',
    },
    {
      title: '3.4 Finanzas & Libro Contable (/finanzas)',
      desc: 'Módulo exclusivo para Administradores y Tesoreros. Permite administrar cuentas (Caja Chica, Banco, Pago Móvil), registrar ingresos (cuotas, inscripciones) y egresos (alquiler de canchas, equipamiento, hidratación), con balance neto y exportación CSV.',
      mockup: '[ FINANZAS ] Balance: +$870.00 | Ingresos: $1,300.00 | Egresos: $430.00 | Cuentas: Banco ($650) / Caja ($220)',
    },
  ]

  let mY = 83
  for (const mod of modulesPart1) {
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(203, 213, 225)
    doc.roundedRect(margin, mY, contentWidth, 36, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30, 58, 138)
    doc.text(mod.title, margin + 4, mY + 6)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(51, 65, 85)
    doc.text(mod.desc, margin + 4, mY + 12, { maxWidth: contentWidth - 8 })

    // Mockup visual box
    doc.setFillColor(241, 245, 249)
    doc.roundedRect(margin + 4, mY + 24, contentWidth - 8, 8, 1, 1, 'F')
    doc.setFont('courier', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(30, 41, 59)
    doc.text(mod.mockup, margin + 6, mY + 29.5)

    mY += 40
  }

  // ==========================================
  // PÁGINA 4: VISTAS (PARTE 2) Y MODO INVITADO
  // ==========================================
  newPage('Guía de Módulos y Modo Invitado')

  const modulesPart2 = [
    {
      title: '3.5 Pizarrón Táctico & Playbook (/jugadas)',
      desc: 'Biblioteca de jugadas y formaciones tácticas: Vertical Stack (Break Flow), Horizontal Stack (Isolación central) y Defensas de Zona (3-3-1 Cup). Incluye descripciones paso a paso, roles por posición y directrices para situaciones de viento en contra y a favor.',
      mockup: '[ TÁCTICA ] Vertical Stack - Break Flow | Ofensiva | 1. Manejadores centro -> 2. Corte diagonal -> 3. Pase largo',
    },
    {
      title: '3.6 Scouting de Equipos Rivales (/rivales)',
      desc: 'Base de conocimiento sobre rivales: registro de fortalezas tácticas, debilidades defensivas, lanzadores zurdos clave, historial de enfrentamientos previos y notas de campo para preparar los planteamientos de juego de torneos.',
      mockup: '[ RIVAL ] Caracas Ultimate Club | Fortalezas: Rompimiento horizontal | Debilidades: Zona con viento',
    },
    {
      title: '3.7 Seguimiento Médico & Lesiones (/lesiones)',
      desc: 'Control clínico de salud del plantel: registro de lesiones (esguinces, contracturas, sobrecargas), grado de severidad (Leve, Moderada, Grave), fecha del incidente y fecha estimada de alta deportiva para habilitación en convocatorias.',
      mockup: '[ LESIONES ] Daniel Salazar • Esguince tobillo grado 1 (Leve) • Recuperación estimada: 10 días • Estado: Tratamiento',
    },
    {
      title: '3.8 Panel de Gestión de Usuarios y Auditoría (/admin/usuarios)',
      desc: 'Módulo reservado para el Super Admin. Muestra las solicitudes de registro pendientes de aprobación, lista de usuarios del sistema, asignación dinámica de roles y registro inmutable de auditoría (logs de logins, modificaciones y creación de registros).',
      mockup: '[ ADMIN ] Usuarios Pendientes: 3 | [ Aprobar como Jugador ] [ Asignar Dorsal #9 ] | Logs de Auditoría: 100% OK',
    },
  ]

  let m2Y = 24
  for (const mod of modulesPart2) {
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(203, 213, 225)
    doc.roundedRect(margin, m2Y, contentWidth, 36, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30, 58, 138)
    doc.text(mod.title, margin + 4, m2Y + 6)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(51, 65, 85)
    doc.text(mod.desc, margin + 4, m2Y + 12, { maxWidth: contentWidth - 8 })

    // Mockup visual box
    doc.setFillColor(241, 245, 249)
    doc.roundedRect(margin + 4, m2Y + 24, contentWidth - 8, 8, 1, 1, 'F')
    doc.setFont('courier', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(30, 41, 59)
    doc.text(mod.mockup, margin + 6, m2Y + 29.5)

    m2Y += 40
  }

  // Sección especial del Modo Invitado
  doc.setFillColor(240, 253, 244) // Light green
  doc.roundedRect(margin, m2Y + 4, contentWidth, 54, 2, 2, 'F')
  doc.setDrawColor(187, 247, 208)
  doc.rect(margin, m2Y + 4, contentWidth, 54)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(22, 101, 52)
  doc.text('4. GUÍA DEL MODO INVITADO (ROL GUEST / DEMO PÚBLICA)', margin + 6, m2Y + 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(20, 83, 45)
  const guestLines = [
    '',
    '• Vistas Disponibles en Modo Muestra: Consulta del Roster general, Calendario de eventos públicos,',
    '  Estadísticas de anotaciones, Biblioteca de jugadas tácticas y Descarga del Manual Oficial.',
    '• Permisos Restringidos: El rol Invitado cuenta con permisos de SOLO LECTURA. No puede alterar datos,',
    '  crear transacciones financieras, modificar alineaciones ni acceder a los logs de auditoría.',
    '• Solicitud de Membresía: Los invitados pueden solicitar su incorporación formal al equipo mediante',
    '  el enlace de Registro en el sistema, tras lo cual el Administrador activará su cuenta de Jugador/Capitán.',
  ]
  let gY = m2Y + 18
  for (const line of guestLines) {
    doc.text(line, margin + 6, gY)
    gY += 5.5
  }

  // ==========================================
  // PÁGINA 5: RESUMEN DE SEGURIDAD Y CONTACTO
  // ==========================================
  newPage('Seguridad y Soporte Técnico')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(30, 58, 138)
  doc.text('5. NORMAS DE SEGURIDAD Y PREGUNTAS FRECUENTES', margin, 24)

  const faqs = [
    {
      q: '¿Por qué no puedo iniciar sesión inmediatamente después de registrarme?',
      a: 'Por razones de seguridad e integridad del roster deportivo, todos los registros entran en estado PENDIENTE. Un Administrador del club debe verificar tu identidad y asignarte el rol correspondiente (Jugador, Capitán, Entrenador, Tesorero) antes de activar tu acceso.',
    },
    {
      q: '¿Cómo puedo probar el sistema rápidamente sin crear una cuenta nueva?',
      a: 'En la pantalla de inicio de sesión (/login), utiliza el botón "Entrar en Modo Invitado". Esto te otorgará acceso instantáneo de demostración en modo solo lectura.',
    },
    {
      q: '¿Qué hacer si olvidé mi contraseña?',
      a: 'Puedes acceder a la opción "¿Olvidaste tu contraseña?" en el formulario de login para solicitar un restablecimiento o contactar directamente al Administrador del club (frankalfonso1988@gmail.com).',
    },
    {
      q: '¿Cómo se evalúa el Espíritu de Juego (SOTG)?',
      a: 'Al finalizar cada partido oficial, el capitán o anotador asigna una calificación de 0 a 4 puntos en cinco criterios: Conocimiento de reglas, Faltas y contacto corporal, Imparcialidad, Actitud positiva y Comunicación. El total estándar esperado es 10/20.',
    },
  ]

  let fY = 32
  for (const faq of faqs) {
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(margin, fY, contentWidth, 24, 2, 2, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.rect(margin, fY, contentWidth, 24)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(30, 58, 138)
    doc.text(`P: ${faq.q}`, margin + 4, fY + 6, { maxWidth: contentWidth - 8 })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(51, 65, 85)
    doc.text(`R: ${faq.a}`, margin + 4, fY + 12, { maxWidth: contentWidth - 8 })

    fY += 27
  }

  // Cuadro final de contacto y firma institucional
  doc.setFillColor(30, 58, 138)
  doc.roundedRect(margin, fY + 8, contentWidth, 48, 3, 3, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text('SIGEDIVO • CUERPO TÉCNICO Y DIRECTIVA', margin + 6, fY + 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(224, 231, 255)
  doc.text('Email de Contacto Oficial: contacto@sigedivo.com | administracion@sigedivo.com', margin + 6, fY + 27)
  doc.text('Reglamento Oficial: World Flying Disc Federation (WFDF) 2025-2028', margin + 6, fY + 34)

  addFooter()

  return doc
}

export function downloadSystemManualPdf() {
  const doc = generateSystemManualPdf()
  doc.save('Manual_Completo_SIGEDIVO_2026.pdf')
}
