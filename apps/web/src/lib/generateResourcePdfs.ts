import { jsPDF } from 'jspdf'

export interface ResourceDocumentConfig {
  id: number | string
  title: string
  category: string
  subtitle: string
  sections: { heading: string; body: string[] }[]
  footerText?: string
}

export const RESOURCE_DOCS: Record<number | string, ResourceDocumentConfig> = {
  1: {
    id: 1,
    title: 'Reglas Oficiales de Ultimate Frisbee (WFDF 2025 / 2026)',
    category: 'Reglamento y Normativas',
    subtitle: 'Normativa Oficial Internacional de la World Flying Disc Federation para Ultimate Frisbee',
    sections: [
      {
        heading: '1. Principios Fundamentales del Juego',
        body: [
          '• Espíritu de Juego (Spirit of the Game - SOTG): El Ultimate se basa en el honor, la deportividad y el respeto mutuo. No existen árbitros externos en partidos estándar; cada jugador es responsable de administrar el reglamento de forma justa y objetiva.',
          '• Deporte sin Contacto Físico: Está prohibido el contacto corporal intencional. Toda colisión que afecte el juego de otro participante constituye una falta.',
          '• Autogestión y Resolución de Disputas: Solo los atletas directamente involucrados en una jugada discuten las llamadas. Si no hay acuerdo tras 15 segundos, el disco regresa al lanzador anterior (Contested Call).'
        ]
      },
      {
        heading: '2. Dimensiones Oficiales del Campo y Equipamiento',
        body: [
          '• Campo de Juego: Longitud total de 100 metros (64 metros de campo central más dos zonas de anotación de 18 metros en cada extremo). Ancho reglamentario de 37 metros.',
          '• Disco Reglamentario: Disco volador de 175 gramos con 27 cm de diámetro (estándar Discraft Ultra-Star o homologado por WFDF).',
          '• Alineación: 7 jugadores por equipo en cancha durante juego sobre césped (5 vs 5 en modalidad playa o sala).'
        ]
      },
      {
        heading: '3. Dinámica del Disco, Posesión y Regla de los 10 Segundos (Stall)',
        body: [
          '• Movimiento del Disco: El disco puede avanzar en cualquier dirección completando un pase a un compañero de equipo. El poseedor no puede correr con el disco (debe establecer un pie de pivote fijo).',
          '• Conteo de Stall: El defensa que marca al poseedor (Mark) debe situarse a al menos un disco de distancia y contar audiblemente en voz alta: "Stalling 1, 2, 3... hasta 10". Si llega a 10 antes del pase, es rotación (Stall Out).',
          '• Rotación de Posesión (Turnover): El disco pasa inmediatamente al equipo contrario si toca el suelo (incompleto), es interceptado, sale de los límites del campo (Out of bounds), es bloqueado o cae por falta ofensiva.'
        ]
      },
      {
        heading: '4. Anotación y Reinicio de Juego (Pull)',
        body: [
          '• Cómo Anotar: Se consigue un punto cuando un atacante atrapa un pase dentro de la zona de gol (Endzone) rival con al menos un punto de contacto válido en el área.',
          '• Saque Inicial (Pull): Cada punto comienza con ambos equipos en sus respectivas líneas de gol. El equipo que anotó lanza el disco (Pull) hacia el otro equipo.',
          '• Puntuación de Partido: Partidos estándar se juegan a 15 puntos con límite de tiempo de 90 a 100 minutos y medio tiempo al llegar al punto 8.'
        ]
      }
    ]
  },
  2: {
    id: 2,
    title: 'Manual de Espíritu de Juego (Spirit of the Game - SOTG)',
    category: 'Espíritu de Juego',
    subtitle: 'Rúbrica Oficial WFDF de Evaluación y Conducta Deportiva Autogestionada',
    sections: [
      {
        heading: '1. ¿Qué es el Espíritu de Juego (SOTG)?',
        body: [
          'El SOTG es el principio rector que distingue al Ultimate de todos los demás deportes competitivos de conjunto. Confía la responsabilidad del juego limpio a cada atleta, eliminando la necesidad de árbitros y fomentando un alto nivel de intensidad competitiva junto con un respeto riguroso.',
          'Al finalizar cada encuentro, ambos equipos se reúnen en el "Círculo de Espíritu" para dialogar constructivamente y posteriormente completar la rúbrica oficial de 5 categorías (puntuación de 0 a 4 por categoría, total base 10).'
        ]
      },
      {
        heading: '2. Las 5 Categorías de Evaluación Oficial WFDF',
        body: [
          '1. Conocimiento y Aplicación de Reglas: ¿Conocían el reglamento? ¿Hicieron llamadas correctas sin inventar reglas? (0 = Malo, 2 = Bueno/Normal, 4 = Excelente).',
          '2. Faltas y Contacto Corporal: ¿Evitaron el contacto físico peligroso? ¿Jugaron con control en el aire y en el suelo?',
          '3. Imparcialidad y Honestidad: ¿Admitieron cuando cometieron falta o cuando el disco tocó el suelo? ¿Retractaron llamadas erróneas?',
          '4. Actitud Positiva y Autocontrol: ¿Mantuvieron la calma ante decisiones adversas? ¿Trataron al rival con cortesía y camaradería?',
          '5. Comunicación Clara y Respetuosa: ¿Explicaron sus llamadas con calma y escucharon el punto de vista del oponente sin gritos ni demoras?'
        ]
      },
      {
        heading: '3. Protocolo del Círculo de Espíritu (Spirit Circle)',
        body: [
          '• Al sonar el silbatazo final, ambos planteles se entrelazan en un círculo conjunto alternando jugadores de ambos equipos.',
          '• Los capitanes y jugadores clave toman la palabra para agradecer el partido, destacar jugadas limpias, discutir momentos tensos con madurez y entregar el reconocimiento al jugador con mayor espíritu (MVP SOTG).'
        ]
      }
    ]
  },
  3: {
    id: 3,
    title: 'Guía Oficial de Señales de Mano y Gestos Reglamentarios WFDF',
    category: 'Reglamento y Normativas',
    subtitle: 'Señales Gestuales Estandarizadas para Jugadores, Marcadores y Anotadores Oficiales',
    sections: [
      {
        heading: '1. Señales de Anotación y Estado de Juego',
        body: [
          '• GOL / ANOTACIÓN: Ambos brazos extendidos verticalmente hacia arriba con las palmas abiertas hacia adentro.',
          '• DISCO EN JUEGO / DISCO VIVO (In Play): Brazo alzado verticalmente con la mano abierta y luego tocar el suelo o el disco indicando inicio de conteo.',
          '• TIEMPO MUERTO (Timeout): Manos formando una letra "T" con las palmas (una vertical y otra horizontal sobre la parte superior).',
          '• REINICIO DE DISCO / REVISIÓN (Play Restart): Un toque audible en el suelo o en la mano del defensa ("Disco al suelo / Checking disk").'
        ]
      },
      {
        heading: '2. Señales de Faltas, Infracciones y Violaciones',
        body: [
          '• FALTA (Foul): Un brazo extendido hacia arriba sosteniendo la muñeca con la otra mano en ángulo de 90 grados.',
          '• CAMINAR / PASOS ILEGALES (Travel): Manos rotando en círculos una sobre la otra frente al pecho (emulando pasos ilegales).',
          '• PICK / OBSTRUCCIÓN (Pick): Brazos cruzados en "X" sobre el pecho.',
          '• STALL OUT (Tiempo Agotado): Las dos manos abiertas mostrando los 10 dedos extendidos al frente.',
          '• FUERA DE CAMPO (Out of Bounds): Brazos extendidos hacia los costados apuntando en dirección opuesta al campo.',
          '• FALTA EN EL CONTEO (Fast Count / Straddle / Marking Infraction): Mano derecha extendida al frente con la palma apuntando al defensor infractor.'
        ]
      }
    ]
  },
  4: {
    id: 4,
    title: 'Manual Técnico de Lanzamientos Fundamentales de Ultimate',
    category: 'Entrenamiento Técnico',
    subtitle: 'Mecánica de Lanzamiento, Agarre, Rotación y Ángulos de Vuelo (IO / OI)',
    sections: [
      {
        heading: '1. El Lanzamiento de Revés (Backhand)',
        body: [
          '• Agarre: Cuatro dedos envolviendo firmemente el borde interno del disco (agarre de poder) o dedo índice extendido sobre el borde exterior para mayor control y precisión en distancias cortas.',
          '• Postura y Pivote: Cuerpo lateral al objetivo. El pie de pivote permanece fijo mientras el pie libre se cruza hacia el lado de lanzamiento para ganar palanca y distancia del defensor.',
          '• Liberación: Movimiento de muñeca en forma de látigo ("Snap") manteniendo el borde externo ligeramente inclinado hacia abajo para contrarrestar la rotación giroscópica.'
        ]
      },
      {
        heading: '2. El Lanzamiento de Frente / Lado (Forehand / Flick)',
        body: [
          '• Agarre: Dedos índice y medio extendidos por debajo del disco presionando la pared interior de la pestaña (Grip en "V" o "Pistola"). Pulgar firmemente sobre el dibujo superior.',
          '• Mecánica: Todo el impulso proviene del quiebre rápido de muñeca (Snap) y rotación de cadera, no del hombro ni del brazo entero.',
          '• Nivelación: Codo pegado al torso, disco nivelado o con ligera inclinación Inside-Out (IO) para romper marcas forzadas al revés.'
        ]
      },
      {
        heading: '3. Lanzamientos Aéreos e Invertidos (Hammer, Scoober y Blade)',
        body: [
          '• Martillo (Hammer): Agarre de Forehand pero el disco se eleva sobre la cabeza en ángulo de 45 a 60 grados. El disco vuela invertido y se aplana al descender en la zona de gol.',
          '• Scoober: Lanzamiento rápido desde el pecho con agarre de revés invertido, ideal para superar defensas en copa sin retroceder.',
          '• Ángulos IO / OI: Inside-Out (inclinado hacia adentro de la curva) y Outside-In (inclinado hacia afuera). Dominar estos ángulos permite rodear marcas cerradas con viento lateral.'
        ]
      }
    ]
  },
  5: {
    id: 5,
    title: 'Guía de Nutrición, Hidratación y Rendimiento en Torneos de Fin de Semana',
    category: 'Salud y Bienestar',
    subtitle: 'Protocolos de Hidratación con Electrolitos, Carga de Carbohidratos y Recuperación Muscular',
    sections: [
      {
        heading: '1. Protocolo de Hidratación Antes, Durante y Después de la Cancha',
        body: [
          '• Pre-hidratación: Consumir 500 ml de agua 2 horas antes del primer encuentro matutino.',
          '• Durante los Partidos: Ingerir entre 150 y 250 ml cada 15 a 20 minutos (en tiempos muertos o cambios de línea). Alternar agua con suero oral o bebidas isotónicas ricas en sodio, potasio y magnesio para evitar hiponatremia y calambres.',
          '• Rehidratación Post-Partido: Beber 1.2 a 1.5 litros por cada kilogramo de peso corporal perdido durante la jornada.'
        ]
      },
      {
        heading: '2. Nutrición Entre Partidos Consecutivos (Snacks de Rápida Absorción)',
        body: [
          '• Ventana de 30-60 minutos entre partidos: Frutas ricas en potasio (plátanos/bananas, naranjas), frutos secos con sal marina, barras de cereal, dátiles y geles energéticos con carbohidratos simples.',
          '• Almuerzo de Torneo: Evitar comidas grasas, frituras o lácteos pesados que retarden la digestión. Optar por arroz blanco, pollo desmenuzado, pasta simple y vegetales cocidos.',
          '• Recuperación Nocturna: Cena con alto contenido proteico y carbohidratos complejos para reparar microdesgarros musculares antes del segundo día de competencia.'
        ]
      },
      {
        heading: '3. Prevención de Golpes de Calor y Lesiones',
        body: [
          '• Uso de toallas húmedas en la nuca entre cambios de línea.',
          '• Calentamiento dinámico de 15 minutos y estiramientos balísticos antes de ingresar al campo.',
          '• Inmersión en hielo o duchas frías para reducir inflamación articular en torneos de 5 a 6 partidos.'
        ]
      }
    ]
  }
}

