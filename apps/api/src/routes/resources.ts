import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { requireRole } from './auth.js'
import type { Prisma } from '@prisma/client'

const router = Router()

type ResourceWhereInput = Prisma.ResourceWhereInput
type ResourceOrderByInput = Prisma.ResourceOrderByWithRelationInput | Prisma.ResourceOrderByWithRelationInput[]

router.get('/', async (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : undefined
    const category = typeof req.query.category === 'string' ? req.query.category : undefined
    
    const where: ResourceWhereInput = {}
    if (category) where.category = category
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }
    
    const items = await prisma.resource.findMany({ 
      where, 
      orderBy: { createdAt: 'desc' } 
    })
    res.json(items)
  } catch (error) {
    res.status(500).json({ error: 'Failed to list resources' })
  }
})

router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.resource.findMany({
      where: { 
        AND: [
          { category: { not: null } },
          { category: { not: '' } }
        ]
      },
      distinct: ['category'],
      select: { category: true },
      orderBy: { category: 'asc' },
    })
    const categories = rows.map(r => r.category).filter((cat): cat is string => Boolean(cat))
    res.json(categories)
  } catch {
    res.status(500).json({ error: 'Failed to list categories' })
  }
})

router.get('/paged', async (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : undefined
    const category = typeof req.query.category === 'string' ? req.query.category : undefined
    const orderRaw = typeof req.query.order === 'string' ? req.query.order : undefined
    const order: 'createdAtDesc' | 'titleAsc' = orderRaw === 'titleAsc' ? 'titleAsc' : 'createdAtDesc'
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '20')) || 20, 1), 200)
    const offset = Math.max(parseInt(String(req.query.offset ?? '0')) || 0, 0)

    const where: ResourceWhereInput = {}
    if (category) where.category = category
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }

    const orderBy: ResourceOrderByInput = order === 'titleAsc'
      ? [{ title: 'asc' }, { id: 'asc' }]
      : [{ createdAt: 'desc' }, { id: 'desc' }]
      
    const [total, items] = await Promise.all([
      prisma.resource.count({ where }),
      prisma.resource.findMany({ where, orderBy, take: limit, skip: offset })
    ])
    res.json({ items, total, limit, offset })
  } catch {
    res.status(500).json({ error: 'Failed to list resources (paged)' })
  }
})

router.get('/export', async (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : undefined
    const category = typeof req.query.category === 'string' ? req.query.category : undefined
    const orderRaw = typeof req.query.order === 'string' ? req.query.order : undefined
    const order: 'createdAtDesc' | 'titleAsc' = orderRaw === 'titleAsc' ? 'titleAsc' : 'createdAtDesc'
    
    const where: ResourceWhereInput = {}
    if (category) where.category = category
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }
    
    const orderBy: ResourceOrderByInput = order === 'titleAsc'
      ? [{ title: 'asc' }, { id: 'asc' }]
      : [{ createdAt: 'desc' }, { id: 'desc' }]
      
    const items = await prisma.resource.findMany({ where, orderBy })
    const header = ['id','title','url','description','category','fileName','mimeType','size','storagePath','createdAt']
    const rows = items.map(r => [
      r.id,
      JSON.stringify(r.title ?? ''),
      JSON.stringify(r.url ?? ''),
      JSON.stringify(r.description ?? ''),
      JSON.stringify(r.category ?? ''),
      JSON.stringify(r.fileName ?? ''),
      JSON.stringify(r.mimeType ?? ''),
      r.size ?? '',
      JSON.stringify(r.storagePath ?? ''),
      r.createdAt?.toISOString?.() ?? r.createdAt,
    ].join(','))
    const csv = [header.join(','), ...rows].join('\n')
    const bom = '\uFEFF'
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="resources.csv"')
    res.send(bom + csv)
  } catch {
    res.status(500).json({ error: 'Failed to export resources' })
  }
})

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  url: z.string().url().optional(),
  category: z.string().optional(),
})

