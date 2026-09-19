/**
 * ============================================================================
 * SIGEDIVO (Sistema de Gestión para el Disco Volador)
 * SERVICIO DE DATOS DE MUESTRA Y LIMPIEZA A BLANCO (apps/api/src/lib/sampleDataService.ts)
 * ============================================================================
 * 
 * Permite a cualquier persona que descargue y despliegue el proyecto:
 * 1. Explorar el sistema completo con información sencilla y realista de prueba
 *    (atletas, calendario, mesa técnica, estadísticas y finanzas).
 * 2. Limpiar todos los datos de prueba en 1 clic para empezar de cero con la
 *    información oficial de su club u organización deportiva.
 * ============================================================================
 */

export async function cleanSampleData(db: any): Promise<{ deletedCounts: Record<string, number> }> {
  const counts: Record<string, number> = {};

  // 1. Limpiar mesa técnica, estadísticas y eventos
  try {
    const rAnn = await db.eventAnnotation.deleteMany({});
    counts.eventAnnotations = rAnn?.count ?? 0;
  } catch (e) { counts.eventAnnotations = 0; }

  try {
    const rStats = await db.playerMatchStats.deleteMany({});
    counts.playerMatchStats = rStats?.count ?? 0;
  } catch (e) { counts.playerMatchStats = 0; }

  try {
    const rSpirit = await db.spiritScore.deleteMany({});
    counts.spiritScores = rSpirit?.count ?? 0;
  } catch (e) { counts.spiritScores = 0; }

  try {
    const rAtt = await db.attendance.deleteMany({});
    counts.attendances = rAtt?.count ?? 0;
  } catch (e) { counts.attendances = 0; }

  try {
    const rPart = await db.eventParticipant.deleteMany({});
    counts.eventParticipants = rPart?.count ?? 0;
  } catch (e) { counts.eventParticipants = 0; }

  try {
    const rEvents = await db.event.deleteMany({});
    counts.events = rEvents?.count ?? 0;
  } catch (e) { counts.events = 0; }

  // 2. Limpiar transacciones contables y resetear saldos de cuentas a 0
  try {
    const rTx = await db.transaction.deleteMany({});
    counts.transactions = rTx?.count ?? 0;
  } catch (e) { counts.transactions = 0; }

  try {
    await db.account.updateMany({ data: { balanceCents: 0 } });
  } catch (e) { /* ignore */ }

  // 3. Limpiar lesiones médicas
  try {
    const rInj = await db.injury.deleteMany({});
    counts.injuries = rInj?.count ?? 0;
  } catch (e) { counts.injuries = 0; }

  // 4. Desvincular perfiles de atleta en usuarios
  try {
    await db.user.updateMany({
      data: { playerId: null, teamId: null }
    });
  } catch (e) { /* ignore */ }

  // 5. Limpiar atletas del roster
  try {
    const rPlay = await db.player.deleteMany({});
    counts.players = rPlay?.count ?? 0;
  } catch (e) { counts.players = 0; }

  // 6. Limpiar noticias y publicaciones de prueba
  try {
    if (db.newsPostFile) {
      await db.newsPostFile.deleteMany({});
    }
    if (db.newsPost) {
      const rNews = await db.newsPost.deleteMany({});
      counts.news = rNews?.count ?? 0;
    }
  } catch (e) { counts.news = 0; }

  return { deletedCounts: counts };
}

