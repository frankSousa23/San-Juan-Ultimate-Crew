import request from 'supertest'
import { app } from './app.js'
import { prisma } from './tests/setup.js'
import bcrypt from 'bcryptjs'

const AUTH_ON = String(process.env.AUTH_REQUIRED || 'false').toLowerCase() === 'true'

describe('Roles and Permissions - Functional Tests', () => {
  let adminToken: string | null = null
  let playerToken: string | null = null
  let guestToken: string | null = null
  let adminUser: any = null
  let playerUser: any = null
  let guestUser: any = null

  beforeAll(async () => {
    if (!AUTH_ON) {
      console.log('⚠️  AUTH_REQUIRED is false, skipping auth tests')
      return
    }

    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' })
    if (adminLogin.status === 200) {
      adminToken = adminLogin.body.token
      adminUser = adminLogin.body.user
    }

    // Login as player
    const playerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'player@example.com', password: 'admin123' })
    if (playerLogin.status === 200) {
      playerToken = playerLogin.body.token
      playerUser = playerLogin.body.user
    }

    // Login as guest
    const guestLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'guest@example.com', password: 'admin123' })
    if (guestLogin.status === 200) {
      guestToken = guestLogin.body.token
      guestUser = guestLogin.body.user
    }
  })

  describe('User Authentication and Roles', () => {
    it('admin should login successfully', async () => {
      if (!AUTH_ON) return
      expect(adminToken).toBeTruthy()
      expect(adminUser).toBeTruthy()
      // Verificar que roles existe y es un array
      expect(Array.isArray(adminUser.roles)).toBe(true)
      // Admin debe tener al menos el rol 'admin'
      expect(adminUser.roles).toContain('admin')
    })

    it('player should login successfully', async () => {
      if (!AUTH_ON) return
      expect(playerToken).toBeTruthy()
      expect(playerUser).toBeTruthy()
      // Verificar que roles existe y es un array
      expect(Array.isArray(playerUser.roles)).toBe(true)
      // Player debe tener al menos el rol 'player'
      expect(playerUser.roles).toContain('player')
    })

    it('guest should login successfully', async () => {
      if (!AUTH_ON) return
      expect(guestToken).toBeTruthy()
      expect(guestUser).toBeTruthy()
      // Verificar que roles existe y es un array
      expect(Array.isArray(guestUser.roles)).toBe(true)
      // Guest debe tener al menos el rol 'guest'
      expect(guestUser.roles).toContain('guest')
    })
  })

  describe('Events Routes Protection', () => {
    let eventId: number | null = null

    it('GET /api/events should be public (read-only)', async () => {
      const res = await request(app).get('/api/events')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('POST /api/events should require admin role', async () => {
      if (!AUTH_ON || !adminToken) {
        console.log('Skipping: AUTH_ON=', AUTH_ON, 'adminToken=', !!adminToken)
        return
      }
      
      // Debug: Verificar token y usuario
      if (adminUser) {
        console.log('Admin user roles:', adminUser.roles)
      }
      
      // Admin should succeed
      const adminRes = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Event',
          type: 'TRAINING',
          startsAt: new Date().toISOString(),
        })
      
      if (adminRes.status !== 201) {
        console.log('Admin POST /api/events failed:', adminRes.status, adminRes.body)
      }
      
      expect(adminRes.status).toBe(201)
      eventId = adminRes.body.id

      // Player should fail
      if (playerToken) {
        const playerRes = await request(app)
          .post('/api/events')
          .set('Authorization', `Bearer ${playerToken}`)
          .send({
            title: 'Test Event Player',
            type: 'TRAINING',
            startsAt: new Date().toISOString(),
          })
        expect(playerRes.status).toBe(403)
      }

      // Guest should fail
      if (guestToken) {
        const guestRes = await request(app)
          .post('/api/events')
          .set('Authorization', `Bearer ${guestToken}`)
          .send({
            title: 'Test Event Guest',
            type: 'TRAINING',
            startsAt: new Date().toISOString(),
          })
        expect(guestRes.status).toBe(403)
      }
    })

    it('PUT /api/events/:id should require admin role', async () => {
      if (!AUTH_ON || !eventId || !adminToken) return

      // Admin should succeed
      const adminRes = await request(app)
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Event' })
      expect(adminRes.status).toBe(200)

      // Player should fail
      if (playerToken) {
        const playerRes = await request(app)
          .put(`/api/events/${eventId}`)
          .set('Authorization', `Bearer ${playerToken}`)
          .send({ title: 'Updated Event Player' })
        expect(playerRes.status).toBe(403)
      }
    })

    it('DELETE /api/events/:id should require admin role', async () => {
      if (!AUTH_ON || !eventId || !adminToken) return

      // Player should fail
      if (playerToken) {
        const playerRes = await request(app)
          .delete(`/api/events/${eventId}`)
          .set('Authorization', `Bearer ${playerToken}`)
        expect(playerRes.status).toBe(403)
      }

      // Admin should succeed
      const adminRes = await request(app)
        .delete(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(adminRes.status).toBe(204)
      eventId = null
    })
  })

  describe('Rivals Routes Protection', () => {
    let rivalId: number | null = null

    it('GET /api/rivals should be public', async () => {
      const res = await request(app).get('/api/rivals')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('POST /api/rivals should require admin role', async () => {
      if (!AUTH_ON || !adminToken) return

      // Admin should succeed
      const adminRes = await request(app)
        .post('/api/rivals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Rival' })
      expect(adminRes.status).toBe(201)
      rivalId = adminRes.body.id

      // Player should fail
      if (playerToken) {
        const playerRes = await request(app)
          .post('/api/rivals')
          .set('Authorization', `Bearer ${playerToken}`)
          .send({ name: 'Test Rival Player' })
        expect(playerRes.status).toBe(403)
      }
    })

    it('DELETE /api/rivals/:id should require admin role', async () => {
      if (!AUTH_ON || !rivalId || !adminToken) return

      // Player should fail
      if (playerToken) {
        const playerRes = await request(app)
          .delete(`/api/rivals/${rivalId}`)
          .set('Authorization', `Bearer ${playerToken}`)
        expect(playerRes.status).toBe(403)
      }

      // Admin should succeed
      const adminRes = await request(app)
        .delete(`/api/rivals/${rivalId}`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(adminRes.status).toBe(204)
      rivalId = null
    })
  })

  describe('Injuries Routes Protection', () => {
    let injuryId: number | null = null
    let testPlayer: any = null

    beforeAll(async () => {
      if (AUTH_ON) {
        testPlayer = await prisma.player.create({
          data: {
            name: 'Test Player for Injury',
            number: Math.floor(1000 + Math.random() * 9000),
            position: 'HANDLER',
            status: 'ACTIVE',
          },
        })
      }
    })

    it('GET /api/injuries should be public', async () => {
      const res = await request(app).get('/api/injuries')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('POST /api/injuries should require admin role', async () => {
      if (!AUTH_ON || !adminToken || !testPlayer) return

      // Admin should succeed
      const adminRes = await request(app)
        .post('/api/injuries')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          playerId: testPlayer.id,
          type: 'Ankle Sprain',
          severity: 'MILD',
          startDate: new Date().toISOString(),
        })
      expect(adminRes.status).toBe(201)
      injuryId = adminRes.body.id

      // Player should fail
      if (playerToken) {
        const playerRes = await request(app)
          .post('/api/injuries')
          .set('Authorization', `Bearer ${playerToken}`)
          .send({
            playerId: testPlayer.id,
            type: 'Knee Injury',
            severity: 'MODERATE',
            startDate: new Date().toISOString(),
          })
        expect(playerRes.status).toBe(403)
      }
    })

    it('DELETE /api/injuries/:id should require admin role', async () => {
      if (!AUTH_ON || !injuryId || !adminToken) return

      // Player should fail
      if (playerToken) {
        const playerRes = await request(app)
          .delete(`/api/injuries/${injuryId}`)
          .set('Authorization', `Bearer ${playerToken}`)
        expect(playerRes.status).toBe(403)
      }

      // Admin should succeed
      const adminRes = await request(app)
        .delete(`/api/injuries/${injuryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(adminRes.status).toBe(204)
      injuryId = null
    })

    afterAll(async () => {
      if (testPlayer) {
        await prisma.player.delete({ where: { id: testPlayer.id } }).catch(() => {})
      }
    })
  })

  describe('Plays Routes Protection', () => {
    let playId: number | null = null

    it('GET /api/plays should be public', async () => {
      const res = await request(app).get('/api/plays')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('POST /api/plays should require admin role', async () => {
      if (!AUTH_ON || !adminToken) return

      // Admin should succeed
      const adminRes = await request(app)
        .post('/api/plays')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Play',
          category: 'OFFENSE',
        })
      expect(adminRes.status).toBe(201)
      playId = adminRes.body.id

      // Player should fail
      if (playerToken) {
        const playerRes = await request(app)
          .post('/api/plays')
          .set('Authorization', `Bearer ${playerToken}`)
          .send({
            name: 'Test Play Player',
            category: 'DEFENSE',
          })
        expect(playerRes.status).toBe(403)
      }
    })

    it('DELETE /api/plays/:id should require admin role', async () => {
      if (!AUTH_ON || !playId || !adminToken) return

      // Player should fail
      if (playerToken) {
        const playerRes = await request(app)
          .delete(`/api/plays/${playId}`)
          .set('Authorization', `Bearer ${playerToken}`)
        expect(playerRes.status).toBe(403)
      }

      // Admin should succeed
      const adminRes = await request(app)
        .delete(`/api/plays/${playId}`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(adminRes.status).toBe(204)
      playId = null
    })
  })

  describe('Channels Routes Protection', () => {
    let channelId: number | null = null

    it('GET /api/channels should be public', async () => {
      const res = await request(app).get('/api/channels')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('POST /api/channels should allow admin and player', async () => {
      if (!AUTH_ON || !adminToken) return

      // Admin should succeed
      const adminRes = await request(app)
        .post('/api/channels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Channel Admin' })
      expect(adminRes.status).toBe(201)
      channelId = adminRes.body.id

      // Player should succeed
      if (playerToken) {
        const playerRes = await request(app)
          .post('/api/channels')
          .set('Authorization', `Bearer ${playerToken}`)
          .send({ name: 'Test Channel Player' })
        expect(playerRes.status).toBe(201)
        // Clean up player channel
        await prisma.channel.delete({ where: { id: playerRes.body.id } }).catch(() => {})
      }

      // Guest should fail
      if (guestToken) {
        const guestRes = await request(app)
          .post('/api/channels')
          .set('Authorization', `Bearer ${guestToken}`)
          .send({ name: 'Test Channel Guest' })
        expect(guestRes.status).toBe(403)
      }
    })

    afterAll(async () => {
      if (channelId) {
        await prisma.channel.delete({ where: { id: channelId } }).catch(() => {})
      }
    })
  })

  describe('Messages Routes Protection', () => {
    let channelId: number | null = null
    let messageId: number | null = null

    beforeAll(async () => {
      if (AUTH_ON && adminToken) {
        const channelRes = await request(app)
          .post('/api/channels')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Test Channel for Messages' })
        if (channelRes.status === 201) {
          channelId = channelRes.body.id
        }
      }
    })

    it('GET /api/messages should be public', async () => {
      if (!channelId) return
      const res = await request(app).get(`/api/messages?channelId=${channelId}`)
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('POST /api/messages should allow admin and player', async () => {
      if (!AUTH_ON || !channelId || !adminToken) return

      // Admin should succeed
      const adminRes = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          channelId,
          content: 'Test message from admin',
        })
      expect(adminRes.status).toBe(201)
      messageId = adminRes.body.id

      // Player should succeed
      if (playerToken) {
        const playerRes = await request(app)
          .post('/api/messages')
          .set('Authorization', `Bearer ${playerToken}`)
          .send({
            channelId,
            content: 'Test message from player',
          })
        expect(playerRes.status).toBe(201)
      }

      // Guest should fail
      if (guestToken) {
        const guestRes = await request(app)
          .post('/api/messages')
          .set('Authorization', `Bearer ${guestToken}`)
          .send({
            channelId,
            content: 'Test message from guest',
          })
        expect(guestRes.status).toBe(403)
      }
    })

    afterAll(async () => {
      if (channelId) {
        await prisma.channel.delete({ where: { id: channelId } }).catch(() => {})
      }
    })
  })

  describe('Attendance Routes Protection', () => {
    let eventId: number | null = null
    let playerId: number | null = null

    beforeAll(async () => {
      if (AUTH_ON && adminToken) {
        // Create test event
        const eventRes = await request(app)
          .post('/api/events')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Test Event for Attendance',
            type: 'TRAINING',
            startsAt: new Date().toISOString(),
          })
        if (eventRes.status === 201) {
          eventId = eventRes.body.id
        }

        // Get first player
        const playersRes = await request(app).get('/api/players')
        if (playersRes.status === 200 && playersRes.body.length > 0) {
          playerId = playersRes.body[0].id
        }
      }
    })

    it('GET /api/attendance should be public', async () => {
      if (!eventId) return
      const res = await request(app).get(`/api/attendance?eventId=${eventId}`)
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('PUT /api/attendance should require admin role', async () => {
      if (!AUTH_ON || !eventId || !playerId || !adminToken) return

      // Admin should succeed
      const adminRes = await request(app)
        .put('/api/attendance')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          eventId,
          playerId,
          status: 'present',
        })
      expect(adminRes.status).toBe(200)

      // Player should fail
      if (playerToken) {
        const playerRes = await request(app)
          .put('/api/attendance')
          .set('Authorization', `Bearer ${playerToken}`)
          .send({
            eventId,
            playerId,
            status: 'present',
          })
        expect(playerRes.status).toBe(403)
      }
    })

    afterAll(async () => {
      if (eventId) {
        await prisma.event.delete({ where: { id: eventId } }).catch(() => {})
      }
    })
  })

  describe('Resources Routes Protection', () => {
    it('GET /api/resources should be public', async () => {
      const res = await request(app).get('/api/resources')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('POST /api/resources should require admin role', async () => {
      if (!AUTH_ON || !adminToken) return

      // Admin should succeed
      const adminRes = await request(app)
        .post('/api/resources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Resource',
          url: 'https://example.com',
        })
      expect(adminRes.status).toBe(201)

      // Clean up
      if (adminRes.body.id) {
        await prisma.resource.delete({ where: { id: adminRes.body.id } }).catch(() => {})
      }

      // Player should fail
      if (playerToken) {
        const playerRes = await request(app)
          .post('/api/resources')
          .set('Authorization', `Bearer ${playerToken}`)
          .send({
            title: 'Test Resource Player',
            url: 'https://example.com',
          })
        expect(playerRes.status).toBe(403)
      }
    })
  })

  describe('Transactions Routes Protection', () => {
    it('GET /api/transactions should be public', async () => {
      const res = await request(app).get('/api/transactions')
      expect(res.status).toBe(200)
      // Transactions endpoint returns paginated format with items array
      expect(res.body).toHaveProperty('items')
      expect(Array.isArray(res.body.items)).toBe(true)
    })

    it('POST /api/transactions should require admin role', async () => {
      if (!AUTH_ON || !adminToken) return

      // Get first account
      const accountsRes = await request(app).get('/api/accounts')
      if (accountsRes.status !== 200 || accountsRes.body.length === 0) return
      const accountId = accountsRes.body[0].id

      // Admin should succeed
      const adminRes = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          accountId,
          type: 'INCOME',
          amountCents: 1000,
          occurredAt: new Date().toISOString(),
        })
      expect(adminRes.status).toBe(201)

      // Clean up
      if (adminRes.body.id) {
        await prisma.transaction.delete({ where: { id: adminRes.body.id } }).catch(() => {})
      }

      // Player should fail
      if (playerToken) {
        const playerRes = await request(app)
          .post('/api/transactions')
          .set('Authorization', `Bearer ${playerToken}`)
          .send({
            accountId,
            type: 'INCOME',
            amountCents: 1000,
            occurredAt: new Date().toISOString(),
          })
        expect(playerRes.status).toBe(403)
      }
    })
  })
})