router.post('/', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const data = createSchema.parse(req.body)
    if (!data.url) return res.status(400).json({ error: 'url is required when no file is uploaded' })
    const created = await prisma.resource.create({ data })
    res.status(201).json(created)
  } catch (error) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return res.status(400).json({ error: 'Invalid payload', issues: (error as z.ZodError).issues })
    }
    res.status(500).json({ error: 'Failed to create resource' })
  }
})

router.put('/:id', requireRole(['admin']), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' })
  try {
    const data = createSchema.partial().parse(req.body)
    const updated = await prisma.resource.update({ where: { id }, data })
    res.json(updated)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ error: 'Resource not found' })
    }
    if (error && typeof error === 'object' && 'issues' in error) {
      return res.status(400).json({ error: 'Invalid payload', issues: (error as z.ZodError).issues })
    }
    res.status(500).json({ error: 'Failed to update resource' })
  }
})

router.delete('/:id', requireRole(['admin']), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' })
  try {
    const existing = await prisma.resource.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Resource not found' })
    await prisma.resource.delete({ where: { id } })
    if (existing.storagePath && existing.storagePath.startsWith('/uploads/')) {
      const filePath = path.resolve(process.cwd(), 'apps', 'api', existing.storagePath.replace(/^\//, ''))
      try { 
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath) 
      } catch {
        // Ignore file deletion errors
      }
    }
    res.status(204).send()
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ error: 'Resource not found' })
    }
    res.status(500).json({ error: 'Failed to delete resource' })
  }
})

router.post('/bulk-delete', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const ids = Array.isArray(req.body?.ids) 
      ? req.body.ids.map((n: unknown) => Number(n)).filter((n: number) => Number.isInteger(n))
      : []
    if (ids.length === 0) {
      return res.status(400).json({ error: 'ids is required (non-empty array of integers)' })
    }
    const existing = await prisma.resource.findMany({ 
      where: { id: { in: ids } }, 
      select: { id: true, storagePath: true } 
    })
    await prisma.resource.deleteMany({ where: { id: { in: ids } } })
    for (const r of existing) {
      if (r.storagePath && r.storagePath.startsWith('/uploads/')) {
        const filePath = path.resolve(process.cwd(), 'apps', 'api', r.storagePath.replace(/^\//, ''))
        try { 
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath) 
        } catch {
          // Ignore file deletion errors
        }
      }
    }
    res.json({ deleted: existing.map(e => e.id) })
  } catch {
    res.status(500).json({ error: 'Failed to bulk delete resources' })
  }
})

const uploadsDir = path.resolve(process.cwd(), 'apps', 'api', 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

interface MulterFile {
  originalname: string
  mimetype: string
  size: number
  filename: string
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ts = Date.now()
    const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_')
    cb(null, `${ts}-${safe}`)
  }
})

const MAX_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME = new Set(['application/pdf','image/png','image/jpeg','image/gif','text/plain'])

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error('Unsupported file type'))
    }
    cb(null, true)
  }
})

router.post('/upload', requireRole(['admin']), (req: Request, res: Response, next: NextFunction) => {
  const multerHandler = upload.single('file')
  multerHandler(req, res, (err?: unknown) => {
    if (err) {
      const error = err as Error & { code?: string }
      if (error.message === 'Unsupported file type') {
        res.status(400).json({ error: 'Tipo de archivo no soportado' })
        return
      }
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'Archivo demasiado grande (máx 10MB)' })
        return
      }
      res.status(400).json({ error: 'Error de subida', detail: String(error?.message || error) })
      return
    }
    next()
  })
}, async (req: Request, res: Response) => {
  try {
    const file = (req as Request & { file?: MulterFile }).file
    const title = (req.body?.title as string) || (file?.originalname ?? 'Archivo')
    const description = (req.body?.description as string) || undefined
    const category = (req.body?.category as string) || undefined
    if (!file) return res.status(400).json({ error: 'file is required' })
    const created = await prisma.resource.create({ 
      data: {
        title,
        description,
        category,
        url: undefined,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storagePath: `/uploads/${file.filename}`,
      }
    })
    res.status(201).json(created)
  } catch {
    res.status(500).json({ error: 'Failed to upload file' })
  }
})

export default router