export function generateResourcePdf(docId: number | string): jsPDF {
  const config = RESOURCE_DOCS[docId] || RESOURCE_DOCS[1]
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

  function addHeader() {
    doc.setFillColor(30, 58, 138) // Navy Blue
    doc.rect(0, 0, pageWidth, 12, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text('SIGEDIVO (SISTEMA DE GESTIÓN PARA EL DISCO VOLADOR) • DOCUMENTO TÉCNICO OFICIAL', margin, 7.5)
    doc.text(config.category.toUpperCase(), pageWidth - margin, 7.5, { align: 'right' })
  }

  function addFooter() {
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text('Biblioteca Técnica Oficial • SIGEDIVO 2026', margin, pageHeight - 7)
    doc.text(`Página ${pageNumber}`, pageWidth - margin, pageHeight - 7, { align: 'right' })
    pageNumber++
  }

  // Header decorativo
  addHeader()

  // Banda de título
  doc.setFillColor(241, 245, 249)
  doc.rect(margin, 18, contentWidth, 32, 'F')
  doc.setDrawColor(203, 213, 225)
  doc.setLineWidth(0.3)
  doc.rect(margin, 18, contentWidth, 32, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  const titleLines = doc.splitTextToSize(config.title, contentWidth - 8)
  doc.text(titleLines, margin + 4, 26)

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  const subLines = doc.splitTextToSize(config.subtitle, contentWidth - 8)
  doc.text(subLines, margin + 4, 44)

  let curY = 56

  config.sections.forEach((sec) => {
    // Verificar si necesitamos nueva página
    if (curY > pageHeight - 40) {
      addFooter()
      doc.addPage()
      addHeader()
      curY = 22
    }

    // Título de Sección
    doc.setFillColor(224, 231, 255) // Indigo claro
    doc.rect(margin, curY, contentWidth, 7, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30, 58, 138)
    doc.text(sec.heading, margin + 3, curY + 5)
    curY += 10

    // Contenido de Sección
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(30, 41, 59)

    sec.body.forEach(para => {
      const lines = doc.splitTextToSize(para, contentWidth - 4)
      if (curY + lines.length * 4.5 > pageHeight - 20) {
        addFooter()
        doc.addPage()
        addHeader()
        curY = 22
      }
      doc.text(lines, margin + 2, curY)
      curY += lines.length * 4.5 + 3
    })

    curY += 2
  })

  // Pie de página final
  addFooter()

  return doc
}

export function downloadResourcePdf(docId: number | string, filename?: string) {
  const doc = generateResourcePdf(docId)
  const cfg = RESOURCE_DOCS[docId]
  const fname = filename || (cfg ? `${cfg.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40)}.pdf` : `Documento_SIGEDIVO_${docId}.pdf`)
  doc.save(fname)
}
