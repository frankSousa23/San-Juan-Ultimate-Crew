import React, { useState, useEffect, useRef, useMemo } from 'react'
import type { PlayItem, PlayCategory } from '../types/plays'

export interface TacticalPlayer {
  id: string
  label: string
  role: string
  team: 'offense' | 'defense'
  x: number // percentage 0 - 100
  y: number // percentage 0 - 100
  actionDesc?: string
}

export interface TacticalPhase {
  phaseNumber: number
  title: string
  subtitle: string
  discPosition: { x: number; y: number }
  holdingPlayerId?: string
  passingToPlayerId?: string
  players: TacticalPlayer[]
  passTrajectory?: { from: { x: number; y: number }; to: { x: number; y: number }; isHigh?: boolean }
  movementTrails?: { playerId: string; from: { x: number; y: number }; to: { x: number; y: number } }[]
  tacticalNotes: string
  keyTips: string[]
}

export interface TacticalPlaySchema {
  id: string
  name: string
  category: PlayCategory
  fieldOrientation: 'horizontal' | 'vertical'
  summary: string
  idealConditions: string
  counteredBy: string
  keyPositions: { role: string; responsibility: string }[]
  phases: TacticalPhase[]
  commonMistakes: string[]
}

// Preset library of rich, animated tactical formations
export const PRESET_TACTICAL_PLAYS: Record<string, TacticalPlaySchema> = {
  'vertical-stack': {
    id: 'vertical-stack',
    name: 'Vertical Stack Estándar (Cortes Open y Break Side)',
    category: 'OFFENSE',
    fieldOrientation: 'horizontal',
    summary: 'Alineación en columna central de 4 cortadores y 2-3 lanzadores en la base. Maximiza los carriles laterales para cortes sucesivos.',
    idealConditions: 'Excelente contra marcaje individual (Man-to-Man) en condiciones de viento moderado a bajo.',
    counteredBy: 'Defensa en zona o cúpula central (Dome Defense).',
    keyPositions: [
      { role: 'Handler 1 (Lanzador)', responsibility: 'Mantiene posesión activa, lee al defensor del stack y lanza al espacio abierto.' },
      { role: 'Handler 2 (Dump)', responsibility: 'Se posiciona 45° detrás del lanzador para desahogo de emergencia en stall 6.' },
      { role: 'Cutter 1 (Fondo Stack)', responsibility: 'Inicia el primer corte explosivo desde el fondo de la columna hacia el lado abierto.' },
      { role: 'Cutter 2 (Continuación)', responsibility: 'Lee la recepción de Cutter 1 y corta de inmediato hacia la zona de anotación.' },
    ],
    commonMistakes: [
      'Cortar dos personas al mismo tiempo y amontonar el espacio.',
      'Esperar hasta el stall 8 para pedir el pase de desahogo (dump).',
      'No recolocarse al centro del stack si el corte no recibe el pase.',
    ],
    phases: [
      {
        phaseNumber: 1,
        title: 'Fase 1: Formación Base y Lectura',
        subtitle: 'Estructura vertical alineada en el centro del campo.',
        discPosition: { x: 22, y: 50 },
        holdingPlayerId: 'H1',
        tacticalNotes: 'H1 tiene el disco en la base. Los 4 cutters están ordenados en fila india en el centro. El defensor de marca (Force) guía el tiro hacia el lado abierto.',
        keyTips: ['Stack debe mantener 3-4 metros entre cada jugador.', 'H2 atento a 5 metros en ángulo de 45°.'],
        players: [
          { id: 'H1', label: 'H1', role: 'Handler Principal', team: 'offense', x: 22, y: 50, actionDesc: 'Con disco, amagando al lado cerrado' },
          { id: 'H2', label: 'H2', role: 'Dump Handler', team: 'offense', x: 16, y: 30, actionDesc: 'Posición de desahogo a 45°' },
          { id: 'C4', label: 'C4', role: 'Cutter Front', team: 'offense', x: 45, y: 50, actionDesc: 'Frente del stack, abriendo carril' },
          { id: 'C3', label: 'C3', role: 'Cutter Mid', team: 'offense', x: 56, y: 50, actionDesc: 'Manteniendo espacio central' },
          { id: 'C2', label: 'C2', role: 'Cutter Deep', team: 'offense', x: 67, y: 50, actionDesc: 'Preparando corte de continuación' },
          { id: 'C1', label: 'C1', role: 'Cutter Iniciador', team: 'offense', x: 78, y: 50, actionDesc: 'Fondo del stack, listo para explotar' },
          // Defensas
          { id: 'D-H1', label: 'M1', role: 'Marcador (Force)', team: 'defense', x: 25, y: 46, actionDesc: 'Forzando al lado abierto (hacia arriba)' },
          { id: 'D-H2', label: 'M2', role: 'Defensa Dump', team: 'defense', x: 18, y: 26, actionDesc: 'Negando pase directo' },
          { id: 'D-C1', label: 'DC1', role: 'Defensa Fondo', team: 'defense', x: 80, y: 46, actionDesc: 'Tratando de evitar el corte abierto' },
          { id: 'D-C2', label: 'DC2', role: 'Defensa Medio', team: 'defense', x: 69, y: 47, actionDesc: 'En posición de recuperación' },
        ]
      },
      {
        phaseNumber: 2,
        title: 'Fase 2: Corte Primario Explosivo',
        subtitle: 'Cutter 1 engaña al lado cerrado y ataca el lado abierto en "V".',
        discPosition: { x: 22, y: 50 },
        holdingPlayerId: 'H1',
        passingToPlayerId: 'C1',
        tacticalNotes: 'Cutter 1 hace una finta rápida de 2 pasos hacia el lado cerrado y quiebra con fuerza hacia el espacio abierto a 45°. H1 arma el lanzamiento.',
        keyTips: ['El corte debe ser decidido a máxima velocidad.', 'H1 lanza al espacio libre por delante del corredor.'],
        passTrajectory: { from: { x: 22, y: 50 }, to: { x: 52, y: 25 } },
        movementTrails: [
          { playerId: 'C1', from: { x: 78, y: 50 }, to: { x: 52, y: 25 } },
          { playerId: 'C2', from: { x: 67, y: 50 }, to: { x: 74, y: 45 } },
        ],
        players: [
          { id: 'H1', label: 'H1', role: 'Handler Principal', team: 'offense', x: 22, y: 50, actionDesc: 'Soltando pase líder hacia C1' },
          { id: 'H2', label: 'H2', role: 'Dump Handler', team: 'offense', x: 16, y: 30, actionDesc: 'Acompañando la línea de juego' },
          { id: 'C4', label: 'C4', role: 'Cutter Front', team: 'offense', x: 45, y: 50, actionDesc: 'Manteniendo quieto a su defensor' },
          { id: 'C3', label: 'C3', role: 'Cutter Mid', team: 'offense', x: 56, y: 50, actionDesc: 'Preparando reemplazo en el stack' },
          { id: 'C2', label: 'C2', role: 'Cutter Deep', team: 'offense', x: 74, y: 45, actionDesc: 'Avanzando al fondo del stack' },
          { id: 'C1', label: 'C1', role: 'Cutter Iniciador', team: 'offense', x: 52, y: 25, actionDesc: 'Recibiendo en carrera en lado abierto' },
          // Defensas
          { id: 'D-H1', label: 'M1', role: 'Marcador', team: 'defense', x: 26, y: 47, actionDesc: 'Intentando bloquear el pase' },
          { id: 'D-H2', label: 'M2', role: 'Defensa Dump', team: 'defense', x: 18, y: 26, actionDesc: 'Cubriendo pase hacia atrás' },
          { id: 'D-C1', label: 'DC1', role: 'Defensa Fondo', team: 'defense', x: 57, y: 29, actionDesc: 'Superado por el corte en velocidad' },
          { id: 'D-C2', label: 'DC2', role: 'Defensa Medio', team: 'defense', x: 76, y: 47, actionDesc: 'Siguiendo a C2' },
        ]
      },
      {
        phaseNumber: 3,
        title: 'Fase 3: Pase de Continuación & Golpe a Endzone',
        subtitle: 'Recepción limpia y corte de anotación en profundidad.',
        discPosition: { x: 52, y: 25 },
        holdingPlayerId: 'C1',
        passingToPlayerId: 'C2',
        tacticalNotes: 'C1 atrapa el disco, gira de inmediato y busca la continuación hacia la zona de anotación (Endzone). C2 corta hacia el cono frontal.',
        keyTips: ['Atrapar con dos manos (Pancake Catch) para máxima seguridad.', 'Giro rápido en pivote sin perder tiempo de stall.'],
        passTrajectory: { from: { x: 52, y: 25 }, to: { x: 91, y: 35 } },
        movementTrails: [
          { playerId: 'C2', from: { x: 74, y: 45 }, to: { x: 91, y: 35 } },
          { playerId: 'H1', from: { x: 22, y: 50 }, to: { x: 38, y: 25 } },
        ],
        players: [
          { id: 'H1', label: 'H1', role: 'Handler Principal', team: 'offense', x: 38, y: 25, actionDesc: 'Avanza para ser nuevo dump de apoyo' },
          { id: 'H2', label: 'H2', role: 'Dump Handler', team: 'offense', x: 24, y: 40, actionDesc: 'Ocupa el centro del campo' },
          { id: 'C4', label: 'C4', role: 'Cutter Front', team: 'offense', x: 50, y: 60, actionDesc: 'Limpia espacio hacia el lado opuesto' },
          { id: 'C3', label: 'C3', role: 'Cutter Mid', team: 'offense', x: 62, y: 60, actionDesc: 'Limpia carril de anotación' },
          { id: 'C2', label: 'C2', role: 'Cutter Deep', team: 'offense', x: 91, y: 35, actionDesc: 'Atrapa gol en la Endzone' },
          { id: 'C1', label: 'C1', role: 'Cutter Iniciador', team: 'offense', x: 52, y: 25, actionDesc: 'Lanzando pase de anotación con revés raso' },
          // Defensas
          { id: 'D-H1', label: 'M1', role: 'Marcador', team: 'defense', x: 42, y: 28, actionDesc: 'Corriendo a recuperar' },
          { id: 'D-H2', label: 'M2', role: 'Defensa Dump', team: 'defense', x: 28, y: 42, actionDesc: 'Marcando a H2' },
          { id: 'D-C1', label: 'DC1', role: 'Defensa', team: 'defense', x: 54, y: 27, actionDesc: 'Estableciendo nueva marca' },
          { id: 'D-C2', label: 'DC2', role: 'Defensa Fondo', team: 'defense', x: 87, y: 39, actionDesc: 'Llega un segundo tarde al corte' },
        ]
      }
    ]
  },

  'horizontal-stack': {
    id: 'horizontal-stack',
    name: 'Horizontal Stack (H-Stack) con Deep Iso',
    category: 'OFFENSE',
    fieldOrientation: 'horizontal',
    summary: 'Alineación transversal de 4 cortadores en línea horizontal y 3 lanzadores en la base. Abre gigantescos pasillos en el centro del campo.',
    idealConditions: 'Ideal contra defensas con marca estricta y cuando se cuenta con receptores rápidos y de gran salto.',
    counteredBy: 'Defensa en zona o poach inteligente en los carriles centrales.',
    keyPositions: [
      { role: 'Handler Central', responsibility: 'Distribuye con tiros precisos a ambas bandas y busca el Huck profundo.' },
      { role: 'Cutters Interiores', responsibility: 'Cortan cruzados hacia el centro (Under Cuts) para ganar yardas fáciles.' },
      { role: 'Cutters Exteriores', responsibility: 'Atacan en profundidad aislados (Deep Iso) o estiran la cancha.' },
    ],
    commonMistakes: [
      'Cortar en la misma dirección entre cortadores adyacentes.',
      'Quedarse estáticos esperando el disco sin crear ángulo de tiro.',
    ],
    phases: [
      {
        phaseNumber: 1,
        title: 'Fase 1: Dispersión Horizontal',
        subtitle: '3 Handlers y 4 Cutters esparcidos a lo ancho de la cancha.',
        discPosition: { x: 20, y: 50 },
        holdingPlayerId: 'H-Center',
        tacticalNotes: 'H-Center tiene el disco con visión completa. Los 4 cutters mantienen 10-12 metros de separación lateral.',
        keyTips: ['Los cortadores deben mantener su línea transversal antes de iniciar el corte.'],
        players: [
          { id: 'H-Left', label: 'HL', role: 'Handler Izquierdo', team: 'offense', x: 18, y: 22, actionDesc: 'Opción de swing abierto' },
          { id: 'H-Center', label: 'HC', role: 'Handler Central', team: 'offense', x: 20, y: 50, actionDesc: 'Lanzador con el disco' },
          { id: 'H-Right', label: 'HR', role: 'Handler Derecho', team: 'offense', x: 18, y: 78, actionDesc: 'Opción de desahogo derecho' },
          { id: 'C1', label: 'C1', role: 'Cutter Izq Exterior', team: 'offense', x: 55, y: 18, actionDesc: 'Pegado a la banda izq' },
          { id: 'C2', label: 'C2', role: 'Cutter Izq Interior', team: 'offense', x: 55, y: 38, actionDesc: 'Listo para corte under central' },
          { id: 'C3', label: 'C3', role: 'Cutter Der Interior', team: 'offense', x: 55, y: 62, actionDesc: 'Listo para corte profundo (Iso)' },
          { id: 'C4', label: 'C4', role: 'Cutter Der Exterior', team: 'offense', x: 55, y: 82, actionDesc: 'Pegado a la banda der' },
          // Defensas
          { id: 'D-HC', label: 'MC', role: 'Marca Central', team: 'defense', x: 23, y: 48, actionDesc: 'Forzando hacia la derecha' },
          { id: 'D-C2', label: 'DC2', role: 'Defensa Interior', team: 'defense', x: 58, y: 37, actionDesc: 'Cuidando el corte largo' },
          { id: 'D-C3', label: 'DC3', role: 'Defensa Interior', team: 'defense', x: 58, y: 63, actionDesc: 'Posición de contención' },
        ]
      },
      {
        phaseNumber: 2,
        title: 'Fase 2: Cruce y Despeje de Carriles',
        subtitle: 'C2 corta hacia adentro arrastrando la marca; C3 quiebra en largo.',
        discPosition: { x: 20, y: 50 },
        holdingPlayerId: 'H-Center',
        passingToPlayerId: 'C3',
        tacticalNotes: 'C2 atrae la atención de los defensores cortando bajo. C3 ve el pasillo central completamente vacío y ataca a fondo la Endzone.',
        keyTips: ['El Handler Central prepara el Huck con inclinación exterior.', 'Pase lanzado al espacio antes de que el receptor llegue.'],
        passTrajectory: { from: { x: 20, y: 50 }, to: { x: 89, y: 65 }, isHigh: true },
        movementTrails: [
          { playerId: 'C2', from: { x: 55, y: 38 }, to: { x: 42, y: 32 } },
          { playerId: 'C3', from: { x: 55, y: 62 }, to: { x: 89, y: 65 } },
        ],
        players: [
          { id: 'H-Left', label: 'HL', role: 'Handler Izquierdo', team: 'offense', x: 18, y: 22, actionDesc: 'Apoyo' },
          { id: 'H-Center', label: 'HC', role: 'Handler Central', team: 'offense', x: 20, y: 50, actionDesc: 'Lanzando pase largo (Huck)' },
          { id: 'H-Right', label: 'HR', role: 'Handler Derecho', team: 'offense', x: 18, y: 78, actionDesc: 'Apoyo' },
          { id: 'C1', label: 'C1', role: 'Cutter Izq Exterior', team: 'offense', x: 58, y: 16, actionDesc: 'Mantiene abierta la banda' },
          { id: 'C2', label: 'C2', role: 'Cutter Izq Interior', team: 'offense', x: 42, y: 32, actionDesc: 'Corte de señuelo Under' },
          { id: 'C3', label: 'C3', role: 'Cutter Der Interior', team: 'offense', x: 89, y: 65, actionDesc: 'Receptor en carrera profunda' },
          { id: 'C4', label: 'C4', role: 'Cutter Der Exterior', team: 'offense', x: 60, y: 84, actionDesc: 'Mantiene abierta la banda' },
          // Defensas
          { id: 'D-HC', label: 'MC', role: 'Marca Central', team: 'defense', x: 24, y: 49, actionDesc: 'Intentando tapar' },
          { id: 'D-C2', label: 'DC2', role: 'Defensa Interior', team: 'defense', x: 45, y: 34, actionDesc: 'Sigue a C2' },
          { id: 'D-C3', label: 'DC3', role: 'Defensa Interior', team: 'defense', x: 83, y: 67, actionDesc: 'Superado en velocidad' },
        ]
      },
      {
        phaseNumber: 3,
        title: 'Fase 3: Recepción Aérea en la Endzone',
        subtitle: 'Atrapada triunfal en la zona de gol y consolidación.',
        discPosition: { x: 89, y: 65 },
        holdingPlayerId: 'C3',
        tacticalNotes: 'C3 asegura el disco en el aire dentro de la zona de gol para consolidar el punto.',
        keyTips: ['Mantener la mirada en el disco hasta tener posesión total con dos manos.'],
        players: [
          { id: 'H-Left', label: 'HL', role: 'Handler Izquierdo', team: 'offense', x: 35, y: 30, actionDesc: 'Avanzando en bloque' },
          { id: 'H-Center', label: 'HC', role: 'Handler Central', team: 'offense', x: 40, y: 50, actionDesc: 'Acompañando el tiro' },
          { id: 'H-Right', label: 'HR', role: 'Handler Derecho', team: 'offense', x: 38, y: 70, actionDesc: 'Avanzando en bloque' },
          { id: 'C1', label: 'C1', role: 'Cutter Izq Exterior', team: 'offense', x: 65, y: 22, actionDesc: 'Soporte' },
          { id: 'C2', label: 'C2', role: 'Cutter Izq Interior', team: 'offense', x: 55, y: 40, actionDesc: 'Soporte' },
          { id: 'C3', label: 'C3', role: 'Cutter Der Interior', team: 'offense', x: 89, y: 65, actionDesc: '¡GOL! Anotación asegurada' },
          { id: 'C4', label: 'C4', role: 'Cutter Der Exterior', team: 'offense', x: 72, y: 80, actionDesc: 'Soporte' },
          // Defensas
          { id: 'D-HC', label: 'MC', role: 'Marca Central', team: 'defense', x: 43, y: 50, actionDesc: 'Completando transición' },
          { id: 'D-C2', label: 'DC2', role: 'Defensa Interior', team: 'defense', x: 58, y: 42, actionDesc: 'Fin de punto' },
          { id: 'D-C3', label: 'DC3', role: 'Defensa Interior', team: 'defense', x: 87, y: 69, actionDesc: 'Sin alcance' },
        ]
      }
    ]
  },

  'zone-cup-defense': {
    id: 'zone-cup-defense',
    name: 'Defensa en Zona Cup (3-3-1 Cup)',
    category: 'DEFENSE',
    fieldOrientation: 'horizontal',
    summary: 'Copa de 3 defensores que presiona al disco, 3 medios que niegan tiros laterales/martillos, y 1 Deep-Deep que cuida lanzamientos profundos.',
    idealConditions: 'Especialmente devastadora en días con viento fuerte o contra equipos con lanzadores poco experimentados.',
    counteredBy: 'Swings ultra rápidos de banda a banda y tiros elevados martillo (Hammer) con precisión.',
    keyPositions: [
      { role: 'Copa: Mark, Middle, Point', responsibility: 'Asfixian al lanzador impidiendo tiros rectos y hacia el centro sin tocar al jugador (manteniendo 3 metros).' },
      { role: 'Medios: Short Deep, Left Wing, Right Wing', responsibility: 'Cortan pases de media distancia y saltan sobre pases flotados o laterales.' },
      { role: 'Deep-Deep (Último Hombre)', responsibility: 'Lee toda la cancha desde el fondo y nunca permite que un atacante lo supere por la espalda.' },
    ],
    commonMistakes: [
      'Que la copa se rompa por falta de comunicación o desplace desincronizado.',
      'Que los Wings se queden dormidos y permitan el pase rápido a la línea de banda.',
    ],
    phases: [
      {
        phaseNumber: 1,
        title: 'Fase 1: Encarcelamiento de la Copa',
        subtitle: 'La copa de 3 rodea al lanzador; la segunda línea tapa las salidas.',
        discPosition: { x: 25, y: 50 },
        holdingPlayerId: 'O-H1',
        tacticalNotes: 'La copa (Mark, Middle, Point) encierra al lanzador atacante. Solo se permite el pase hacia atrás de poco avance.',
        keyTips: ['La copa debe moverse al unísono manteniendo la distancia reglamentaria.', 'Los Wings leen los ojos del lanzador.'],
        players: [
          // Ataque rival
          { id: 'O-H1', label: 'H1', role: 'Lanzador Rival', team: 'offense', x: 25, y: 50, actionDesc: 'Atrapado sin visión abierta' },
          { id: 'O-H2', label: 'H2', role: 'Dump Rival', team: 'offense', x: 15, y: 25, actionDesc: 'Opción de swing retrasado' },
          { id: 'O-C1', label: 'C1', role: 'Cutter Rival', team: 'offense', x: 60, y: 30, actionDesc: 'Bloqueado por Left Wing' },
          { id: 'O-C2', label: 'C2', role: 'Cutter Rival', team: 'offense', x: 65, y: 70, actionDesc: 'Bloqueado por Right Wing' },
          // Defensa Cup (Nuestro equipo)
          { id: 'D-Mark', label: 'MK', role: 'Mark (Copa)', team: 'defense', x: 29, y: 44, actionDesc: 'Presiona forzando el tiro' },
          { id: 'D-Mid', label: 'MD', role: 'Middle (Copa)', team: 'defense', x: 31, y: 50, actionDesc: 'Tapa el centro absoluto' },
          { id: 'D-Pt', label: 'PT', role: 'Point (Copa)', team: 'defense', x: 29, y: 56, actionDesc: 'Tapa el ángulo opuesto' },
          { id: 'D-SD', label: 'SD', role: 'Short Deep', team: 'defense', x: 50, y: 50, actionDesc: 'Niega pases frontales rasos' },
          { id: 'D-LW', label: 'LW', role: 'Left Wing', team: 'defense', x: 52, y: 25, actionDesc: 'Custodia banda izquierda' },
          { id: 'D-RW', label: 'RW', role: 'Right Wing', team: 'defense', x: 52, y: 75, actionDesc: 'Custodia banda derecha' },
          { id: 'D-DD', label: 'DD', role: 'Deep-Deep', team: 'defense', x: 82, y: 50, actionDesc: 'Vigilando el fondo del campo' },
        ]
      },
      {
        phaseNumber: 2,
        title: 'Fase 2: Desplazamiento Lateral de la Copa',
        subtitle: 'El ataque intenta rotar a la banda; la copa rota en bloque.',
        discPosition: { x: 18, y: 72 },
        holdingPlayerId: 'O-H3',
        tacticalNotes: 'El ataque pasa a la banda lateral. La copa rota rápido para atrapar al nuevo lanzador contra la línea (Trap). El Right Wing se posiciona agresivo.',
        keyTips: ['Correr con máxima intensidad en el pase lateral para no dar tiempo de pensar al rival.'],
        movementTrails: [
          { playerId: 'D-Mark', from: { x: 29, y: 44 }, to: { x: 22, y: 66 } },
          { playerId: 'D-Mid', from: { x: 31, y: 50 }, to: { x: 24, y: 72 } },
          { playerId: 'D-Pt', from: { x: 29, y: 56 }, to: { x: 22, y: 78 } },
        ],
        players: [
          // Ataque rival
          { id: 'O-H1', label: 'H1', role: 'Ex-lanzador', team: 'offense', x: 25, y: 50, actionDesc: 'Desahogo sin avance' },
          { id: 'O-H3', label: 'H3', role: 'Receptor en Banda', team: 'offense', x: 18, y: 72, actionDesc: 'Atrapado contra la línea' },
          { id: 'O-C1', label: 'C1', role: 'Cutter Rival', team: 'offense', x: 60, y: 40, actionDesc: 'Buscando espacio' },
          { id: 'O-C2', label: 'C2', role: 'Cutter Rival', team: 'offense', x: 70, y: 75, actionDesc: 'Buscando tiro largo' },
          // Defensa Cup
          { id: 'D-Mark', label: 'MK', role: 'Mark (Copa)', team: 'defense', x: 22, y: 66, actionDesc: 'Encierra en la línea' },
          { id: 'D-Mid', label: 'MD', role: 'Middle (Copa)', team: 'defense', x: 24, y: 72, actionDesc: 'Sella el retorno al centro' },
          { id: 'D-Pt', label: 'PT', role: 'Point (Copa)', team: 'defense', x: 22, y: 78, actionDesc: 'Sella la banda' },
          { id: 'D-SD', label: 'SD', role: 'Short Deep', team: 'defense', x: 46, y: 60, actionDesc: 'Cubre el espacio intermedio' },
          { id: 'D-LW', label: 'LW', role: 'Left Wing', team: 'defense', x: 45, y: 30, actionDesc: 'Flota al centro' },
          { id: 'D-RW', label: 'RW', role: 'Right Wing', team: 'defense', x: 50, y: 82, actionDesc: 'Cierra línea de banda' },
          { id: 'D-DD', label: 'DD', role: 'Deep-Deep', team: 'defense', x: 80, y: 60, actionDesc: 'Acompaña la jugada' },
        ]
      },
      {
        phaseNumber: 3,
        title: 'Fase 3: Presión de Stall Forzada e Intercepción',
        subtitle: 'Tiro forzado por desesperación interceptado por el Deep-Deep.',
        discPosition: { x: 75, y: 65 },
        holdingPlayerId: 'D-DD',
        tacticalNotes: 'Bajo stall 8 y sin opciones terrestres, el lanzador suelta un martillo forzado. El Deep-Deep lee el viento y logra el Turn (Defensa D).',
        keyTips: ['¡Celebrar en equipo y buscar de inmediato el contragolpe ofensivo (Fast Break)!'],
        passTrajectory: { from: { x: 18, y: 72 }, to: { x: 75, y: 65 }, isHigh: true },
        movementTrails: [
          { playerId: 'D-DD', from: { x: 80, y: 60 }, to: { x: 75, y: 65 } }
        ],
        players: [
          { id: 'O-H3', label: 'H3', role: 'Lanzador Rival', team: 'offense', x: 18, y: 72, actionDesc: 'Turnover provocado' },
          { id: 'O-C2', label: 'C2', role: 'Receptor Rival', team: 'offense', x: 78, y: 70, actionDesc: 'Superado en salto' },
          { id: 'D-Mark', label: 'MK', role: 'Mark', team: 'defense', x: 22, y: 66, actionDesc: 'Presión completada' },
          { id: 'D-Mid', label: 'MD', role: 'Middle', team: 'defense', x: 24, y: 72, actionDesc: 'Inicia transición ofensiva' },
          { id: 'D-Pt', label: 'PT', role: 'Point', team: 'defense', x: 22, y: 78, actionDesc: 'Inicia transición ofensiva' },
          { id: 'D-SD', label: 'SD', role: 'Short Deep', team: 'defense', x: 46, y: 60, actionDesc: 'Corre al desahogo' },
          { id: 'D-LW', label: 'LW', role: 'Left Wing', team: 'defense', x: 45, y: 30, actionDesc: 'Abre cancha' },
          { id: 'D-RW', label: 'RW', role: 'Right Wing', team: 'defense', x: 50, y: 82, actionDesc: 'Abre cancha' },
          { id: 'D-DD', label: 'DD', role: 'Deep-Deep', team: 'defense', x: 75, y: 65, actionDesc: '¡DEFENSA (D)! Intercepción asegurada' },
        ]
      }
    ]
  },

  'endzone-iso': {
    id: 'endzone-iso',
    name: 'Variación Endzone Iso (Aislamiento en Zona Roja)',
    category: 'OFFENSE',
    fieldOrientation: 'horizontal',
    summary: 'Estrategia en los últimos 15 metros. Despeje total de cortadores hacia el lado débil dejando un 1 vs 1 limpio en el cono de anotación.',
    idealConditions: 'Efectiva en línea de gol con marcas individuales cansadas o con emparejamientos favorables de estatura/velocidad.',
    counteredBy: 'Defensa de conmutación (Switch) o ayuda de zona rápida.',
    keyPositions: [
      { role: 'Handler con Disco', responsibility: 'Pivota bajo y suelta un pase raso de muñeca (Inside-Out Flick / Backhand).' },
      { role: 'Cutter Estrella (Iso)', responsibility: 'Finta al fondo y ataca el cono libre en un sprint explosivo de 5 metros.' },
      { role: 'Resto de Cutters', responsibility: 'Limpian completamente la zona de gol para evitar que sus defensas ayuden.' },
    ],
    commonMistakes: [
      'Que los otros cortadores se queden estorbando en la línea de gol.',
      'Lanzar un pase flotado que permita a la defensa recuperarse.',
    ],
    phases: [
      {
        phaseNumber: 1,
        title: 'Fase 1: Limpieza del Espacio (Clearout)',
        subtitle: '3 cortadores corren al fondo del lado cerrado; el carril frontal queda libre.',
        discPosition: { x: 60, y: 50 },
        holdingPlayerId: 'H1',
        tacticalNotes: 'Ataque a 15 metros del gol. Cutters C2, C3, C4 corren hacia la esquina lejana, despejando más del 70% de la zona.',
        keyTips: ['La limpieza del espacio debe ser rápida para no agotar los segundos de stall.'],
        players: [
          { id: 'H1', label: 'H1', role: 'Lanzador', team: 'offense', x: 60, y: 50, actionDesc: 'Con disco a 15m del gol' },
          { id: 'H2', label: 'H2', role: 'Dump de Respaldo', team: 'offense', x: 48, y: 35, actionDesc: 'Respaldo seguro' },
          { id: 'C1', label: 'C1', role: 'Cortador Aislado (Iso)', team: 'offense', x: 74, y: 40, actionDesc: 'En posición de 1 contra 1' },
          { id: 'C2', label: 'C2', role: 'Cutter Despeje', team: 'offense', x: 88, y: 78, actionDesc: 'Despejando al lado débil' },
          { id: 'C3', label: 'C3', role: 'Cutter Despeje', team: 'offense', x: 92, y: 82, actionDesc: 'Despejando al fondo' },
          { id: 'C4', label: 'C4', role: 'Cutter Despeje', team: 'offense', x: 85, y: 85, actionDesc: 'Despejando al fondo' },
          // Defensas
          { id: 'D-H1', label: 'M1', role: 'Marca Lanzador', team: 'defense', x: 63, y: 48, actionDesc: 'Forzando al cono abierto' },
          { id: 'D-C1', label: 'DC1', role: 'Defensa Iso', team: 'defense', x: 76, y: 38, actionDesc: 'Intentando adivinar el corte' },
          { id: 'D-C2', label: 'DC2', role: 'Defensa', team: 'defense', x: 89, y: 80, actionDesc: 'Arrastrado por C2' },
        ]
      },
      {
        phaseNumber: 2,
        title: 'Fase 2: Quiebre Explosivo al Cono Frontal',
        subtitle: 'C1 engaña hacia atrás y ataca el espacio libre con pase raso instantáneo.',
        discPosition: { x: 60, y: 50 },
        holdingPlayerId: 'H1',
        passingToPlayerId: 'C1',
        tacticalNotes: 'C1 rompe hacia el cono frontal abierto. H1 coloca el disco milimétricamente en el pecho del cortador.',
        keyTips: ['Pase rápido con muñeca firma (Snap) sin telegrafiar el tiro.'],
        passTrajectory: { from: { x: 60, y: 50 }, to: { x: 88, y: 25 } },
        movementTrails: [
          { playerId: 'C1', from: { x: 74, y: 40 }, to: { x: 88, y: 25 } }
        ],
        players: [
          { id: 'H1', label: 'H1', role: 'Lanzador', team: 'offense', x: 60, y: 50, actionDesc: 'Lanzando pase raso al cono' },
          { id: 'H2', label: 'H2', role: 'Dump', team: 'offense', x: 48, y: 35, actionDesc: 'Posición de apoyo' },
          { id: 'C1', label: 'C1', role: 'Cortador Iso', team: 'offense', x: 88, y: 25, actionDesc: 'Asegurando el gol en el cono' },
          { id: 'C2', label: 'C2', role: 'Cutter', team: 'offense', x: 88, y: 78, actionDesc: 'Espacio despejado' },
          { id: 'C3', label: 'C3', role: 'Cutter', team: 'offense', x: 92, y: 82, actionDesc: 'Espacio despejado' },
          { id: 'C4', label: 'C4', role: 'Cutter', team: 'offense', x: 85, y: 85, actionDesc: 'Espacio despejado' },
          // Defensas
          { id: 'D-H1', label: 'M1', role: 'Marca', team: 'defense', x: 63, y: 48, actionDesc: 'Superado' },
          { id: 'D-C1', label: 'DC1', role: 'Defensa Iso', team: 'defense', x: 84, y: 30, actionDesc: 'Queda a 1 metro de distancia' },
          { id: 'D-C2', label: 'DC2', role: 'Defensa', team: 'defense', x: 89, y: 80, actionDesc: 'Lejos de la jugada' },
        ]
      },
      {
        phaseNumber: 3,
        title: 'Fase 3: ¡Anotación de Gol Directa!',
        subtitle: 'Punto asegurado sin desgaste físico adicional.',
        discPosition: { x: 88, y: 25 },
        holdingPlayerId: 'C1',
        tacticalNotes: 'Anotación lograda en 3 segundos. El equipo rival no tuvo tiempo de rotar ni ayudar en defensa.',
        keyTips: ['Anotación efectiva y limpia.'],
        players: [
          { id: 'H1', label: 'H1', role: 'Lanzador', team: 'offense', x: 62, y: 45, actionDesc: 'Asistencia registrada' },
          { id: 'H2', label: 'H2', role: 'Dump', team: 'offense', x: 50, y: 35, actionDesc: 'Celebrando el punto' },
          { id: 'C1', label: 'C1', role: 'Cortador Iso', team: 'offense', x: 88, y: 25, actionDesc: '¡GOL! Recepción dentro de zona' },
          { id: 'C2', label: 'C2', role: 'Cutter', team: 'offense', x: 88, y: 78, actionDesc: 'Celebrando el punto' },
          { id: 'C3', label: 'C3', role: 'Cutter', team: 'offense', x: 92, y: 82, actionDesc: 'Celebrando el punto' },
          { id: 'C4', label: 'C4', role: 'Cutter', team: 'offense', x: 85, y: 85, actionDesc: 'Celebrando el punto' },
          // Defensas
          { id: 'D-H1', label: 'M1', role: 'Marca', team: 'defense', x: 63, y: 48, actionDesc: 'Punto concedido' },
          { id: 'D-C1', label: 'DC1', role: 'Defensa Iso', team: 'defense', x: 84, y: 30, actionDesc: 'Punto concedido' },
          { id: 'D-C2', label: 'DC2', role: 'Defensa', team: 'defense', x: 89, y: 80, actionDesc: 'Punto concedido' },
        ]
      }
    ]
  }
}

