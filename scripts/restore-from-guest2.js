import fs from 'fs';

let mockDb = fs.readFileSync('apps/api/src/lib/mockDb.ts', 'utf8');

function replaceArray(name, newContent) {
  const regex = new RegExp(`this\\.${name} = \\[[^\\]]*\\];`, 'm');
  mockDb = mockDb.replace(regex, `this.${name} = [\n${newContent}\n    ];`);
}

// Accounts
replaceArray('accounts', `      { id: 1, name: 'Caja Chica (Efectivo / USD)', type: 'CASH', balanceCents: 15000, description: 'Fondos en efectivo para hidratación, hielo y gastos menores de cancha.', createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
      { id: 2, name: 'Cuenta Bancaria / Pago Móvil / Zelle', type: 'BANK', balanceCents: 125000, description: 'Cuenta bancaria para cuotas mensuales de atletas, inscripciones y patrocinios.', createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') }`);
mockDb = mockDb.replace(/this\.nextId\['account'\] = \d+;/, "this.nextId['account'] = 3;");

// Categories
replaceArray('categories', `      { id: 1, name: 'Cuotas de Membresía Mensual', kind: 'INCOME', description: 'Pago de mensualidades y mantenimiento deportivo de atletas.', createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
      { id: 2, name: 'Venta de Discos Oficiales 175g', kind: 'INCOME', description: 'Venta de discos oficiales Discraft Ultra-Star de competencia.', createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
      { id: 3, name: 'Patrocinios y Donaciones', kind: 'INCOME', description: 'Aportes de aliados y patrocinadores del club.', createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
      { id: 4, name: 'Compra de Discos y Conos', kind: 'EXPENSE', description: 'Adquisición de material técnico reglamentario.', createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
      { id: 5, name: 'Hidratación y Primeros Auxilios', kind: 'EXPENSE', description: 'Botellones de agua, hielo, vendas y botiquín.', createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
      { id: 6, name: 'Inscripción a Torneo Nacional', kind: 'EXPENSE', description: 'Pago de Bid Fee y cuotas de participación en torneos.', createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') }`);
mockDb = mockDb.replace(/this\.nextId\['category'\] = \d+;/, "this.nextId['category'] = 7;");

// Transactions
replaceArray('transactions', `      { id: 1, type: 'INCOME', amountCents: 10000, description: 'Cobro de cuotas mensuales de atletas (Enero)', occurredAt: new Date(new Date().getTime() - 86400000 * 18).toISOString(), accountId: 2, categoryId: 1, createdBy: 1, createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
      { id: 2, type: 'INCOME', amountCents: 7500, description: 'Venta de 5 discos oficiales Discraft Ultra-Star 175g', occurredAt: new Date(new Date().getTime() - 86400000 * 12).toISOString(), accountId: 2, categoryId: 2, createdBy: 1, createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
      { id: 3, type: 'EXPENSE', amountCents: 12000, description: 'Compra de lote de 10 discos oficiales de competencia', occurredAt: new Date(new Date().getTime() - 86400000 * 10).toISOString(), accountId: 2, categoryId: 4, createdBy: 1, createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
      { id: 4, type: 'EXPENSE', amountCents: 1850, description: 'Agua potable y bolsas de hielo para entrenamiento de fin de semana', occurredAt: new Date(new Date().getTime() - 86400000 * 5).toISOString(), accountId: 1, categoryId: 5, createdBy: 1, createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') },
      { id: 5, type: 'EXPENSE', amountCents: 15000, description: 'Anticipo de Bid Fee - Copa Nacional de Ultimate Frisbee', occurredAt: new Date(new Date().getTime() - 86400000 * 3).toISOString(), accountId: 2, categoryId: 6, createdBy: 1, createdAt: new Date('2025-01-01T10:00:00Z'), updatedAt: new Date('2025-01-01T10:00:00Z') }`);
mockDb = mockDb.replace(/this\.nextId\['transaction'\] = \d+;/, "this.nextId['transaction'] = 6;");

// Plays
replaceArray('plays', `  { id: 301, title: 'Defensa Zonal 3-3-1 (La Copa)', category: 'DEFENSE', description: 'Formación clásica para contener avances rápidos y forzar pases altos. Tres marcadores forman la copa, tres en el medio campo (muros) y un profundo (deep).', createdAt: new Date('2025-01-08T10:00:00Z'), updatedAt: new Date('2025-01-08T10:00:00Z') },
  { id: 302, title: 'Ofensiva Stack Vertical (Ho-Stack)', category: 'OFFENSE', description: 'Alineación vertical para abrir espacios en los laterales (carriles). Ideal para equipos con cutters rápidos y lanzadores precisos.', createdAt: new Date('2025-01-08T10:00:00Z'), updatedAt: new Date('2025-01-08T10:00:00Z') },
  { id: 303, title: 'Ofensiva Stack Horizontal', category: 'OFFENSE', description: 'Disposición de 4 cutters en línea horizontal y 3 handlers. Genera aislamiento 1v1 y cortes profundos letales.', createdAt: new Date('2025-01-08T10:00:00Z'), updatedAt: new Date('2025-01-08T10:00:00Z') },
  { id: 304, title: 'Jugada de Set Play: Endzone Iso', category: 'PLAY', description: 'Jugada preparada cerca de la zona de anotación (red zone) para aislar al mejor saltador del equipo y asegurar el punto.', createdAt: new Date('2025-01-08T10:00:00Z'), updatedAt: new Date('2025-01-08T10:00:00Z') },
  { id: 305, title: 'Transición Defensiva (Turnover a Hombre)', category: 'TRANSITION', description: 'Protocolo de marcación inmediata hombre a hombre tras perder el disco, para evitar quiebres y tiros largos del equipo rival en los primeros 5 segundos. La prioridad es frenar el contraataque y que cada atleta identifique su marca asignada o aplique el principio de "closest man" para negar el pase profundo. Es vital recuperar la formación y organizar la defensa estructurada una vez detenido el impulso inicial.', createdAt: new Date('2025-01-08T10:00:00Z'), updatedAt: new Date('2025-01-08T10:00:00Z') },
  { id: 306, name: 'Drill de Lanzamientos con Presión (Dump-Swing)', category: 'DRILL', description: 'Ejercicio dinámico de 3 atletas para mecanizar pases en movimiento, cambio rápido de frente (swing) y desahogo con pivoteo bajo marca estricta.', createdAt: new Date('2025-01-08T10:00:00Z'), updatedAt: new Date('2025-01-08T10:00:00Z') }`);
