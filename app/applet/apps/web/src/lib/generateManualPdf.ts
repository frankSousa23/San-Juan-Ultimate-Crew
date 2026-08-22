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
    // Fondo superior azul marino
    doc.setFillColor(30, 58, 138) // #1e3a8a
    doc.rect(0, 0, pageWidth, 12, 'F')
    
    // Acento dorado inferior
    doc.setFillColor(217, 119, 6) // #d97706
    doc.rect(0, 11.5, pageWidth, 0.5, 'F')

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
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.text('SIGEDIVO 2026 • Plataforma de Gestión Deportiva, Táctica y Administrativa', margin, pageHeight - 7)
    doc.text(`Página ${pageNumber}`, pageWidth - margin, pageHeight - 7, { align: 'right' })
    pageNumber++
  }

  function newPage(headerTitle: string) {
    addFooter()
    doc.addPage()
    addHeader(headerTitle)
  }

  // ==========================================
  // PÁGINA 1: PORTADA EJECUTIVA Y PRESENTACIÓN
  // ==========================================
  // Fondo de portada
  doc.setFillColor(248, 250, 252)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  // Banner superior
  doc.setFillColor(30, 58, 138)
  doc.rect(0, 0, pageWidth, 75, 'F')

  // Franja dorada
  doc.setFillColor(217, 119, 6)
  doc.rect(0, 72, pageWidth, 3, 'F')

  // Título e Identidad
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(255, 255, 255)
  doc.text('SIGEDIVO', margin, 32)

  doc.setFontSize(13)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(224, 231, 255)
  doc.text('Sistema de Gestión para el Disco Volador', margin, 43)

  doc.setFontSize(9.5)
  doc.setTextColor(254, 243, 199)
  doc.text('Plataforma Integral de Gestión Deportiva, Táctica, Administrativa y Multi-Equipo', margin, 53)
  doc.text('Edición Oficial 2026 • Manual Maestro de Operaciones y Referencia Técnica', margin, 61)

  // Tarjeta central de presentación
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.4)
  doc.roundedRect(margin, 84, contentWidth, 128, 3, 3, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  doc.text('GUÍA COMPLETA DEL SISTEMA Y MANUAL DE USUARIO', margin + 7, 94)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(51, 65, 85)

  const summaryParagraphs = [
    'SIGEDIVO es una plataforma integral diseñada específicamente para clubes, ligas, selecciones y atletas de Ultimate Frisbee (Disco Volador). Centraliza la administración deportiva, control de asistencias, pizarrón táctico interactivo, estadísticas en tiempo real y tesorería en un entorno multi-equipo.',
    '• Aislamiento y Soporte Multi-Equipo: Permite que múltiples divisiones y planteles (Open, Femenino, Mixto, Junior, Master) convivan de forma segura en la plataforma, garantizando que cada integrante opere dentro del contexto y permisos de su equipo.',
    '• Filosofía de Datos Reales y Alta Concurrencia: Sistema libre de datos simulados, diseñado para operar tanto en entrenamientos locales como en torneos nacionales e internacionales de alta exigencia.',
    '• Modelo de Seguridad RBAC: Matriz de 7 roles jerárquicos que protegen la información sensible y facilitan las tareas de cada integrante de la organización deportiva.',
  ]

  let curY = 101
  summaryParagraphs.forEach(p => {
    const lines = doc.splitTextToSize(p, contentWidth - 14)
    doc.text(lines, margin + 7, curY)
    curY += lines.length * 4.2 + 2.5
  })

  // Cuadro de Seguridad y Políticas de Acceso
  doc.setFillColor(241, 245, 249)
  doc.roundedRect(margin + 7, curY + 2, contentWidth - 14, 40, 2, 2, 'F')
  doc.setDrawColor(199, 210, 254)
  doc.setLineWidth(0.3)
  doc.rect(margin + 7, curY + 2, contentWidth - 14, 40, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(30, 58, 138)
  doc.text('POLÍTICAS DE SEGURIDAD Y ACCESO INICIAL:', margin + 11, curY + 9)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(51, 65, 85)
  doc.text('• Super Administrador Inicial: Cuenta de control maestro para administración y configuración.', margin + 11, curY + 16)
  doc.text('• Flujo de Registro PENDIENTE: Nuevas cuentas inician bloqueadas hasta ser validadas por la directiva.', margin + 11, curY + 23)
  doc.text('• Modo Invitado (Guest): Acceso público de demostración con permisos seguros de solo lectura.', margin + 11, curY + 30)
  doc.text('• Conexión Cifrada y Auditoría: Registro inmutable de actividad y transacciones del sistema.', margin + 11, curY + 37)

  // Metadatos inferiores
  const metaY = 222
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(margin, metaY, contentWidth, 38, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139)

  doc.text('ESTADO DEL DOCUMENTO:', margin + 6, metaY + 8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(15, 23, 42)
  doc.text('Aprobado y Vigente', margin + 50, metaY + 8)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 116, 139)
  doc.text('VERSIÓN DE LA PLATAFORMA:', margin + 6, metaY + 16)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(15, 23, 42)
  doc.text('v2.5 (Producción Multi-Equipo 2026)', margin + 50, metaY + 16)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 116, 139)
  doc.text('NORMATIVA DEPORTIVA:', margin + 6, metaY + 24)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(15, 23, 42)
  doc.text('World Flying Disc Federation (WFDF) 2025 - 2028', margin + 50, metaY + 24)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 116, 139)
  doc.text('AUTORÍA Y DIRECCIÓN:', margin + 6, metaY + 32)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(15, 23, 42)
  doc.text('Frank Sousa • San Juan de los Morros, Estado Guárico, Venezuela', margin + 50, metaY + 32)

  addFooter()

  // ==========================================
  // PÁGINA 2: MATRIZ DE ROLES Y CONTROL DE ACCESO (RBAC)
  // ==========================================
  doc.addPage()
  addHeader('Matriz de Roles y Permisos (RBAC)')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(30, 58, 138)
  doc.text('1. CONTROL DE ACCESO BASADO EN ROLES (RBAC)', margin, 22)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(51, 65, 85)
  const rbacIntro = 'SIGEDIVO implementa un modelo de seguridad granular que asigna capacidades específicas a cada integrante del club, asegurando la integridad de los datos deportivos y financieros.'
  doc.text(doc.splitTextToSize(rbacIntro, contentWidth), margin, 28)

  const roles = [
    {
      name: 'Super Administrador (admin)',
      badge: 'Control Total',
      desc: 'Máxima autoridad del sistema. Aprueba y activa nuevos usuarios, gestiona asignación de roles, supervisa logs inmutables de auditoría, configura equipos y categorías, y administra finanzas globales.',
      perms: 'users:manage, audit:view, roster:manage, events:manage, finance:manage, annotations:manage, plays:manage, injuries:manage, rivals:manage, resources:manage, teams:manage',
    },
    {
      name: 'Capitán de Equipo (captain)',
      badge: 'Liderazgo Deportivo',
      desc: 'Liderazgo táctico en campo. Gestiona convocatorias de eventos, asigna alineaciones (Línea O y Línea D), registra estadísticas en vivo y lidera la evaluación oficial de Espíritu de Juego (SOTG).',
      perms: 'roster:manage, events:manage, attendance:manage, annotations:manage, plays:manage, rivals:manage, injuries:manage, communications:manage',
    },
    {
      name: 'Entrenador / Coach (coach)',
      badge: 'Técnico y Táctico',
      desc: 'Planificación de sesiones de entrenamiento, diseño y publicación de jugadas en el pizarrón táctico, control de asistencia, seguimiento médico de lesiones y biblioteca de recursos.',
      perms: 'events:manage, attendance:manage, plays:manage, resources:manage, injuries:manage, annotations:manage, communications:manage',
    },
    {
      name: 'Tesorero / Administrador Financiero (treasurer)',
      badge: 'Finanzas y Caja Chica',
      desc: 'Administración de cuentas (Caja Chica, Bancarias, Pago Móvil), registro de ingresos por cuotas e inscripciones de torneos, control de egresos (canchas, hidratación) y balances contables.',
      perms: 'finance:manage, finance:view, roster:view, events:view, statistics:view',
    },
    {
      name: 'Anotador / Mesa Técnica (annotator)',
      badge: 'Estadísticas Oficiales',
      desc: 'Operación en tiempo real durante partidos oficiales: registro de goles, asistencias, defensas (D\'s), pérdidas de posesión (Turnovers), tiempos fuera y rúbrica WFDF de SOTG.',
      perms: 'annotations:manage, annotations:view, statistics:view, events:view, roster:view, rivals:view',
    },
    {
      name: 'Jugador del Roster (player)',
      badge: 'Atleta Activo',
      desc: 'Consulta del calendario de eventos, confirmación de asistencia, visualización de estadísticas individuales y colectivas, consulta del pizarrón de jugadas y participación en canales de chat.',
      perms: 'roster:view, events:view, attendance:view, statistics:view, plays:view, resources:view, annotations:view, communications:manage',
    },
    {
      name: 'Invitado / Visitante (guest)',
      badge: 'Demostración (Solo Lectura)',
      desc: 'Acceso público para explorar las funciones de la plataforma sin alterar datos. Permite revisar el roster de ejemplo, calendario, estadísticas, pizarrón táctico y descargar documentación oficial.',
      perms: 'roster:view, events:view, statistics:view, plays:view, resources:view, annotations:view, rivals:view',
    },
  ]

  let roleY = 35
  for (const role of roles) {
    // Calculamos el espacio necesario
    const descLines = doc.splitTextToSize(role.desc, contentWidth - 8)
    const permsLines = doc.splitTextToSize(role.perms, contentWidth - 26)
    const boxHeight = 11 + descLines.length * 3.5 + 4 + permsLines.length * 3.2 + 2

    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.roundedRect(margin, roleY, contentWidth, boxHeight, 1.5, 1.5, 'FD')

    // Título y badge
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(15, 23, 42)
    doc.text(role.name, margin + 4, roleY + 5.5)

    doc.setFontSize(7.5)
    doc.setTextColor(30, 58, 138)
    doc.text(`[ ${role.badge} ]`, margin + contentWidth - 4, roleY + 5.5, { align: 'right' })

    // Descripción
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(51, 65, 85)
    let textY = roleY + 10
    doc.text(descLines, margin + 4, textY)
    textY += descLines.length * 3.5 + 2

    // Permisos
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(100, 116, 139)
    doc.text('Permisos:', margin + 4, textY)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)
    doc.text(permsLines, margin + 20, textY)

    roleY += boxHeight + 2.5
  }

  addFooter()

  // ==========================================
  // PÁGINA 3: FLUJO DE APROBACIÓN Y MÓDULOS OPERATIVOS (PARTE 1)
  // ==========================================
  newPage('Flujo de Registro y Módulos Operativos')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(30, 58, 138)
  doc.text('2. PROTOCOLO DE REGISTRO, APROBACIÓN Y ACCESO', margin, 22)

  // Diagrama de Registro
  doc.setFillColor(238, 242, 255)
  doc.setDrawColor(199, 210, 254)
  doc.setLineWidth(0.3)
  doc.roundedRect(margin, 27, contentWidth, 38, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(30, 58, 138)
  doc.text('CICLO DE VIDA DE CUENTAS DE USUARIO:', margin + 5, 33)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(30, 41, 59)
  doc.text('1. El usuario completa el formulario en /register indicando correo, contraseña, nombre y dorsal.', margin + 5, 40)
  doc.text('2. La cuenta se crea automáticamente en estado PENDING (Acceso bloqueado preventivo).', margin + 5, 46)
  doc.text('3. El Super Admin ingresa a /admin/usuarios, verifica la identidad y asigna el rol deportivo.', margin + 5, 52)
  doc.text('4. Al hacer clic en "Aprobar", el estado cambia a APPROVED y el usuario puede iniciar sesión.', margin + 5, 58)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(15, 23, 42)
  doc.text('3. GUÍA EXHAUSTIVA DE MÓDULOS Y VISTAS (PARTE 1)', margin, 73)

  const modulesP1 = [
    {
      title: '3.1 Panel de Control Principal / Dashboard ( / )',
      desc: 'Centro de mando operativo. Muestra métricas clave en tiempo real: cantidad de atletas activos en el roster, próximos eventos programados, balance financiero neto, estado de salud del plantel y accesos directos al manual interactivo y descarga de documentación.',
      detail: 'Métricas instantáneas • Convocatorias urgentes • Avisos directivos • Accesos rápidos',
    },
    {
      title: '3.2 Roster del Equipo & Fichas de Atletas ( /roster )',
      desc: 'Catálogo de jugadores del club. Permite gestionar dorsales (números de camiseta), posiciones oficiales (Manejador/Handler, Cortador/Cutter, Híbrido), datos antropométricos (estatura en cm), trayectoria, división deportiva y estado (Activo, Lesionado, Suspendido).',
      detail: 'Fichas técnicas individuales • Filtrado por posición y división • Control de estados',
    },
    {
      title: '3.3 Calendario, Convocatorias y Condiciones de Viento ( /eventos )',
      desc: 'Gestión de la agenda competitiva: entrenamientos semanales, partidos amistosos y torneos nacionales. Soporta jerarquía de sub-eventos (fase de grupos, cuartos, semifinales, finales) y registro de condiciones climáticas y viento (fuerza y dirección en ráfagas).',
      detail: 'Jerarquía de llaves de torneo • Confirmación de asistencia • Registro meteorológico y viento',
    },
    {
      title: '3.4 Control de Asistencias & Disciplina ( /asistencias )',
      desc: 'Módulo para registrar la presencia de los atletas en cada sesión. Permite marcar estados: Presente, Ausente, Tarde o Justificado, calculando automáticamente porcentajes de asistencia requeridos para convocatorias oficiales de torneo.',
      detail: 'Check-in rápido en 1 clic • Métricas de asistencia por jugador • Justificación de ausencias',
    },
    {
      title: '3.5 Finanzas, Cuentas & Libro Mayor ( /finanzas )',
      desc: 'Módulo para Administradores y Tesoreros. Permite administrar múltiples cuentas (Caja Chica, Bancos, Pago Móvil), registrar ingresos (cuotas, inscripciones) y egresos (canchas, hidratación, uniformes), con balance neto y exportación a archivo CSV.',
      detail: 'Múltiples cuentas • Categorías de ingresos/egresos • Balance consolidado • Exportación CSV',
    },
  ]

  let mod1Y = 80
  for (const mod of modulesP1) {
    const descLines = doc.splitTextToSize(mod.desc, contentWidth - 8)
    const boxH = 9 + descLines.length * 3.5 + 8

    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(203, 213, 225)
    doc.setLineWidth(0.3)
    doc.roundedRect(margin, mod1Y, contentWidth, boxH, 1.5, 1.5, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(30, 58, 138)
    doc.text(mod.title, margin + 4, mod1Y + 5.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(51, 65, 85)
    doc.text(descLines, margin + 4, mod1Y + 10)

    // Detalle box
    const badgeY = mod1Y + 10 + descLines.length * 3.5 + 1.5
    doc.setFillColor(241, 245, 249)
    doc.roundedRect(margin + 4, badgeY, contentWidth - 8, 5.5, 1, 1, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(71, 85, 105)
    doc.text(`⚡ ${mod.detail}`, margin + 6, badgeY + 3.8)

    mod1Y += boxH + 2.5
  }

  addFooter()

  // ==========================================
  // PÁGINA 4: MÓDULOS TÁCTICOS Y DE GESTIÓN AVANZADA (PARTE 2)
  // ==========================================
  newPage('Playbook Táctico y Gestión Avanzada')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(15, 23, 42)
  doc.text('3. GUÍA EXHAUSTIVA DE MÓDULOS Y VISTAS (PARTE 2)', margin, 22)

  const modulesP2 = [
    {
      title: '3.6 Pizarrón Táctico & Playbook de Estrategias ( /jugadas )',
      desc: 'Biblioteca de jugadas y formaciones tácticas: Vertical Stack (Break Flow), Horizontal Stack (Isolación central) y Defensas de Zona (3-3-1 Cup, Flecha, Clam). Incluye diagramación paso a paso, roles por posición y directrices para juego con viento a favor o en contra.',
      detail: 'Ofensivas (Vert/Hori/Side) • Defensas (Copa/Persona/Zona) • Drills técnicos • Exportación',
    },
    {
      title: '3.7 Mesa Técnica & Anotaciones de Partido en Vivo ( /eventos/:id/anotaciones )',
      desc: 'Módulo en vivo para capitanes y anotadores oficiales. Permite registrar goles, asistencias, bloqueos/defensas (D\'s), pérdidas de disco (Turnovers), caídas (Drops), tiempos fuera y evaluar el Espíritu de Juego (SOTG) del equipo rival según la rúbrica oficial WFDF.',
      detail: 'Marcador en directo • Botones rápidos [+Gol] [+Asist] [+D] [-Drop] • Rúbrica SOTG (0-20)',
    },
    {
      title: '3.8 Estadísticas Avanzadas & Rendimiento del Club ( /estadisticas )',
      desc: 'Panel analítico del rendimiento individual y colectivo. Consolida tablas de máximos anotadores, pasadores clave, líderes defensivos, efectividad de posesión, comparativas por división y ranking histórico de Espíritu de Juego.',
      detail: 'Líderes de goles y asistencias • Eficiencia defensiva • Promedio de SOTG por rival',
    },
    {
      title: '3.9 Scouting de Equipos Rivales ( /rivales )',
      desc: 'Base de conocimiento sobre equipos contrarios: registro de fortalezas tácticas, debilidades defensivas, lanzadores zurdos clave, historial de enfrentamientos previos, tendencias de juego y notas de campo para preparar los planteamientos de torneo.',
      detail: 'Análisis de fortalezas y debilidades • Historial de cruces • Jugadores peligrosos a marcar',
    },
    {
      title: '3.10 Control Médico & Seguimiento de Lesiones ( /lesiones )',
      desc: 'Control clínico de salud del plantel: registro de lesiones (esguinces, contracturas, sobrecargas), grado de severidad (Leve, Moderada, Grave), fecha del incidente y fecha estimada de alta deportiva para habilitación en convocatorias oficiales.',
      detail: 'Historial de lesiones • Severidad y tratamientos • Fechas estimadas de alta competitiva',
    },
    {
      title: '3.11 Canales de Comunicación & Muro de Noticias ( /comunicaciones , /noticias )',
      desc: 'Mensajería interna en tiempo real y cartelera digital. Permite organizar canales temáticos (General, Táctica, Logística) y publicar noticias oficiales del club con comentarios y archivos adjuntos.',
      detail: 'Canales organizados • Muro de noticias con adjuntos • Notificaciones de equipo',
    },
  ]

  let mod2Y = 28
  for (const mod of modulesP2) {
    const descLines = doc.splitTextToSize(mod.desc, contentWidth - 8)
    const boxH = 9 + descLines.length * 3.5 + 8

    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(203, 213, 225)
    doc.setLineWidth(0.3)
    doc.roundedRect(margin, mod2Y, contentWidth, boxH, 1.5, 1.5, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(30, 58, 138)
    doc.text(mod.title, margin + 4, mod2Y + 5.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(51, 65, 85)
    doc.text(descLines, margin + 4, mod2Y + 10)

    // Detalle box
    const badgeY = mod2Y + 10 + descLines.length * 3.5 + 1.5
    doc.setFillColor(241, 245, 249)
    doc.roundedRect(margin + 4, badgeY, contentWidth - 8, 5.5, 1, 1, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(71, 85, 105)
    doc.text(`⚡ ${mod.detail}`, margin + 6, badgeY + 3.8)

    mod2Y += boxH + 2.5
  }

  addFooter()

  // ==========================================
  // PÁGINA 5: MULTI-EQUIPO, MODO INVITADO, FAQ Y SOPORTE
  // ==========================================
  newPage('Multi-Equipo, Modo Invitado y Soporte')

  // Sección Multi-Equipo y Modo Invitado
  doc.setFillColor(240, 253, 244)
  doc.setDrawColor(187, 247, 208)
  doc.setLineWidth(0.3)
  doc.roundedRect(margin, 22, contentWidth, 42, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(22, 101, 52)
  doc.text('4. GESTIÓN MULTI-EQUIPO Y MODO INVITADO (DEMO PÚBLICA)', margin + 5, 28)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(20, 83, 45)

  const guestItems = [
    '• Aislamiento Multi-Equipo (/admin/equipos): Administradores pueden gestionar divisiones (Open, Femenino, Mixto) con bases de datos y permisos independientes.',
    '• Flexibilidad en Caimaneras y Amistosos: Permite convocar jugadores no registrados o invitados para sumar estadísticas, las cuales se fusionarán a su perfil al formalizar su registro.',
    '• Modo Oscuro / Claro Integrado: Conmutador de tema visual accesible desde la cabecera superior para máxima comodidad en exteriores o bajo poca luz.',
    '• Exploración de Solo Lectura: El usuario Invitado (guest@sigedivo.com) permite mostrar la app en reuniones y congresos técnicos con total seguridad de datos.',
  ]

  let gY = 34
  guestItems.forEach(item => {
    doc.text(item, margin + 5, gY)
    gY += 5
  })

  // Sección FAQ
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(30, 58, 138)
  doc.text('5. PREGUNTAS FRECUENTES Y NORMAS OPERATIVAS (FAQ)', margin, 72)

  const faqs = [
    {
      q: '¿Por qué no puedo ingresar de inmediato luego de registrarme?',
      a: 'Por seguridad deportiva y control del club, todos los registros entran en estado PENDIENTE. Un Administrador debe aprobar tu cuenta y asignarte tu rol y división antes de que puedas iniciar sesión.',
    },
    {
      q: '¿Cómo se evalúa el Espíritu de Juego (SOTG) en el sistema?',
      a: 'Al finalizar el partido, la mesa técnica o capitán asigna una puntuación de 0 a 4 puntos en 5 criterios: Conocimiento de reglas, Faltas y contacto corporal, Imparcialidad, Actitud positiva y Comunicación (base estándar: 10/20).',
    },
    {
      q: '¿Se pueden exportar los datos contables y tácticos?',
      a: 'Sí. Los módulos de Finanzas, Pizarrón Táctico, Rivales y Lesiones cuentan con botones directos para exportar reportes en formato CSV compatible con Excel y hojas de cálculo.',
    },
    {
      q: '¿Qué hacer en caso de requerir un cambio de rol o recuperar contraseña?',
      a: 'Puedes usar el enlace "¿Olvidaste tu contraseña?" en la pantalla de inicio de sesión o solicitar asistencia directa al Administrador del club.',
    },
  ]

  let faqY = 78
  for (const f of faqs) {
    const qLines = doc.splitTextToSize(`P: ${f.q}`, contentWidth - 8)
    const aLines = doc.splitTextToSize(`R: ${f.a}`, contentWidth - 8)
    const cardH = 6 + qLines.length * 3.5 + 2 + aLines.length * 3.2 + 2

    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.roundedRect(margin, faqY, contentWidth, cardH, 1.5, 1.5, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(30, 58, 138)
    doc.text(qLines, margin + 4, faqY + 5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(51, 65, 85)
    doc.text(aLines, margin + 4, faqY + 5 + qLines.length * 3.5 + 2)

    faqY += cardH + 2.5
  }

  // Cuadro final de contacto y firma institucional
  doc.setFillColor(30, 58, 138)
  doc.roundedRect(margin, faqY + 3, contentWidth, 42, 2.5, 2.5, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text('SIGEDIVO • CUERPO TÉCNICO Y DIRECTIVA OFICIAL', margin + 6, faqY + 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(224, 231, 255)
  doc.text('• Dirección del Proyecto: Frank Sousa (frankalfonso1988@gmail.com)', margin + 6, faqY + 19)
  doc.text('• Sede: San Juan de los Morros, Estado Guárico, Venezuela', margin + 6, faqY + 25)
  doc.text('• Marco Reglamentario: World Flying Disc Federation (WFDF) 2025-2028', margin + 6, faqY + 31)
  doc.text('• Donaciones y Soporte al Desarrollo: Binance (franksousa4@hotmail.com) | PayPal (frankalfonso1988@gmail.com)', margin + 6, faqY + 37)

  addFooter()

  return doc
}

export function downloadSystemManualPdf() {
  const doc = generateSystemManualPdf()
  doc.save('Manual_Completo_SIGEDIVO_2026.pdf')
}