// Generate dynamic tactical schema if not matched with exact preset
export function getTacticalSchemaForPlay(play: PlayItem): TacticalPlaySchema {
  const normalizedName = (play.name || '').toLowerCase()
  
  if (normalizedName.includes('vert') || normalizedName.includes('columna')) {
    return { ...PRESET_TACTICAL_PLAYS['vertical-stack'], name: play.name, id: `custom-${play.id}` }
  }
  if (normalizedName.includes('horiz') || normalizedName.includes('h-stack')) {
    return { ...PRESET_TACTICAL_PLAYS['horizontal-stack'], name: play.name, id: `custom-${play.id}` }
  }
  if (normalizedName.includes('cup') || normalizedName.includes('zona') || normalizedName.includes('3-3-1')) {
    return { ...PRESET_TACTICAL_PLAYS['zone-cup-defense'], name: play.name, id: `custom-${play.id}` }
  }
  if (normalizedName.includes('endzone') || normalizedName.includes('iso') || normalizedName.includes('anotaci')) {
    return { ...PRESET_TACTICAL_PLAYS['endzone-iso'], name: play.name, id: `custom-${play.id}` }
  }

  // Fallback dynamic schema based on category
  const isDefense = play.category === 'DEFENSE'
  return {
    id: `play-${play.id}`,
    name: play.name,
    category: play.category,
    fieldOrientation: 'horizontal',
    summary: play.description || (isDefense ? 'Esquema táctico defensivo para frenar la progresión del disco y forzar pérdidas.' : 'Esquema táctico ofensivo para generar ventajas de espacio y anotaciones limpias.'),
    idealConditions: isDefense ? 'Condiciones de viento cruzado y marcaje zonal coordinado.' : 'Juego rápido con pases directos y rotación constante.',
    counteredBy: isDefense ? 'Pases rápidos de swing y paciencia en el stall.' : 'Defensa pegada y ayudas en corte profundo.',
    keyPositions: [
      { role: isDefense ? 'Defensa Marcador' : 'Lanzador (Handler)', responsibility: isDefense ? 'Presión continua al disco y corte de línea de tiro.' : 'Control del ritmo de juego y pases de precisión.' },
      { role: isDefense ? 'Defensa Intermedio' : 'Cortador Primario', responsibility: isDefense ? 'Cobertura de pasillos centrales.' : 'Cortes en ángulo para abrir la cancha.' },
      { role: isDefense ? 'Defensa Fondo' : 'Receptor Profundo', responsibility: isDefense ? 'Custodia del espacio de anotación.' : 'Ataque directo a la zona de gol.' },
    ],
    commonMistakes: [
      'Falta de comunicación verbal entre jugadores.',
      'Perder la posición corporal respecto al disco.',
      'Apresurar el lanzamiento con stall bajo.',
    ],
    phases: [
      {
        phaseNumber: 1,
        title: 'Fase 1: Posicionamiento Inicial',
        subtitle: 'Alineación estratégica de los jugadores en la cancha.',
        discPosition: { x: 22, y: 50 },
        holdingPlayerId: 'P1',
        tacticalNotes: 'Inicio de la jugada con formación balanceada y lectura de la defensa rival.',
        keyTips: ['Mantener la visión panorámica de la cancha.', 'Comprobar las señales del capitán.'],
        players: [
          { id: 'P1', label: 'H1', role: 'Lanzador', team: 'offense', x: 22, y: 50, actionDesc: 'Con el disco' },
          { id: 'P2', label: 'H2', role: 'Soporte', team: 'offense', x: 18, y: 30, actionDesc: 'Opción de pase' },
          { id: 'P3', label: 'C1', role: 'Cortador 1', team: 'offense', x: 50, y: 45, actionDesc: 'En posición' },
          { id: 'P4', label: 'C2', role: 'Cortador 2', team: 'offense', x: 65, y: 55, actionDesc: 'En posición' },
          { id: 'P5', label: 'C3', role: 'Cortador 3', team: 'offense', x: 80, y: 50, actionDesc: 'En fondo' },
          { id: 'D1', label: 'D1', role: 'Defensa 1', team: 'defense', x: 26, y: 47, actionDesc: 'Marcando' },
          { id: 'D2', label: 'D2', role: 'Defensa 2', team: 'defense', x: 53, y: 43, actionDesc: 'Cubriendo corte' },
          { id: 'D3', label: 'D3', role: 'Defensa 3', team: 'defense', x: 83, y: 48, actionDesc: 'Cubriendo fondo' },
        ]
      },
      {
        phaseNumber: 2,
        title: 'Fase 2: Movimiento y Ejecución',
        subtitle: 'Desplazamiento dinámico hacia el espacio libre.',
        discPosition: { x: 22, y: 50 },
        holdingPlayerId: 'P1',
        passingToPlayerId: 'P3',
        tacticalNotes: 'Los cortadores rompen al espacio libre mientras el lanzador ejecuta el pase.',
        keyTips: ['Sincronizar el pase con el momento de máxima separación.'],
        passTrajectory: { from: { x: 22, y: 50 }, to: { x: 58, y: 30 } },
        movementTrails: [
          { playerId: 'P3', from: { x: 50, y: 45 }, to: { x: 58, y: 30 } },
          { playerId: 'P4', from: { x: 65, y: 55 }, to: { x: 82, y: 40 } },
        ],
        players: [
          { id: 'P1', label: 'H1', role: 'Lanzador', team: 'offense', x: 22, y: 50, actionDesc: 'Ejecuta el pase' },
          { id: 'P2', label: 'H2', role: 'Soporte', team: 'offense', x: 24, y: 35, actionDesc: 'Avanza' },
          { id: 'P3', label: 'C1', role: 'Cortador 1', team: 'offense', x: 58, y: 30, actionDesc: 'Recibe en carrera' },
          { id: 'P4', label: 'C2', role: 'Cortador 2', team: 'offense', x: 82, y: 40, actionDesc: 'Corte a zona' },
          { id: 'P5', label: 'C3', role: 'Cortador 3', team: 'offense', x: 86, y: 65, actionDesc: 'Abre banda' },
          { id: 'D1', label: 'D1', role: 'Defensa 1', team: 'defense', x: 28, y: 48, actionDesc: 'Recuperando' },
          { id: 'D2', label: 'D2', role: 'Defensa 2', team: 'defense', x: 62, y: 34, actionDesc: 'Siguiendo marca' },
          { id: 'D3', label: 'D3', role: 'Defensa 3', team: 'defense', x: 84, y: 45, actionDesc: 'Conteniendo' },
        ]
      },
      {
        phaseNumber: 3,
        title: 'Fase 3: Consolidación y Anotación',
        subtitle: 'Finalización de la jugada con objetivo cumplido.',
        discPosition: { x: 88, y: 40 },
        holdingPlayerId: 'P4',
        tacticalNotes: 'Recepción en zona de anotación completando la progresión de la jugada.',
        keyTips: ['Celebrar y reorganizar la línea de juego.'],
        passTrajectory: { from: { x: 58, y: 30 }, to: { x: 88, y: 40 } },
        movementTrails: [
          { playerId: 'P4', from: { x: 82, y: 40 }, to: { x: 88, y: 40 } }
        ],
        players: [
          { id: 'P1', label: 'H1', role: 'Lanzador', team: 'offense', x: 38, y: 45, actionDesc: 'Apoyo' },
          { id: 'P2', label: 'H2', role: 'Soporte', team: 'offense', x: 42, y: 35, actionDesc: 'Apoyo' },
          { id: 'P3', label: 'C1', role: 'Cortador 1', team: 'offense', x: 58, y: 30, actionDesc: 'Asistente' },
          { id: 'P4', label: 'C2', role: 'Cortador 2', team: 'offense', x: 88, y: 40, actionDesc: '¡Anotación!' },
          { id: 'P5', label: 'C3', role: 'Cortador 3', team: 'offense', x: 86, y: 65, actionDesc: 'Celebrando' },
          { id: 'D1', label: 'D1', role: 'Defensa 1', team: 'defense', x: 44, y: 45, actionDesc: 'Fin de punto' },
          { id: 'D2', label: 'D2', role: 'Defensa 2', team: 'defense', x: 64, y: 34, actionDesc: 'Fin de punto' },
          { id: 'D3', label: 'D3', role: 'Defensa 3', team: 'defense', x: 86, y: 44, actionDesc: 'Fin de punto' },
        ]
      }
    ]
  }
}

