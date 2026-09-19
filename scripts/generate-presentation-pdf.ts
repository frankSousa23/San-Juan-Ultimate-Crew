import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { jsPDF } = require('../apps/web/node_modules/jspdf/dist/jspdf.node.min.js')

export function generatePresentationPdf(): Buffer {
  // 16:9 Widescreen Landscape: 960pt x 540pt
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [960, 540]
  })

  const width = 960
  const height = 540

  // Helper function to draw subtle grid lines and background
  const drawBackground = () => {
    // Light neutral background #f6f7f9
    doc.setFillColor(246, 247, 249)
    doc.rect(0, 0, width, height, 'F')

    // Subtle technical grid
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.5)
    for (let x = 60; x < width; x += 60) {
      doc.line(x, 0, x, height)
    }
    for (let y = 60; y < height; y += 60) {
      doc.line(0, y, width, y)
    }

    // Outer framing corners
    doc.setDrawColor(203, 213, 225)
    doc.setLineWidth(1)
    doc.rect(30, 30, width - 60, height - 60)

    // Corner tick marks
    const len = 8
    doc.setDrawColor(148, 163, 184)
    doc.line(30, 30, 30 + len, 30 + len)
    doc.line(width - 30, 30, width - 30 - len, 30 + len)
    doc.line(30, height - 30, 30 + len, height - 30 - len)
    doc.line(width - 30, height - 30, width - 30 - len, height - 30 - len)
  }

  // Helper for slide header
  const drawHeader = (title: string, subtitle?: string) => {
    doc.setTextColor(15, 23, 42) // slate-900
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(26)
    doc.text(title, 60, 75)

    if (subtitle) {
      doc.setTextColor(100, 116, 139) // slate-500
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(13)
      doc.text(subtitle, 60, 98)
    }
  }

  // Helper for slide footer
  const drawFooter = (pageNum: number) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(148, 163, 184) // slate-400
    doc.text('SIGEDIVO • Sistema de Gestión para el Disco Volador (Licencia MIT)', 60, height - 42)
    doc.text(`Diapositiva ${pageNum} / 15`, width - 140, height - 42)
  }

  // ==========================================
  // SLIDE 1: PORTADA
  // ==========================================
  drawBackground()

  // Left column: Title and value prop
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(38)
  doc.text('SIGEDIVO: El Motor', 65, 170)
  doc.text('Tecnológico para', 65, 215)
  doc.text('el Disco Volador', 65, 260)

  // Accent bar
  doc.setFillColor(46, 117, 89) // dark emerald green
  doc.rect(65, 280, 80, 5, 'F')

  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(15)
  const descLines = [
    'Plataforma integral, autohospedable',
    'y white-label para la profesionalización',
    'operativa de clubes y asociaciones',
    'de Ultimate Frisbee.'
  ]
  let yDesc = 315
  descLines.forEach(line => {
    doc.text(line, 65, yDesc)
    yDesc += 22
  })

  // Author & GitHub tag
  doc.setFontSize(11)
  doc.setTextColor(100, 116, 139)
  doc.text('Autor: Frank Sousa (@frankSousa23) • San Juan de los Morros, Venezuela', 65, 430)
  doc.text('github.com/frankSousa23/San-Juan-Ultimate-Crew', 65, 448)

  // Right column: Field schematic diagram
  const fX = 510
  const fY = 130
  const fW = 380
  const fH = 260

  // Field grass
  doc.setFillColor(65, 117, 72)
  doc.rect(fX, fY, fW, fH, 'F')

  // Inner field lines
  doc.setDrawColor(240, 253, 244)
  doc.setLineWidth(2)
  doc.rect(fX + 15, fY + 15, fW - 30, fH - 30) // perimeter

  // Endzones
  doc.line(fX + 75, fY + 15, fX + 75, fY + fH - 15) // left endzone
  doc.line(fX + fW - 75, fY + 15, fX + fW - 75, fY + fH - 15) // right endzone

  // Center circle and mid-field line
  const midX = fX + fW / 2
  const midY = fY + fH / 2
  doc.line(midX, fY + 15, midX, fY + fH - 15)
  doc.circle(midX, midY, 35)

  // Brick marks
  doc.circle(fX + 130, midY, 3, 'F')
  doc.circle(fX + fW - 130, midY, 3, 'F')

  // Tactical pull curve flight path
  doc.setDrawColor(234, 88, 12) // orange
  doc.setLineWidth(2)
  // Simulated dashed curve
  const steps = 14
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps
    const t1 = (i + 0.6) / steps
    const p0x = fX + 90 + t0 * 240
    const p0y = midY + 40 - Math.sin(t0 * Math.PI) * 90
    const p1x = fX + 90 + t1 * 240
    const p1y = midY + 40 - Math.sin(t1 * Math.PI) * 90
    doc.line(p0x, p0y, p1x, p1y)
  }
  // Destination marker X
  doc.setTextColor(234, 88, 12)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('X', fX + 335, midY - 60)

  drawFooter(1)

  // ==========================================
  // SLIDE 2: HOMENAJE AL DEPORTE
  // ==========================================
  doc.addPage([960, 540], 'landscape')
  drawBackground()

  // Left card: 15 years in Venezuela
  doc.setFillColor(15, 23, 42) // dark slate
  doc.roundedRect(60, 100, 360, 340, 12, 12, 'F')

  // Layout catch illustration placeholder / graphic
  doc.setFillColor(30, 41, 59)
  doc.roundedRect(80, 120, 320, 180, 8, 8, 'F')
  doc.setTextColor(56, 189, 248)
  doc.setFontSize(38)
  doc.text('🥏', 225, 215, { align: 'center' })
  doc.setFontSize(12)
  doc.setTextColor(226, 232, 240)
  doc.text('Layout Catch • Vuelo Dinámico', 240, 260, { align: 'center' })

  // Text inside left card
  doc.setTextColor(248, 250, 252)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('15 años de pasión en Venezuela', 80, 335)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(13)
  doc.setTextColor(203, 213, 225)
  doc.text('evidenciaron una barrera crítica:', 80, 357)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(251, 146, 60) // orange
  doc.text('la dependencia del papel y lápiz', 80, 380)
  doc.setTextColor(203, 213, 225)
  doc.setFont('helvetica', 'normal')
  doc.text('en la gestión deportiva.', 80, 402)

  // Right column: 3 points
  const points = [
    {
      title: 'Homenaje al Deporte',
      body: 'Construido desde la experiencia en cancha (Guárico, Aragua, Carabobo, Yaracuy) para el mundo.',
      color: [234, 88, 12]
    },
    {
      title: 'Misión Institucional',
      body: 'Respaldar operativamente a federaciones (FDVV) y asociaciones regionales (AADV, AGDV).',
      color: [14, 165, 233]
    },
    {
      title: 'El Salto Digital',
      body: 'Erradicar la gestión manual, centralizar estadísticas y elevar la calidad de los eventos deportivos en toda Latinoamérica.',
      color: [16, 185, 129]
    }
  ]

  let yPt = 110
  points.forEach((pt) => {
    // White card
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(1)
    doc.roundedRect(450, yPt, 450, 95, 10, 10, 'FD')

    // Left bracket accent
    doc.setDrawColor(pt.color[0], pt.color[1], pt.color[2])
    doc.setLineWidth(3)
    doc.line(450, yPt + 15, 450, yPt + 80)

    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(pt.title, 475, yPt + 35)

    doc.setTextColor(71, 85, 105)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    const lines = doc.splitTextToSize(pt.body, 400)
    doc.text(lines, 475, yPt + 58)

    yPt += 115
  })

  drawFooter(2)

  // ==========================================
  // SLIDE 3: TRES PILARES FUNDAMENTALES
  // ==========================================
  doc.addPage([960, 540], 'landscape')
  drawBackground()
  drawHeader('Tres Pilares Fundamentales de Implementación')

  const pillars = [
    {
      icon: '🎨',
      title: 'Identidad White-Label',
      body: 'Tu marca, tus colores, tu escudo. Diseñado para que cada club (ej. El Pueblito Ultimate Club) o asociación lo haga completamente suyo.',
      accent: [234, 88, 12]
    },
    {
      icon: '🖥️',
      title: 'Despliegue Autohospedable',
      body: 'Soberanía total de datos. Sin bloqueos de proveedores. Despliégalo en tu propia infraestructura (Docker/VPS) manteniendo el control absoluto.',
      accent: [14, 165, 233]
    },
    {
      icon: '🚀',
      title: 'Listo para Producción',
      body: 'Despliegue directo y autónomo. Listo desde el día uno para registrar atletas reales, torneos y anotar partidos oficiales.',
      accent: [16, 185, 129]
    }
  ]

  let xPil = 60
  pillars.forEach(pil => {
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(xPil, 140, 260, 290, 12, 12, 'FD')

    // Bottom accent border
    doc.setFillColor(pil.accent[0], pil.accent[1], pil.accent[2])
    doc.rect(xPil + 20, 420, 220, 4, 'F')

    // Icon Circle
    doc.setFillColor(248, 250, 252)
    doc.circle(xPil + 50, 180, 25, 'F')
    doc.setFontSize(24)
    doc.text(pil.icon, xPil + 50, 188, { align: 'center' })

    // Title
    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(pil.title, xPil + 25, 235)

    // Body
    doc.setTextColor(71, 85, 105)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    const lines = doc.splitTextToSize(pil.body, 210)
    doc.text(lines, xPil + 25, 265)

    xPil += 290
  })

  drawFooter(3)

  // ==========================================
  // SLIDE 4: ARQUITECTURA MULTI-EQUIPO Y AISLAMIENTO
  // ==========================================
  doc.addPage([960, 540], 'landscape')
  drawBackground()
  drawHeader('Arquitectura Multi-Equipo y Aislamiento Seguro')

  // Diagram left side: Server Box
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(15, 23, 42)
  doc.setLineWidth(2)
  doc.roundedRect(80, 140, 280, 50, 8, 8, 'FD')
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Servidor SIGEDIVO (Multi-Instancia)', 220, 170, { align: 'center' })

  // Connector lines
  doc.line(220, 190, 220, 220)
  doc.line(120, 220, 320, 220)
  doc.line(120, 220, 120, 250)
  doc.line(220, 220, 220, 250)
  doc.line(320, 220, 320, 250)

  // Three Division boxes
  const divs = [
    { title: 'División Open', x: 70 },
    { title: 'División Femenina', x: 175 },
    { title: 'División Mixta', x: 280 }
  ]
  divs.forEach(d => {
    doc.setFillColor(241, 245, 249)
    doc.setDrawColor(15, 23, 42)
    doc.setLineWidth(1.5)
    doc.roundedRect(d.x, 250, 90, 140, 6, 6, 'FD')

    // Lock icon
    doc.setFontSize(16)
    doc.text('🔒', d.x + 45, 285, { align: 'center' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    const lines = doc.splitTextToSize(d.title, 80)
    doc.text(lines, d.x + 45, 330, { align: 'center' })
  })

  // Right side explanation cards
  const secArch = [
    {
      title: 'Privacidad Absoluta',
      body: 'Jugadores y entrenadores operan con privacidad estricta de roster, jugadas de su playbook y tesorería.'
    },
    {
      title: 'Dorsales Independientes',
      body: 'Eliminación de bloqueos globales. Múltiples divisiones pueden usar el número #23 sin conflictos.'
    },
    {
      title: 'Registro Dinámico',
      body: 'Selector integrado para nuevos atletas (elección de equipo o ingreso como independiente).'
    }
  ]

  let yArch = 140
  secArch.forEach(item => {
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(420, yArch, 480, 85, 8, 8, 'FD')

    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.text(item.title + ':', 445, yArch + 30)

    doc.setTextColor(71, 85, 105)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    const lines = doc.splitTextToSize(item.body, 430)
    doc.text(lines, 445, yArch + 52)

    yArch += 100
  })

  drawFooter(4)

  // ==========================================
  // SLIDE 5: EL ECOSISTEMA OPERATIVO SIGEDIVO
  // ==========================================
  doc.addPage([960, 540], 'landscape')
  drawBackground()
  drawHeader('El Ecosistema Operativo SIGEDIVO')

  const ecoPillars = [
    {
      title: 'Gestión de Eventos',
      items: ['Torneos y Brackets', 'Convocatorias O/D-Line', 'Control de Asistencia'],
      color: [234, 88, 12],
      x: 100, y: 130
    },
    {
      title: 'Operaciones en Campo',
      items: ['Pizarra Táctica', 'Marcador en Vivo Sticky', 'Mesa Técnica 1-Touch'],
      color: [14, 165, 233],
      x: 500, y: 130
    },
    {
      title: 'Desarrollo del Atleta',
      items: ['Roster y Radar Card', 'Perfiles Médicos y Lesiones', 'Scouting de Rivales'],
      color: [16, 185, 129],
      x: 100, y: 280
    },
    {
      title: 'Administración',
      items: ['Tesorería y Caja Chica', 'Finanzas Multi-Cuenta', 'Gobernanza RBAC (9 Roles)'],
      color: [139, 92, 246],
      x: 500, y: 280
    }
  ]

  ecoPillars.forEach(p => {
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(p.x, p.y, 360, 125, 10, 10, 'FD')

    // Top color bar
    doc.setFillColor(p.color[0], p.color[1], p.color[2])
    doc.rect(p.x + 15, p.y, 60, 4, 'F')

    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.text(p.title, p.x + 20, p.y + 30)

    doc.setTextColor(71, 85, 105)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    let yItem = p.y + 55
    p.items.forEach(it => {
      doc.text('• ' + it, p.x + 25, yItem)
      yItem += 20
    })
  })

  // Center connection statement box
  doc.setFillColor(241, 245, 249)
  doc.setDrawColor(148, 163, 184)
  doc.roundedRect(180, 425, 600, 40, 20, 20, 'FD')
  doc.setTextColor(30, 41, 59)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Un flujo de datos continuo: el desempeño en cancha alimenta instantáneamente estadísticas y finanzas.', 480, 450, { align: 'center' })

  drawFooter(5)

  // ==========================================
  // SLIDE 6: MESA TÉCNICA EN TIEMPO REAL
  // ==========================================
  doc.addPage([960, 540], 'landscape')
  drawBackground()
  drawHeader('Operaciones de Mesa Técnica en Tiempo Real')

  // Left side: Phone simulator frame
  doc.setFillColor(15, 23, 42)
  doc.roundedRect(80, 130, 240, 310, 16, 16, 'F')

  // Screen
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(95, 150, 210, 270, 10, 10, 'F')

  // Sticky score header
  doc.setFillColor(241, 245, 249)
  doc.rect(95, 150, 210, 55, 'F')
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.text('12 - 10', 200, 190, { align: 'center' })

  // 1-touch buttons
  doc.setFillColor(234, 88, 12) // orange
  doc.roundedRect(110, 220, 85, 60, 8, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.text('+1 GOL', 152, 255, { align: 'center' })

  doc.setFillColor(14, 165, 233) // cyan
  doc.roundedRect(205, 220, 85, 60, 8, 8, 'F')
  doc.setFontSize(11)
  doc.text('DEFENSA (D)', 247, 255, { align: 'center' })

  doc.setFillColor(239, 68, 68) // red
  doc.roundedRect(110, 295, 180, 50, 8, 8, 'F')
  doc.setFontSize(13)
  doc.text('TURNOVER', 200, 325, { align: 'center' })

  // Right side 4 features
  const mtFeats = [
    {
      title: 'Diseño Ultra-Responsive',
      desc: 'Botones táctiles de gran tamaño optimizados para la presión del campo (touch-manipulation).'
    },
    {
      title: 'Marcador Sticky',
      desc: 'Score siempre visible al hacer scroll durante partidos tensos.'
    },
    {
      title: 'Registro a 1-Toque',
      desc: 'Botones directos para Goles (con asistencia), Callahan y Errores Rivales.'
    },
    {
      title: 'Sincronización SOTG',
      desc: 'Los datos alimentan automáticamente la tabla y la evaluación del Espíritu de Juego (WFDF).'
    }
  ]

  let yMt = 130
  mtFeats.forEach(f => {
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(360, yMt, 540, 68, 8, 8, 'FD')

    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(f.title + ':', 380, yMt + 28)

    doc.setTextColor(71, 85, 105)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11.5)
    const lines = doc.splitTextToSize(f.desc, 490)
    doc.text(lines, 380, yMt + 48)

    yMt += 80
  })

  drawFooter(6)

  // ==========================================
  // SLIDE 7: TORNEOS Y CONVOCATORIAS
  // ==========================================
  doc.addPage([960, 540], 'landscape')
  drawBackground()
  drawHeader('Gestión de Torneos y Convocatorias Inteligentes')

  const stepsFlow = [
    {
      step: '1. Creación Rápida',
      body: 'Uso de plantillas preconfiguradas (Torneo Open, Full Day, Amistoso, Caimanera).',
      icon: '📝'
    },
    {
      step: '2. Jerarquía de Competición',
      body: 'Estructuración automatizada desde Fase de Grupos (Group Stage) hasta Finales.',
      icon: '🏆'
    },
    {
      step: '3. Convocatoria Táctica',
      body: 'Asignación previa de jugadores a líneas específicas: O-Line, D-Line, Flex.',
      icon: '📋'
    },
    {
      step: '4. Control de Asistencia',
      body: 'Registro en vivo en el campo (Presente, Tarde, Ausente) y asignación de anotadores.',
      icon: '⏱️'
    }
  ]

  let xStep = 60
  stepsFlow.forEach(s => {
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(xStep, 150, 195, 260, 10, 10, 'FD')

    // Circle icon
    doc.setFillColor(241, 245, 249)
    doc.circle(xStep + 97, 200, 28, 'F')
    doc.setFontSize(26)
    doc.text(s.icon, xStep + 97, 210, { align: 'center' })

    // Title
    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    const tLines = doc.splitTextToSize(s.step, 170)
    doc.text(tLines, xStep + 97, 255, { align: 'center' })

    // Body
    doc.setTextColor(71, 85, 105)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    const bLines = doc.splitTextToSize(s.body, 165)
    doc.text(bLines, xStep + 15, 305)

    xStep += 215
  })

  drawFooter(7)

  // ==========================================
  // SLIDE 8: SEGUIMIENTO HOLÍSTICO Y SALUD
  // ==========================================
  doc.addPage([960, 540], 'landscape')
  drawBackground()
  drawHeader('Seguimiento Holístico y Salud del Atleta')

  // Center Player Card
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(360, 130, 240, 240, 12, 12, 'FD')

  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.text('Player Card', 385, 160)

  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(32)
  doc.text('#23', 385, 200)

  doc.setFontSize(28)
  doc.text('🏃', 540, 195)

  // Mini radar visual in card
  doc.setDrawColor(14, 165, 233)
  doc.setFillColor(224, 242, 254)
  doc.setLineWidth(1.5)
  // Radar visual in card
  const cx = 480, cy = 275, r = 40
  doc.circle(cx, cy, r, 'S')
  doc.circle(cx, cy, r * 0.6, 'S')
  doc.line(cx, cy - r, cx, cy + r)
  doc.line(cx - r, cy, cx + r, cy)
  doc.setFillColor(186, 230, 253)
  doc.circle(cx, cy, r * 0.75, 'F')

  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('Velocidad', cx, cy - r - 4, { align: 'center' })
  doc.text('Manejo', cx - r - 15, cy)
  doc.text('Resistencia', cx + r + 15, cy)

  // Left card: Perfil Táctico
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(60, 150, 270, 190, 10, 10, 'FD')
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('Perfil Táctico', 85, 185)
  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  const l1 = doc.splitTextToSize('Clasificación clara de posiciones (Manejador/Handler, Cortador/Cutter, Híbrido) y experiencia acumulada.', 220)
  doc.text(l1, 85, 215)

  // Right card: Historial de Lesiones
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(630, 150, 270, 190, 10, 10, 'FD')
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('Historial Evolutivo de Lesiones', 655, 185)
  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  const l2 = doc.splitTextToSize('Sistema transicional de estado físico:\nActivo -> Lesión Moderada -> En Recuperación -> Resuelto.', 220)
  doc.text(l2, 655, 215)

  // Bottom card: Fusión de Datos (Modo Caimanera)
  doc.setFillColor(241, 245, 249)
  doc.roundedRect(120, 395, 720, 60, 10, 10, 'FD')
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Fusión de Datos (Modo Caimanera):', 140, 420)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(71, 85, 105)
  doc.text('Capacidad única de registrar invitados en prácticas y migrar atómicamente todo su historial estadístico al aprobar su cuenta oficial.', 140, 440)

  drawFooter(8)

  // ==========================================
  // SLIDE 9: INTELIGENCIA DEPORTIVA: PLAYBOOK Y SCOUTING
  // ==========================================
  doc.addPage([960, 540], 'landscape')
  drawBackground()
  drawHeader('Inteligencia Deportiva: Playbook y Scouting')

  // Left Column: Playbook Field
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(60, 130, 400, 290, 12, 12, 'FD')

  // Green field inside
  doc.setFillColor(52, 116, 68)
  doc.roundedRect(80, 150, 360, 180, 8, 8, 'F')
  // Tactical Xs and Os
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.text('O', 140, 200)
  doc.text('O', 200, 200)
  doc.text('O', 260, 200)
  doc.text('O', 320, 200)
  doc.setTextColor(234, 88, 12)
  doc.text('X', 170, 250)
  doc.text('X', 230, 250)
  doc.text('X', 290, 250)

  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Diseño de jugadas estructurales:', 80, 355)
  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11.5)
  const pbText = doc.splitTextToSize('Soporte nativo para formaciones ofensivas (Vertical/Horizontal Stack) y defensivas (Zona 3-3-1 Cup, Dome/Clam).', 360)
  doc.text(pbText, 80, 375)

  // Right Column: Scouting Report
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(500, 130, 400, 290, 12, 12, 'FD')

  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Scouting Report — Ficha Técnica Rival', 525, 160)

  // Table header
  doc.setFillColor(241, 245, 249)
  doc.rect(525, 180, 350, 24, 'F')
  doc.setFontSize(10.5)
  doc.setTextColor(100, 116, 139)
  doc.text('Jugador #', 535, 196)
  doc.text('Fortaleza', 620, 196)
  doc.text('Debilidad', 730, 196)

  // Rows
  const scoutRows = [
    ['23', 'Manejo Largo', 'Baja Experiencia'],
    ['7', 'Velocidad', 'Técnica de Corte'],
    ['14', 'Resistencia', 'Juego Aéreo'],
    ['4', 'Defensa Férrea', 'Recuperación Lenta']
  ]
  let ySc = 220
  scoutRows.forEach(r => {
    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'normal')
    doc.text(r[0], 545, ySc)
    doc.text(r[1], 620, ySc)
    doc.text(r[2], 730, ySc)
    ySc += 22
  })

  doc.setTextColor(71, 85, 105)
  doc.setFontSize(11)
  const scNotes = doc.splitTextToSize('Módulo de fichas técnicas dedicado al análisis de equipos contrarios. Seguimiento individual de jugadores clave rivales y vulnerabilidades.', 350)
  doc.text(scNotes, 525, 335)

  drawFooter(9)

  // ==========================================
  // SLIDE 10: TESORERÍA Y SALUD FINANCIERA
  // ==========================================
  doc.addPage([960, 540], 'landscape')
  drawBackground()
  drawHeader('Tesorería y Salud Financiera del Club')

  // Top metric card: Net Balance
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(600, 130, 300, 110, 12, 12, 'FD')

  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(36)
  doc.text('+$23,500', 750, 185, { align: 'center' })
  doc.setTextColor(100, 116, 139)
  doc.setFontSize(13)
  doc.text('Balance Neto Auditado', 750, 215, { align: 'center' })

  // Left chart simulator
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(60, 130, 500, 140, 12, 12, 'FD')
  // Bar columns
  const bars = [
    { m: 'Ene', inc: 45, exp: 20 },
    { m: 'Feb', inc: 35, exp: 25 },
    { m: 'Mar', inc: 55, exp: 30 },
    { m: 'Abr', inc: 70, exp: 35 },
    { m: 'May', inc: 85, exp: 40 },
    { m: 'Jun', inc: 80, exp: 35 }
  ]
  let xBar = 100
  bars.forEach(b => {
    // Green income bar
    doc.setFillColor(46, 117, 89)
    doc.rect(xBar, 210 - b.inc, 22, b.inc, 'F')
    // Orange expense bar
    doc.setFillColor(234, 88, 12)
    doc.rect(xBar, 215, 22, b.exp, 'F')

    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(b.m, xBar + 11, 260, { align: 'center' })

    xBar += 68
  })

  // Three lower cards
  const finPillars = [
    {
      title: 'Gestión Multi-Cuenta',
      desc: 'Separación clara entre Cuentas Bancarias y Caja Chica (Cash).'
    },
    {
      title: 'Flujo de Caja',
      desc: 'Categorización detallada de ingresos (mensualidades) y egresos (cancha, hidratación).'
    },
    {
      title: 'Guardias RBAC',
      desc: 'Acceso financiero estrictamente limitado, garantizando que solo el Tesorero audite fondos.'
    }
  ]

  let xFin = 60
  finPillars.forEach(f => {
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(xFin, 290, 260, 120, 10, 10, 'FD')

    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(f.title, xFin + 20, 325)

    doc.setTextColor(71, 85, 105)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    const lines = doc.splitTextToSize(f.desc, 220)
    doc.text(lines, xFin + 20, 350)

    xFin += 300
  })

  drawFooter(10)

  // ==========================================
  // SLIDE 11: MATRIZ DE GOBERNANZA RBAC
  // ==========================================
  doc.addPage([960, 540], 'landscape')
  drawBackground()
  drawHeader('Matriz de Gobernanza: Control de Acceso Basado en Roles (RBAC)')

  // Table container
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(60, 120, 840, 240, 12, 12, 'FD')

  // Header row
  doc.setFillColor(241, 245, 249)
  doc.rect(60, 120, 840, 35, 'F')
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('ROL', 100, 142)
  doc.text('ROSTER', 260, 142)
  doc.text('TORNEOS', 400, 142)
  doc.text('MESA TÉCNICA', 540, 142)
  doc.text('FINANZAS', 690, 142)
  doc.text('PLAYBOOK', 810, 142)

  // Roles rows
  const rbacRows = [
    { rol: 'Admin', r: '🟢 Total', t: '🟢 Total', m: '🟢 Total', f: '🟢 Total', p: '🟢 Total' },
    { rol: 'Capitán', r: '🟡 Gestión', t: '🟡 Gestión', m: '—', f: '—', p: '🟡 Diseño' },
    { rol: 'Coach', r: '🟡 Gestión', t: '🟡 Gestión', m: '—', f: '—', p: '🟡 Diseño' },
    { rol: 'Anotador', r: '—', t: '—', m: '🟢 Control Total', f: '—', p: '—' },
    { rol: 'Tesorero', r: '—', t: '—', m: '—', f: '🟢 Control Total', p: '—' },
    { rol: 'Jugador', r: '🔵 Ver/Propio', t: '🔵 Convocatoria', m: '—', f: '—', p: '🔵 Consulta' }
  ]

  let yRow = 180
  rbacRows.forEach(rw => {
    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(rw.rol, 100, yRow)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(rw.r, 260, yRow)
    doc.text(rw.t, 400, yRow)
    doc.text(rw.m, 540, yRow)
    doc.text(rw.f, 690, yRow)
    doc.text(rw.p, 810, yRow)

    yRow += 30
  })

  // Bottom explanation banner
  doc.setFillColor(241, 245, 249)
  doc.roundedRect(60, 385, 840, 50, 8, 8, 'FD')
  doc.setTextColor(30, 41, 59)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11.5)
  doc.text('Capitanes y Coaches diseñan el juego. Anotadores controlan el partido. Tesoreros aseguran los fondos.', 480, 407, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.text('Admins supervisan todo. Nuevos registros ingresan en estado PENDING para validación estricta.', 480, 424, { align: 'center' })

  drawFooter(11)

  // ==========================================
  // SLIDE 12: ARQUITECTURA TECNOLÓGICA
  // ==========================================
  doc.addPage([960, 540], 'landscape')
  drawBackground()
  drawHeader('Arquitectura Tecnológica de Grado Empresarial')

  // Three Layer Stack
  const techLayers = [
    {
      layer: 'Capa 3: Frontend y UI',
      tech: 'React 18 & Vite 6 • Tailwind CSS',
      desc: 'Generador de PDFs integrado (jsPDF) para manuales, visualizadores interactivos y diseño responsive touch.',
      color: [46, 117, 89],
      y: 130
    },
    {
      layer: 'Capa 2: Backend API',
      tech: 'Node.js & Express • 100% TypeScript',
      desc: 'Arquitectura modular con guards RBAC, compresión gzip, streaming de logs y validación de esquemas Zod.',
      color: [234, 88, 12],
      y: 235
    },
    {
      layer: 'Capa 1: Base de Datos y Persistencia',
      tech: 'PostgreSQL 16 con Pooling • Prisma ORM 7',
      desc: 'Modelado relacional fuertemente tipado, migraciones reproducibles y soporte multi-tenant aislado.',
      color: [15, 23, 42],
      y: 340
    }
  ]

  techLayers.forEach(l => {
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(80, l.y, 800, 85, 10, 10, 'FD')

    // Left colored block
    doc.setFillColor(l.color[0], l.color[1], l.color[2])
    doc.roundedRect(80, l.y, 220, 85, 10, 10, 'F')
    doc.rect(180, l.y, 120, 85, 'F') // straighten right side of colored block

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(l.layer, 190, l.y + 35, { align: 'center' })

    // Right text
    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.text(l.tech, 330, l.y + 32)

    doc.setTextColor(71, 85, 105)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11.5)
    const lines = doc.splitTextToSize(l.desc, 520)
    doc.text(lines, 330, l.y + 55)
  })

  drawFooter(12)

  // ==========================================
  // SLIDE 13: CERTIFICACIÓN DE CALIDAD
  // ==========================================
  doc.addPage([960, 540], 'landscape')
  drawBackground()
  drawHeader('Certificación de Calidad y Rendimiento en Producción')

  const metrics = [
    {
      val: '34/34 ✔️',
      title: 'Evaluaciones Exitosas',
      desc: 'Ultra-Suite E2E (Playwright) y Vitest. 100% de éxito en todos los subsistemas.',
      accent: [16, 185, 129]
    },
    {
      val: '373ms',
      title: 'Prueba de Estrés',
      desc: 'Soportó 50 lecturas concurrentes simultáneas manteniendo un tiempo p95 ultrarrápido.',
      accent: [14, 165, 233]
    },
    {
      val: '0%',
      title: 'Fallos en Producción',
      desc: 'Fiabilidad transaccional demostrada en 20 escrituras atómicas en ráfaga (goles/asistencias).',
      accent: [234, 88, 12]
    }
  ]

  let xMet = 60
  metrics.forEach(m => {
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(xMet, 140, 260, 220, 12, 12, 'FD')

    doc.setTextColor(m.accent[0], m.accent[1], m.accent[2])
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(38)
    doc.text(m.val, xMet + 130, 205, { align: 'center' })

    doc.setTextColor(15, 23, 42)
    doc.setFontSize(15)
    doc.text(m.title, xMet + 130, 245, { align: 'center' })

    doc.setTextColor(71, 85, 105)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    const lines = doc.splitTextToSize(m.desc, 210)
    doc.text(lines, xMet + 25, 275)

    xMet += 290
  })

  // Bottom Banner
  doc.setFillColor(15, 23, 42)
  doc.roundedRect(60, 390, 840, 45, 8, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Infraestructura validada para soportar los picos de tráfico más exigentes durante finales de torneos nacionales.', 480, 418, { align: 'center' })

  drawFooter(13)

  // ==========================================
  // SLIDE 14: COMPROMISO OPEN SOURCE Y WFDF
  // ==========================================
  doc.addPage([960, 540], 'landscape')
  drawBackground()
  drawHeader('Compromiso Open Source y Biblioteca WFDF')

  // Left Card: Licencia MIT
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(80, 140, 380, 280, 12, 12, 'FD')

  doc.setFontSize(36)
  doc.text('🔓 ➔ 🌐', 270, 200, { align: 'center' })

  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Licencia MIT (Modelo Libre)', 270, 245, { align: 'center' })

  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.text('• Gratuito para cualquier club, colegio o federación.', 110, 290)
  doc.text('• Código abierto con atribución requerida al repositorio.', 110, 320)
  doc.text('• Comunidad activa: Pull Requests y mejoras bienvenidos.', 110, 350)

  // Right Card: Documentos y Generador
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(500, 140, 380, 280, 12, 12, 'FD')

  doc.setFontSize(36)
  doc.text('📄 ➔ 📥', 690, 200, { align: 'center' })

  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Generador de PDFs Integrado', 690, 245, { align: 'center' })

  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.text('• Motor interno para exportar manuales y diagramas.', 530, 290)
  doc.text('• Repositorio: Reglamento WFDF 2025/2026 oficial.', 530, 320)
  doc.text('• Rúbricas SOTG y Protocolos de Mesa Técnica listos.', 530, 350)

  drawFooter(14)

  // ==========================================
  // SLIDE 15: LLEVA A TU CLUB AL SIGUIENTE NIVEL
  // ==========================================
  doc.addPage([960, 540], 'landscape')
  drawBackground()
  drawHeader('Lleva a tu Club al Siguiente Nivel Operativo')

  const nextSteps = [
    { n: '1', title: 'Clonar', desc: 'Descarga el código abierto desde GitHub.' },
    { n: '2', title: 'Desplegar', desc: 'Levanta tu propia instancia en minutos usando Docker o un VPS.' },
    { n: '3', title: 'Dominar', desc: 'Configura tu identidad gráfica y comienza a registrar a tus atletas reales.' }
  ]

  let yStepNext = 140
  nextSteps.forEach(s => {
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(120, yStepNext, 720, 60, 10, 10, 'FD')

    // Number Badge
    doc.setFillColor(46, 117, 89)
    doc.circle(160, yStepNext + 30, 18, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(s.n, 160, yStepNext + 36, { align: 'center' })

    // Title & desc
    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(s.title + ':', 200, yStepNext + 35)

    doc.setTextColor(71, 85, 105)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text(s.desc, 280, yStepNext + 35)

    yStepNext += 75
  })

  // Bottom CTA
  doc.setFillColor(46, 117, 89) // emerald green
  doc.roundedRect(120, 385, 720, 55, 12, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('Código Abierto y Despliegue Inmediato', 480, 410, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('github.com/frankSousa23/San-Juan-Ultimate-Crew • Datos de prueba listos y limpieza a cero en 1 clic', 480, 428, { align: 'center' })

  drawFooter(15)

  // Return buffer
  const arrayBuffer = doc.output('arraybuffer')
  return Buffer.from(arrayBuffer)
}

// Write to disk
const pdfBuffer = generatePresentationPdf()
fs.writeFileSync('apps/web/public/SIGEDIVO_Presentacion_Ejecutiva_2026.pdf', pdfBuffer)
fs.writeFileSync('docs/SIGEDIVO_Presentacion_Ejecutiva_2026.pdf', pdfBuffer)
// Also replace old PDF
fs.writeFileSync('apps/web/public/SIGEDIVO_Manual_de_Usuario_y_Roles.pdf', pdfBuffer)
console.log('Successfully generated 15-page presentation PDF:', pdfBuffer.length, 'bytes')