mockDb = mockDb.replace(/this\.nextId\['play'\] = \d+;/, "this.nextId['play'] = 307;");

// Resources
replaceArray('resources', `  { id: 501, title: 'Reglamento Oficial de Ultimate WFDF 2021-2024 / 2025 (Español)', category: 'Reglamento y Normativas', description: 'Reglas oficiales de la World Flying Disc Federation: no contacto, stall count de 10s, autogestión de faltas y dimensiones de campo 100x37m.', url: 'https://rules.wfdf.sport/', fileName: 'Reglas_Oficiales_WFDF_Ultimate.pdf', size: 1850000, createdAt: new Date('2025-01-01T10:00:00Z') },
  { id: 502, title: 'Manual de Espíritu de Juego (Spirit of the Game - SOTG)', category: 'Espíritu de Juego', description: 'Criterios y rúbrica oficial de la WFDF para la puntuación SOTG: Conocimiento de reglas, faltas y contacto, imparcialidad, actitud positiva y comunicación.', url: 'https://wfdf.sport/organisation/spirit-of-the-game/', fileName: 'Guia_Oficial_Espiritu_de_Juego_SOTG.pdf', size: 920000, createdAt: new Date('2025-01-01T10:00:00Z') },
  { id: 503, title: 'Guía Oficial de Señales de Mano WFDF', category: 'Reglamento y Normativas', description: 'Señales gestuales universales de jugadores: In/Out, Falta, Pick, Travel, Stall Out, Delay y Gol.', url: 'https://rules.wfdf.sport/', fileName: 'Senales_de_Mano_WFDF.pdf', size: 1250000, createdAt: new Date('2025-01-01T10:00:00Z') },
  { id: 504, title: 'Manual Técnico de Lanzamientos Fundamentales', category: 'Entrenamiento Técnico', description: 'Mecánica de agarres y lanzamientos: Backhand (Revés), Forehand/Flick (Sidearm), Hammer (Martillo), Scoober y pivoteo con pie de apoyo.', url: 'https://wfdf.sport/', fileName: 'Manual_Lanzamientos_Ultimate.pdf', size: 2100000, createdAt: new Date('2025-01-01T10:00:00Z') },
  { id: 505, title: 'Guía de Nutrición e Hidratación para Torneos de Fin de Semana', category: 'Salud y Bienestar', description: 'Protocolos de recarga de electrolitos, ingesta calórica entre partidos consecutivos y prevención de calambres bajo calor intenso.', url: 'https://wfdf.sport/', fileName: 'Nutricion_e_Hidratacion_Ultimate.pdf', size: 780000, createdAt: new Date('2025-01-01T10:00:00Z') }`);
mockDb = mockDb.replace(/this\.nextId\['resource'\] = \d+;/, "this.nextId['resource'] = 506;");

// Injuries
replaceArray('injuries', `  { id: 401, playerId: 1, type: 'Esguince de Tobillo Grado II', severity: 'MODERATE', status: 'RECOVERING', startDate: new Date(new Date().getTime() - 86400000 * 12).toISOString(), endDate: new Date(new Date().getTime() + 86400000 * 10).toISOString(), description: 'Torcedura en aterrizaje de salto.', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 402, playerId: 1, type: 'Rotura de Ligamento Cruzado', severity: 'SEVERE', status: 'RECOVERING', startDate: new Date(new Date().getTime() - 86400000 * 45).toISOString(), description: 'Cirugía exitosa, en rehabilitación activa de 6 a 9 meses.', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 403, playerId: 1, type: 'Tendinitis Patelar', severity: 'MILD', status: 'HEALED', startDate: new Date(new Date().getTime() - 86400000 * 60).toISOString(), endDate: new Date(new Date().getTime() - 86400000 * 30).toISOString(), description: 'Rodilla del saltador, recuperado con reposo y fisioterapia.', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') },
  { id: 404, playerId: 1, type: 'Desgarro Isquiotibial', severity: 'MODERATE', status: 'RECOVERING', startDate: new Date(new Date().getTime() - 86400000 * 5).toISOString(), endDate: new Date(new Date().getTime() + 86400000 * 20).toISOString(), description: 'Ocurrido en una plancha defensiva. Reposo por 3 semanas.', createdAt: new Date('2025-01-10T10:00:00Z'), updatedAt: new Date('2025-01-10T10:00:00Z') }`);
mockDb = mockDb.replace(/this\.nextId\['injury'\] = \d+;/, "this.nextId['injury'] = 405;");

fs.writeFileSync('apps/api/src/lib/mockDb.ts', mockDb);
console.log('Restored correctly!');