interface TacticalBoardProps {
  play: PlayItem
  onClose?: () => void
  isModal?: boolean
}

export default function TacticalBoard({ play, onClose, isModal = false }: TacticalBoardProps) {
  const schema = useMemo(() => getTacticalSchemaForPlay(play), [play])
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [speed, setSpeed] = useState<number>(1) // 0.5x, 1x, 1.5x, 2x
  const [selectedPlayer, setSelectedPlayer] = useState<TacticalPlayer | null>(null)
  const [activeTab, setActiveTab] = useState<'board' | 'guide' | 'mistakes' | 'content'>('board')
  const [isExporting, setIsExporting] = useState(false)
  const timerRef = useRef<any>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  const currentPhase = schema.phases[currentPhaseIndex] || schema.phases[0]

  const exportAsPng = async () => {
    if (!boardRef.current) return
    setIsExporting(true)
    try {
      const html2canvasModule = await import('html2canvas')
      const html2canvas = html2canvasModule.default || html2canvasModule
      const canvas = await html2canvas(boardRef.current, {
        backgroundColor: '#064e3b',
        scale: 2,
      })
      const link = document.createElement('a')
      link.download = `${schema.id || 'jugada'}_paso_${currentPhase.phaseNumber}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error('Error exporting play png:', e)
    } finally {
      setIsExporting(false)
    }
  }

  // Auto animation cycle
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    const intervalMs = Math.round(3200 / speed)
    timerRef.current = setInterval(() => {
      setCurrentPhaseIndex(prev => (prev + 1) % schema.phases.length)
    }, intervalMs)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, speed, schema.phases.length])

  // Reset phase when play changes
  useEffect(() => {
    setCurrentPhaseIndex(0)
    setSelectedPlayer(null)
  }, [play.id])

  const nextPhase = () => {
    setIsPlaying(false)
    setCurrentPhaseIndex(prev => (prev + 1) % schema.phases.length)
  }

  const prevPhase = () => {
    setIsPlaying(false)
    setCurrentPhaseIndex(prev => (prev - 1 + schema.phases.length) % schema.phases.length)
  }

  const jumpToPhase = (index: number) => {
    setIsPlaying(false)
    setCurrentPhaseIndex(index)
  }

  return (
    <div id="tactical-board-root" className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-indigo-900">
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            play.category === 'OFFENSE' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
            play.category === 'DEFENSE' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
            'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}>
            {play.category === 'OFFENSE' ? '⚡ Ofensiva' : play.category === 'DEFENSE' ? '🛡️ Defensiva' : '🎯 Drill / Ejercicio'}
          </span>
          <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">{schema.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Speed Toggle */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700 text-xs">
            {[0.5, 1, 1.5, 2].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 rounded font-medium transition-colors ${speed === s ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                title={`Velocidad ${s}x`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Export PNG Button */}
          <button
            onClick={exportAsPng}
            disabled={isExporting}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
            title="Descargar diagrama de la jugada en imagen PNG"
          >
            <span>{isExporting ? '⏳ Generando...' : '📸 Exportar PNG'}</span>
          </button>

          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors" title="Cerrar pizarra">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-slate-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between overflow-x-auto gap-2 text-xs sm:text-sm font-medium text-gray-700">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('board')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'board' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'hover:bg-gray-200 text-gray-600'}`}
          >
            🥏 Simulador Animado
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'guide' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'hover:bg-gray-200 text-gray-600'}`}
          >
            📋 Roles & Guía Táctica
          </button>
          <button
            onClick={() => setActiveTab('mistakes')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'mistakes' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'hover:bg-gray-200 text-gray-600'}`}
          >
            ⚠️ Claves & Errores
          </button>
          {play.content && (
            <button
              onClick={() => setActiveTab('content')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'content' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'hover:bg-gray-200 text-gray-600'}`}
            >
              📝 Notas de Pizarra
            </button>
          )}
        </div>

        <div className="text-xs text-gray-500 font-normal hidden md:block">
          {schema.idealConditions}
        </div>
      </div>

      {/* Main Interactive Body */}
      <div className="p-4 sm:p-6 space-y-4">
        {activeTab === 'board' && (
          <div className="space-y-4">
            {/* Tactical Field Visualizer Canvas */}
            <div ref={boardRef} className="relative w-full aspect-[2/1] sm:aspect-[2.2/1] max-h-[460px] bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-800 rounded-2xl border-4 border-emerald-900/60 shadow-inner overflow-hidden select-none">
              
              {/* Field Grass Texture and Grid Lines */}
              <div className="absolute inset-0 opacity-15 pointer-events-none" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #ffffff 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #ffffff 20px)',
                backgroundSize: '20px 20px'
              }} />

              {/* Endzones & Boundary Lines */}
              {/* Left Endzone (Defending) */}
              <div className="absolute left-0 top-0 bottom-0 w-[14%] bg-emerald-900/40 border-r-2 border-dashed border-white/70 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] sm:text-xs font-black text-white/50 tracking-widest -rotate-90 uppercase">Endzone Def</span>
              </div>

              {/* Right Endzone (Scoring Goal) */}
              <div className="absolute right-0 top-0 bottom-0 w-[14%] bg-amber-500/20 border-l-2 border-dashed border-amber-300/80 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] sm:text-xs font-black text-amber-200/70 tracking-widest rotate-90 uppercase">Zona de Gol 🎯</span>
              </div>

              {/* Field Center Marker & Brick Marks */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/20 pointer-events-none flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
              </div>
              <div className="absolute left-[30%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/50 rotate-45 pointer-events-none" title="Brick Mark" />
              <div className="absolute left-[70%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/50 rotate-45 pointer-events-none" title="Brick Mark" />

              {/* Movement Trajectory Trails (SVG Layer) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <defs>
                  <marker id="arrow-pass" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#fef08a" />
                  </marker>
                  <marker id="arrow-cut" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#60a5fa" />
                  </marker>
                </defs>

                {/* Player Movement Trails */}
                {currentPhase.movementTrails?.map((trail, idx) => (
                  <line
                    key={`trail-${idx}`}
                    x1={`${trail.from.x}%`}
                    y1={`${trail.from.y}%`}
                    x2={`${trail.to.x}%`}
                    y2={`${trail.to.y}%`}
                    stroke="#93c5fd"
                    strokeWidth="2.5"
                    strokeDasharray="4,4"
                    strokeLinecap="round"
                    markerEnd="url(#arrow-cut)"
                    className="transition-all duration-700 ease-in-out opacity-80"
                  />
                ))}

                {/* Pass Trajectory Line */}
                {currentPhase.passTrajectory && (
                  <path
                    d={`M ${currentPhase.passTrajectory.from.x * 0.01 * 100} ${currentPhase.passTrajectory.from.y * 0.01 * 100} Q ${(currentPhase.passTrajectory.from.x + currentPhase.passTrajectory.to.x) / 2} ${(currentPhase.passTrajectory.from.y + currentPhase.passTrajectory.to.y) / 2 - (currentPhase.passTrajectory.isHigh ? 15 : 4)} ${currentPhase.passTrajectory.to.x} ${currentPhase.passTrajectory.to.y}`}
                    fill="none"
                    stroke="#fde047"
                    strokeWidth="3"
                    strokeDasharray="6,4"
                    markerEnd="url(#arrow-pass)"
                    className="transition-all duration-700 ease-in-out drop-shadow-md animate-pulse"
                  />
                )}
              </svg>

              {/* Animated Flying Frisbee Disc 🥏 */}
              <div
                className="absolute z-30 transition-all duration-700 ease-in-out -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  left: `${currentPhase.discPosition.x}%`,
                  top: `${currentPhase.discPosition.y}%`,
                }}
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white shadow-lg border-2 border-yellow-300 ring-4 ring-yellow-400/40 flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }}>
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  </div>
                  <span className="absolute -top-4 bg-slate-900/90 text-yellow-300 text-[9px] font-bold px-1 rounded shadow whitespace-nowrap">
                    DISCO 🥏
                  </span>
                </div>
              </div>

              {/* Interactive Player Nodes */}
              {currentPhase.players.map(player => {
                const isOffense = player.team === 'offense'
                const isHolding = currentPhase.holdingPlayerId === player.id
                const isTarget = currentPhase.passingToPlayerId === player.id
                const isSelected = selectedPlayer?.id === player.id

                return (
                  <button
                    key={player.id}
                    onClick={() => setSelectedPlayer(player)}
                    title={`${player.role}: ${player.actionDesc || ''}`}
                    className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-in-out group cursor-pointer focus:outline-none`}
                    style={{
                      left: `${player.x}%`,
                      top: `${player.y}%`,
                    }}
                  >
                    <div className="relative flex flex-col items-center">
                      {/* Player Circle Chip */}
                      <div
                        className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-[11px] sm:text-xs shadow-md border-2 transition-all duration-300 ${
                          isOffense
                            ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-200 shadow-blue-900/40'
                            : 'bg-rose-600 hover:bg-rose-500 text-white border-rose-200 shadow-rose-900/40'
                        } ${isHolding ? 'ring-4 ring-yellow-400 scale-110' : ''} ${
                          isTarget ? 'ring-4 ring-cyan-300 scale-110 animate-bounce' : ''
                        } ${isSelected ? 'ring-4 ring-white scale-125' : ''}`}
                      >
                        {player.label}
                      </div>

                      {/* Small Role Label */}
                      <span className="mt-0.5 px-1 py-0.2 bg-slate-950/80 text-white text-[8px] sm:text-[9px] font-semibold rounded shadow-sm whitespace-nowrap opacity-90 group-hover:opacity-100">
                        {player.role.split(' ')[0]}
                      </span>

                      {/* Quick Interactive Hover Tooltip */}
                      {isSelected && (
                        <div className="absolute bottom-full mb-1 z-40 bg-slate-900 text-white p-2 rounded-lg shadow-xl text-xs w-36 text-center border border-indigo-400 pointer-events-none">
                          <div className="font-bold text-indigo-300">{player.role}</div>
                          <div className="text-[10px] text-gray-300 mt-0.5">{player.actionDesc}</div>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Timeline Progress Scrubber */}
            <div className="flex items-center gap-3 px-3 py-2 bg-slate-100/90 rounded-xl border border-slate-200 text-xs">
              <span className="font-black text-slate-500 uppercase text-[10px] tracking-wider whitespace-nowrap">Línea de Tiempo:</span>
              <input
                type="range"
                min={0}
                max={schema.phases.length - 1}
                value={currentPhaseIndex}
                onChange={e => jumpToPhase(Number(e.target.value))}
                className="flex-1 accent-indigo-600 cursor-pointer h-2 bg-slate-300 rounded-lg"
              />
              <span className="font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md whitespace-nowrap">
                Paso {currentPhaseIndex + 1} de {schema.phases.length}
              </span>
            </div>

            {/* Playback Controls & Synchronized Phase Selector */}
            <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Play / Step Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(p => !p)}
                  className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow transition-all ${
                    isPlaying
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {isPlaying ? '⏸️ Pausar' : '▶️ Reproducir'}
                </button>
                <button
                  onClick={prevPhase}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 text-sm font-semibold transition-colors"
                  title="Fase anterior"
                >
                  ⏮️ Anterior
                </button>
                <button
                  onClick={nextPhase}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 text-sm font-semibold transition-colors"
                  title="Siguiente fase"
                >
                  Siguiente ⏭️
                </button>
              </div>

              {/* Synchronized Phase Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {schema.phases.map((ph, idx) => (
                  <button
                    key={ph.phaseNumber}
                    onClick={() => jumpToPhase(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      currentPhaseIndex === idx
                        ? 'bg-indigo-600 text-white shadow-md scale-105'
                        : 'bg-white hover:bg-gray-200 text-gray-700 border border-gray-200'
                    }`}
                  >
                    Paso {ph.phaseNumber}: {ph.title.split(':')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Phase Explanatory Card */}
            <div className="bg-gradient-to-r from-indigo-50/70 via-blue-50/70 to-slate-50 p-4 sm:p-5 rounded-2xl border border-indigo-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                  Explicación del Paso {currentPhase.phaseNumber}
                </span>
                <span className="text-xs text-gray-500">
                  {currentPhaseIndex + 1} de {schema.phases.length} pasos
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-bold text-gray-900">{currentPhase.title}</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{currentPhase.tacticalNotes}</p>
              
              {currentPhase.keyTips?.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-2">
                  {currentPhase.keyTips.map((tip, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 text-xs bg-white text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg shadow-2xs font-medium">
                      💡 {tip}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Key Positions & Tactical Roles */}
        {activeTab === 'guide' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {schema.keyPositions.map((pos, idx) => (
                <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-indigo-300 transition-colors">
                  <div className="flex items-center gap-2 font-bold text-gray-900 text-sm mb-1">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    {pos.role}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 pl-8 leading-relaxed">
                    {pos.responsibility}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <h5 className="font-bold text-amber-900 text-sm mb-1 flex items-center gap-2">
                🎯 ¿Cuándo usar esta jugada?
              </h5>
              <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                {schema.idealConditions}
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Common Mistakes & Counters */}
        {activeTab === 'mistakes' && (
          <div className="space-y-4">
            <div className="bg-rose-50 rounded-xl p-4 border border-rose-200 space-y-2">
              <h5 className="font-bold text-rose-900 text-sm flex items-center gap-2">
                ❌ Errores Comunes en la Ejecución
              </h5>
              <ul className="space-y-1.5 text-xs sm:text-sm text-rose-800 list-disc list-inside">
                {schema.commonMistakes.map((mistake, idx) => (
                  <li key={idx} className="leading-relaxed">{mistake}</li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 space-y-1">
              <h5 className="font-bold text-blue-900 text-sm">
                🛡️ ¿Cómo contrarrestarla si la juega el rival?
              </h5>
              <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
                {schema.counteredBy}
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Markdown Content */}
        {activeTab === 'content' && play.content && (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 prose max-w-none text-sm text-gray-800 whitespace-pre-wrap">
            {play.content}
          </div>
        )}
      </div>
    </div>
  )
}
