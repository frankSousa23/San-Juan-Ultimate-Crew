import { describe, it, expect } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { app } from './app.js'
import { prisma } from './lib/prisma.js'
import { env } from './lib/env.js'

describe('End-to-End Data Flow Audit: Registration -> Approval -> Squad -> Convocatoria -> Annotations -> Stats', () => {
  let userToken: string
  let testUserId: number
  let testUserEmail: string
  let testPlayer1Id: number
  let testPlayer2Id: number
  let teamHomeId: number
  let teamAwayId: number
  let testEventId: number

  it('Step 1: User Registration produces a pending user', async () => {
    testUserEmail = `audit_user_${Date.now()}@sigedivo.club`
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testUserEmail,
        password: 'Password123!',
        name: 'Audited Athlete',
      })

    expect(res.status).toBe(200)
    expect(res.body.user).toBeDefined()
    expect(res.body.user.email).toBe(testUserEmail)
    expect(res.body.user.status).toBe('PENDING')
    testUserId = res.body.user.id
  })

  it('Step 2: Admin approves user and grants athlete and mesa roles', async () => {
    await prisma.user.update({
      where: { id: testUserId },
      data: { status: 'APPROVED' },
    })

    // Create user role for player
    const playerRole = await prisma.role.findFirst({ where: { name: 'player' } })
    if (playerRole) {
      await prisma.userRole.create({
        data: { userId: testUserId, roleId: playerRole.id }
      })
    }

    const updated = await prisma.user.findUnique({
      where: { id: testUserId },
      include: { roles: { include: { role: true } } }
    })
    expect(updated?.status).toBe('APPROVED')

    // Generate authenticated admin token (User 1 is system admin)
    const token = jwt.sign(
      { sub: '1', email: 'frankalfonso1988@gmail.com', roles: ['admin'] },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    )
    userToken = `Bearer ${token}`
    expect(userToken).toBeTruthy()
  })

  it('Step 3: Squad creation and Athlete assignment', async () => {
    // Create two internal squads for the club
    const squadHome = await prisma.team.create({
      data: {
        name: `Escuadra Blanca Audit ${Date.now()}`,
        color: '#FFFFFF',
        categories: 'OPEN',
      },
    })
    teamHomeId = squadHome.id

    const squadAway = await prisma.team.create({
      data: {
        name: `Escuadra Azul Audit ${Date.now()}`,
        color: '#1E40AF',
        categories: 'OPEN',
      },
    })
    teamAwayId = squadAway.id

    // Create Player 1 (linked to our registered user) in squadHome
    const p1 = await prisma.player.create({
      data: {
        name: 'Audited Player One',
        number: 42,
        position: 'HANDLER',
        status: 'ACTIVE',
        teamId: teamHomeId,
        userId: testUserId,
      },
    })
    testPlayer1Id = p1.id

    // Create Player 2 in squadAway
    const p2 = await prisma.player.create({
      data: {
        name: 'Audited Player Two',
        number: 99,
        position: 'CUTTER',
        status: 'ACTIVE',
        teamId: teamAwayId,
      },
    })
    testPlayer2Id = p2.id

    expect(p1.teamId).toBe(teamHomeId)
    expect(p2.teamId).toBe(teamAwayId)
  })

  it('Step 4: Intra-Club Fixture and Convocatoria assignment', async () => {
    const event = await prisma.event.create({
      data: {
        title: `Clásico Interno Blanca vs Azul ${Date.now()}`,
        type: 'MATCH',
        status: 'ONGOING',
        location: 'Cancha 1 - Complejo Deportivo',
        startsAt: new Date(),
        isInternalScrimmage: true,
        teamId: teamHomeId,
        awayTeamId: teamAwayId,
        officialAnnotatorId: testUserId,
      },
    })
    testEventId = event.id
    expect(event.isInternalScrimmage).toBe(true)

    // Assign Player 1 as HOME participant
    const ep1 = await prisma.eventParticipant.create({
      data: {
        eventId: testEventId,
        playerId: testPlayer1Id,
        teamSide: 'HOME',
        lineType: 'O-Line',
        status: 'confirmed',
      },
    })
    expect(ep1.teamSide).toBe('HOME')

    // Assign Player 2 as AWAY participant
    const ep2 = await prisma.eventParticipant.create({
      data: {
        eventId: testEventId,
        playerId: testPlayer2Id,
        teamSide: 'AWAY',
        lineType: 'D-Line',
        status: 'confirmed',
      },
    })
    expect(ep2.teamSide).toBe('AWAY')
  })

  it('Step 5: Live match scorekeeping annotations for both internal squads', async () => {
    const ann1 = await request(app)
      .post('/api/annotations')
      .set('Authorization', userToken)
      .send({
        eventId: testEventId,
        type: 'GOAL',
        playerId: testPlayer1Id,
        teamSide: 'HOME',
        scoreHome: 1,
        scoreAway: 0,
      })
    expect(ann1.status).toBe(201)

    // Player 1 also makes a defensive block
    const ann2 = await request(app)
      .post('/api/annotations')
      .set('Authorization', userToken)
      .send({
        eventId: testEventId,
        type: 'DEFENSE',
        playerId: testPlayer1Id,
        teamSide: 'HOME',
      })
    expect(ann2.status).toBe(201)

    // Player 2 scores for the Away squad
    const ann3 = await request(app)
      .post('/api/annotations')
      .set('Authorization', userToken)
      .send({
        eventId: testEventId,
        type: 'GOAL',
        playerId: testPlayer2Id,
        teamSide: 'AWAY',
        scoreHome: 1,
        scoreAway: 1,
      })
    expect(ann3.status).toBe(201)
  })

  it('Step 6: Statistics audit verifies individual attribution and data consistency', async () => {
    // Verify Player 1 stats (1 Goal, 1 Defense)
    const p1StatsRes = await request(app)
      .get(`/api/players/${testPlayer1Id}/stats`)
      .set('Authorization', userToken)
    expect(p1StatsRes.status).toBe(200)
    expect(p1StatsRes.body.goals).toBe(1)
    expect(p1StatsRes.body.defenses).toBe(1)

    // Verify Player 2 stats (1 Goal)
    const p2StatsRes = await request(app)
      .get(`/api/players/${testPlayer2Id}/stats`)
      .set('Authorization', userToken)
    expect(p2StatsRes.status).toBe(200)
    expect(p2StatsRes.body.goals).toBe(1)

    // Verify PlayerMatchStats records in database directly
    const pms1 = await prisma.playerMatchStats.findUnique({
      where: { playerId_eventId: { playerId: testPlayer1Id, eventId: testEventId } },
    })
    expect(pms1?.goals).toBe(1)
    expect(pms1?.defenses).toBe(1)
    expect(pms1?.teamSide).toBe('HOME')

    const pms2 = await prisma.playerMatchStats.findUnique({
      where: { playerId_eventId: { playerId: testPlayer2Id, eventId: testEventId } },
    })
    expect(pms2?.goals).toBe(1)
    expect(pms2?.teamSide).toBe('AWAY')

    // Clean up test records
    await prisma.eventAnnotation.deleteMany({ where: { eventId: testEventId } })
    await prisma.playerMatchStats.deleteMany({ where: { eventId: testEventId } })
    await prisma.eventParticipant.deleteMany({ where: { eventId: testEventId } })
    await prisma.event.delete({ where: { id: testEventId } })
    await prisma.player.delete({ where: { id: testPlayer1Id } })
    await prisma.player.delete({ where: { id: testPlayer2Id } })
    await prisma.team.delete({ where: { id: teamHomeId } })
    await prisma.team.delete({ where: { id: teamAwayId } })
    await prisma.user.delete({ where: { id: testUserId } })
  })
})