export async function seedSampleData(db: any): Promise<void> {
  // Primero aseguramos limpieza previa para evitar duplicados
  await cleanSampleData(db);

  // 1. Obtener equipos base
  const teams = await db.team.findMany();
  const teamMap: Record<string, number> = {};
  teams.forEach((t: any) => {
    teamMap[t.name] = t.id;
  });

  const teamAId = teamMap['Equipo A'] || teams[0]?.id || 1;
  const teamBId = teamMap['Equipo B'] || teams[1]?.id || teamAId;
  const teamFemId = teamMap['Femenino'] || teams[2]?.id || teamAId;
  const teamMixId = teamMap['Mixto'] || teams[3]?.id || teamAId;

  // 2. Crear atletas de muestra del roster
  const sampleAthletes = [
    {
      name: 'Franco Sousa',
      number: 1,
      position: 'HANDLER',
      status: 'ACTIVE',
      heightCm: 182,
      experience: 'Capitán • Especialista en pase largo y pivote ofensivo',
      teamId: teamAId,
    },
    {
      name: 'Carlos Mendoza',
      number: 2,
      position: 'CUTTER',
      status: 'ACTIVE',
      heightCm: 185,
      experience: 'Capitán Ofensivo • Cortes profundos a la endzone',
      teamId: teamAId,
    },
    {
      name: 'Eduardo Silva',
      number: 3,
      position: 'HANDLER',
      status: 'ACTIVE',
      heightCm: 178,
      experience: 'Coach Táctico • Manejo de ritmo y desahogo de stall',
      teamId: teamAId,
    },
    {
      name: 'Alejandro Ramos',
      number: 4,
      position: 'HANDLER',
      status: 'ACTIVE',
      heightCm: 175,
      experience: 'Armador Línea O • Precisión en lanzamientos invertidos',
      teamId: teamBId,
    },
    {
      name: 'Gabriel Torres',
      number: 5,
      position: 'CUTTER',
      status: 'ACTIVE',
      heightCm: 188,
      experience: 'Cutter Titular • Gran salto vertical y recepción aérea',
      teamId: teamBId,
    },
    {
      name: 'Valentina Rojas',
      number: 10,
      position: 'HANDLER',
      status: 'ACTIVE',
      heightCm: 168,
      experience: 'Capitana Femenina • Visión de campo y rompimiento de marcas',
      teamId: teamFemId,
    },
    {
      name: 'Camila Pineda',
      number: 11,
      position: 'CUTTER',
      status: 'ACTIVE',
      heightCm: 172,
      experience: 'Cutter defensiva • Presión en media cancha y marcas asfixiantes',
      teamId: teamFemId,
    },
    {
      name: 'Mariana López',
      number: 14,
      position: 'CUTTER',
      status: 'ACTIVE',
      heightCm: 165,
      experience: 'Velocidad y resistencia • Cortes explosivos al break',
      teamId: teamMixId,
    },
  ];

  const createdPlayers: any[] = [];
  for (const athlete of sampleAthletes) {
    const player = await db.player.create({
      data: {
        ...athlete,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });
    createdPlayers.push(player);
  }

  // 3. Vincular atleta #1 al usuario admin si existe
  const adminUser = await db.user.findFirst({ where: { email: 'frankalfonso1988@gmail.com' } });
  if (adminUser && createdPlayers[0]) {
    await db.user.update({
      where: { id: adminUser.id },
      data: { playerId: createdPlayers[0].id, teamId: teamAId }
    });
  }

  // 4. Crear Eventos de Muestra
  const now = new Date();
  const pastDate = new Date(now.getTime() - 86400000 * 2); // Hace 2 días
  const futureDate = new Date(now.getTime() + 86400000 * 2); // En 2 días

  // Evento 1: Partido Amistoso Completado con Anotaciones
  const completedMatch = await db.event.create({
    data: {
      title: 'Amistoso Preparatorio vs Dragones Ultimate',
      type: 'MATCH',
      status: 'COMPLETED',
      location: 'Polideportivo Municipal - Cancha 1',
      startsAt: pastDate,
      endsAt: new Date(pastDate.getTime() + 7200000),
      teamId: teamAId,
      awayTeamId: teamBId,
      description: 'Partido preparatorio de pretemporada con registro completo de mesa técnica.',
      isAnnotatorLocked: true,
      matchCategory: 'GROUP_STAGE',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });

  // Evento 2: Entrenamiento Próximo Convocado
  const upcomingTraining = await db.event.create({
    data: {
      title: 'Entrenamiento Táctico de Manejo y Cortes (Stack Vertical)',
      type: 'TRAINING',
      status: 'UPCOMING',
      location: 'Cancha Central Universitaria',
      startsAt: futureDate,
      endsAt: new Date(futureDate.getTime() + 7200000),
      teamId: teamAId,
      description: 'Práctica intensiva de continuaciones ofensivas y defensa de zona cup 3-3-1.',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });

  // 5. Registrar participantes y asistencias
  for (let i = 0; i < Math.min(createdPlayers.length, 5); i++) {
    const p = createdPlayers[i];
    // Participante en el partido completado
    await db.eventParticipant.create({
      data: {
        eventId: completedMatch.id,
        playerId: p.id,
        role: i === 0 ? 'Capitán' : 'Titular',
        status: 'confirmed',
        lineType: i % 2 === 0 ? 'O-Line' : 'D-Line',
        teamSide: 'HOME',
      }
    });

    // Asistencia al partido
    await db.attendance.create({
      data: {
        eventId: completedMatch.id,
        playerId: p.id,
        status: 'present',
        confirmedAt: pastDate,
        createdAt: pastDate,
        updatedAt: pastDate,
      }
    });

    // Convocatoria y asistencia RSVP al entrenamiento próximo
    await db.attendance.create({
      data: {
        eventId: upcomingTraining.id,
        playerId: p.id,
        status: i === 4 ? 'tentative' : 'present',
        confirmedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });
  }

  // 6. Registrar Anotaciones de la Mesa Técnica para el Partido Completado
  const p1 = createdPlayers[0];
  const p2 = createdPlayers[1];
  const p3 = createdPlayers[2];

  if (p1 && p2 && p3) {
    const sampleAnnotations = [
      {
        eventId: completedMatch.id,
        type: 'GOAL',
        playerId: p1.id,
        assistPlayerId: p2.id,
        pointNumber: 1,
        teamScore: 1,
        opponentScore: 0,
        notes: 'Pase largo perfecto a la esquina izquierda de la endzone',
        createdAt: new Date(pastDate.getTime() + 600000),
      },
      {
        eventId: completedMatch.id,
        type: 'GOAL',
        playerId: p2.id,
        assistPlayerId: p3.id,
        pointNumber: 2,
        teamScore: 2,
        opponentScore: 0,
        notes: 'Corte frontal explosivo y recepción limpia',
        createdAt: new Date(pastDate.getTime() + 1200000),
      },
      {
        eventId: completedMatch.id,
        type: 'DEFENSE',
        playerId: p2.id,
        pointNumber: 3,
        teamScore: 2,
        opponentScore: 1,
        notes: 'Bloqueo aéreo decisivo en carril central',
        createdAt: new Date(pastDate.getTime() + 1800000),
      },
      {
        eventId: completedMatch.id,
        type: 'GOAL',
        playerId: p3.id,
        assistPlayerId: p1.id,
        pointNumber: 3,
        teamScore: 3,
        opponentScore: 1,
        notes: 'Transición rápida tras la recuperación del disco',
        createdAt: new Date(pastDate.getTime() + 2100000),
      },
      {
        eventId: completedMatch.id,
        type: 'GOAL',
        playerId: p1.id,
        assistPlayerId: p3.id,
        pointNumber: 4,
        teamScore: 4,
        opponentScore: 2,
        notes: 'Tiro de revés con comba sobre la marca contraria',
        createdAt: new Date(pastDate.getTime() + 2700000),
      },
      {
        eventId: completedMatch.id,
        type: 'GOAL',
        playerId: p2.id,
        assistPlayerId: p1.id,
        pointNumber: 5,
        teamScore: 5,
        opponentScore: 3,
        notes: 'Punto decisivo para sellar la victoria',
        createdAt: new Date(pastDate.getTime() + 3300000),
      },
    ];

    for (const ann of sampleAnnotations) {
      await db.eventAnnotation.create({ data: ann });
    }

    // Estadísticas agregadas por partido
    await db.playerMatchStats.create({
      data: {
        eventId: completedMatch.id,
        playerId: p1.id,
        goals: 2,
        assists: 2,
        defenses: 0,
        turnovers: 1,
        pointsPlayed: 5,
      }
    });

    await db.playerMatchStats.create({
      data: {
        eventId: completedMatch.id,
        playerId: p2.id,
        goals: 2,
        assists: 1,
        defenses: 1,
        turnovers: 0,
        pointsPlayed: 5,
      }
    });

    await db.playerMatchStats.create({
      data: {
        eventId: completedMatch.id,
        playerId: p3.id,
        goals: 1,
        assists: 2,
        defenses: 0,
        turnovers: 1,
        pointsPlayed: 5,
      }
    });

    // Espíritu de Juego (SOTG)
    await db.spiritScore.create({
      data: {
        eventId: completedMatch.id,
        rulesKnowledge: 4,
        foulsAndContact: 3,
        fairMindedness: 4,
        positiveAttitude: 4,
        communication: 4,
        comment: 'Excelente actitud deportiva y fluidez en resolución de llamadas.',
      }
    });
  }

  // 7. Configurar Finanzas y Transacciones Iniciales
  const accounts = await db.account.findMany();
  const cashAccount = accounts.find((a: any) => a.type === 'CASH') || accounts[0];
  const bankAccount = accounts.find((a: any) => a.type === 'BANK') || accounts[1] || cashAccount;

  const categories = await db.category.findMany();
  const catCuotas = categories.find((c: any) => c.name.includes('Cuotas')) || categories[0];
  const catDiscos = categories.find((c: any) => c.name.includes('Discos y Conos')) || categories[1];
  const catPatrocinio = categories.find((c: any) => c.name.includes('Patrocinios')) || categories[2];

  if (cashAccount && bankAccount && catCuotas && catDiscos && catPatrocinio) {
    const sampleTxs = [
      {
        accountId: bankAccount.id,
        categoryId: catCuotas.id,
        type: 'INCOME',
        amountCents: 12000, // $120.00
        description: 'Cuotas de membresía mensual atletas (Septiembre)',
        date: new Date(now.getTime() - 86400000 * 5),
      },
      {
        accountId: cashAccount.id,
        categoryId: catDiscos.id,
        type: 'EXPENSE',
        amountCents: 6500, // -$65.00
        description: 'Adquisición de discos oficiales Discraft 175g Ultra-Star',
        date: new Date(now.getTime() - 86400000 * 3),
      },
      {
        accountId: bankAccount.id,
        categoryId: catPatrocinio.id,
        type: 'INCOME',
        amountCents: 8000, // $80.00
        description: 'Aporte de patrocinador local para hidratación de torneo',
        date: new Date(now.getTime() - 86400000 * 1),
      },
      {
        accountId: cashAccount.id,
        categoryId: catCuotas.id,
        type: 'INCOME',
        amountCents: 12000, // $120.00
        description: 'Venta de discos de entrenamiento a nuevos aspirantes',
        date: now,
      }
    ];

    let cashDelta = 0;
    let bankDelta = 0;

    for (const tx of sampleTxs) {
      await db.transaction.create({ data: tx });
      const delta = tx.type === 'INCOME' ? tx.amountCents : -tx.amountCents;
      if (tx.accountId === cashAccount.id) {
        cashDelta += delta;
      } else {
        bankDelta += delta;
      }
    }

    // Actualizar saldos calculados
    await db.account.update({
      where: { id: cashAccount.id },
      data: { balanceCents: cashDelta }
    });

    if (bankAccount.id !== cashAccount.id) {
      await db.account.update({
        where: { id: bankAccount.id },
        data: { balanceCents: bankDelta }
      });
    }
  }

  // 8. Crear publicación de bienvenida
  if (db.newsPost && adminUser) {
    await db.newsPost.create({
      data: {
        title: '¡Bienvenidos a SIGEDIVO!',
        content: 'Plataforma integral para clubes y ligas de Ultimate Frisbee / Disco Volador. El sistema cuenta con estos datos de prueba para que explores todas las funcionalidades: Roster, Calendario, Mesa Técnica en Vivo, Estadísticas y Tesorería. Cuando desees comenzar con los atletas y torneos oficiales de tu club, puedes limpiar estos datos de prueba en 1 clic desde el panel de administración.',
        authorId: adminUser.id,
        targetTeamId: null, // Público para todo el club
        isPinned: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });
  }
}
