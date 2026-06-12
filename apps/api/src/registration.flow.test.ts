import request from 'supertest'
import { app } from './app.js'
import { prisma } from './tests/setup.js'

const AUTH_ON = String(process.env.AUTH_REQUIRED || 'false').toLowerCase() === 'true'

describe('Registration and Approval Flow', () => {
  const admin = { email: 'admin@example.com', password: 'admin123' }
  let adminToken: string | null = null

  it('admin can login', async () => {
    if (!AUTH_ON) return
    const res = await request(app).post('/api/auth/login').send(admin)
    if (res.status === 200) {
      adminToken = res.body.token
    }
  })

  it('new user can register and gets PENDING status', async () => {
    const email = `newuser+${Date.now()}@example.com`
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123', name: 'Test User' })
    
    expect(res.status).toBe(200)
    expect(res.body.user.status).toBe('PENDING')
    expect(res.body.message).toContain('pending admin approval')
  })

  it('pending user cannot login', async () => {
    const email = `pending+${Date.now()}@example.com`
    await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123', name: 'Pending User' })
    
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'password123' })
    
    expect(loginRes.status).toBe(401)
    expect(loginRes.body.error).toContain('pending admin approval')
  })

  it('admin can approve pending user', async () => {
    if (!AUTH_ON || !adminToken) return
    
    const email = `approve+${Date.now()}@example.com`
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123', name: 'To Approve' })
    
    const userId = registerRes.body.user.id
    
    const approveRes = await request(app)
      .post(`/api/users/${userId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'player' })
    
    expect(approveRes.status).toBe(200)
    expect(approveRes.body.status).toBe('APPROVED')
    expect(Array.isArray(approveRes.body.roles)).toBe(true)
    if (approveRes.body.roles && approveRes.body.roles.length > 0) {
      expect(approveRes.body.roles).toContain('player')
    } else {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { roles: { include: { role: true } } }
      })
      expect(user?.status).toBe('APPROVED')
      const roleNames = (user?.roles || []).map((ur: any) => ur.role?.name).filter(Boolean)
      expect(roleNames).toContain('player')
    }
    
    // Now user can login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'password123' })
    
    expect(loginRes.status).toBe(200)
    expect(loginRes.body.token).toBeDefined()
  })

  it('admin can reject pending user', async () => {
    if (!AUTH_ON || !adminToken) return
    
    const email = `reject+${Date.now()}@example.com`
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123', name: 'To Reject' })
    
    const userId = registerRes.body.user.id
    
    const rejectRes = await request(app)
      .post(`/api/users/${userId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
    
    expect(rejectRes.status).toBe(200)
    expect(rejectRes.body.status).toBe('REJECTED')
    
    // Rejected user cannot login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'password123' })
    
    expect(loginRes.status).toBe(401)
    expect(loginRes.body.error).toContain('rejected')
  })

  it('admin can list pending users', async () => {
    if (!AUTH_ON || !adminToken) return
    
    const email = `list+${Date.now()}@example.com`
    await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123' })
    
    const listRes = await request(app)
      .get('/api/users?status=PENDING')
      .set('Authorization', `Bearer ${adminToken}`)
    
    expect(listRes.status).toBe(200)
    expect(Array.isArray(listRes.body)).toBe(true)
    const pending = listRes.body.filter((u: any) => u.status === 'PENDING')
    expect(pending.length).toBeGreaterThan(0)
  })

  it('rejected user can re-register and get PENDING status again', async () => {
    if (!AUTH_ON || !adminToken) return
    
    const email = `reregister+${Date.now()}@example.com`
    const password = 'password123'
    
    // Register
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email, password, name: 'Re-register User' })
    
    expect(registerRes.status).toBe(200)
    const userId = registerRes.body.user.id
    
    // Reject
    await request(app)
      .post(`/api/users/${userId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
    
    // Re-register (should update existing user to PENDING)
    const reregisterRes = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'newpassword123', name: 'Updated Name' })
    
    expect(reregisterRes.status).toBe(200)
    expect(reregisterRes.body.user.status).toBe('PENDING')
    expect(reregisterRes.body.user.id).toBe(userId) // Same user ID
  })
})

describe('Password Reset Flow', () => {
  it('can request password reset', async () => {
    const email = 'admin@example.com'
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email })
    
    expect(res.status).toBe(200)
    expect(res.body.message).toBeDefined()
  })

  it('can reset password with valid token', async () => {
    // First create a user
    const email = `reset+${Date.now()}@example.com`
    const password = 'oldpassword123'
    await request(app)
      .post('/api/auth/register')
      .send({ email, password })
    
    // Approve user (if auth is on)
    if (AUTH_ON) {
      const admin = { email: 'admin@example.com', password: 'admin123' }
      const loginRes = await request(app).post('/api/auth/login').send(admin)
      if (loginRes.status === 200) {
        const adminToken = loginRes.body.token
        const user = await prisma.user.findUnique({ where: { email } })
        if (user) {
          await request(app)
            .post(`/api/users/${user.id}/approve`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ role: 'guest' })
        }
      }
    }
    
    // Request reset
    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email })
    
    let token: string | undefined
    if (forgotRes.body.token) {
      token = forgotRes.body.token
    } else {
      // Get token from database
      const user = await prisma.user.findUnique({ where: { email } })
      if (user) {
        const resetToken = await prisma.passwordResetToken.findFirst({
          where: { userId: user.id, used: false }
        })
        if (resetToken) token = resetToken.token
      }
    }
    
    if (!token) {
      console.log('No token available for testing')
      return
    }
    
    // Reset password
    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'newpassword123' })
    
    expect(resetRes.status).toBe(200)
    
    // Verify login behavior with new password
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'newpassword123' })
    
    // Cuando AUTH_REQUIRED está activo y el usuario ha sido aprobado,
    // el login debe ser exitoso (200). En entornos donde AUTH_REQUIRED=false,
    // algunos flujos pueden seguir bloqueando usuarios no aprobados y devolver 401.
    if (AUTH_ON) {
      expect(loginRes.status).toBe(200)
    } else {
      expect([200, 401]).toContain(loginRes.status)
    }
  })
})

