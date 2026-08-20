import rateLimit from 'express-rate-limit'

const feedbackRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { error: 'Demasiadas solicitudes de feedback. Por favor intenta de nuevo más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
})
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'
import { requireAuth } from './auth.js'

const router = Router()

const createFeedbackSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  category: z.string().min(1),
  message: z.string().min(1)
})

router.post('/', feedbackRateLimiter, async (req: any, res) => {
  try {
    const data = createFeedbackSchema.parse(req.body)
    
    // Attempt to extract userId if authenticated
    let userId = null
    try {
      if (req.user?.id) {
        userId = req.user.id
      }
    } catch (e) {}

    const feedback = await prisma.feedback.create({
      data: {
        ...data,
        userId
      }
    })

    res.status(201).json(feedback)
  } catch (error: any) {
    if (error.issues) {
      return res.status(400).json({ error: error.issues })
    }
    console.error('Create feedback error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Solo Admin puede ver feedback
router.get('/', requireAuth, async (req: any, res: any) => {
  try {
    if (!req.user?.roles?.includes('admin')) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const feedbacks = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })
    res.json(feedbacks)
  } catch (error) {
    console.error('List feedback error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export { router as feedbackRouter }
