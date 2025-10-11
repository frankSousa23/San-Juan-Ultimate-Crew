import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const router = Router()
// Note: In some editor environments without Prisma type generation, direct access like prisma.resource may type-error.
// We'll use a locally casted reference to avoid false-positive type errors while keeping runtime behavior the same.
const db: any = prisma

// List with optional filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const q = req.query.q ? String(req.query.q).toLowerCase() : ''
    const category = req.query.category ? String(req.query.category) : undefined
    const where: any = {}
    if (category) where.category = category
  let items = await db.resource.findMany({ where, orderBy: { createdAt: 'desc' } })
    if (q) items = items.filter((r: any) => r.title.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q))
    res.json(items)
  } catch {
    res.status(500).json({ error: 'Failed to list resources' })
  }
})

// Distinct categories
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const rows = await db.resource.findMany({
      where: { NOT: [{ category: null }, { category: '' }] },
      distinct: ['category'],
      select: { category: true },
      orderBy: { category: 'asc' },
    })
    const categories = rows.map((r: any) => r.category).filter(Boolean)
    res.json(categories)
  } catch {
    res.status(500).json({ error: 'Failed to list categories' })
  }
})

// Paged listing
router.get('/paged', async (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined
    const category = typeof req.query.category === 'string' ? req.query.category : undefined
    const orderRaw = typeof req.query.order === 'string' ? req.query.order : undefined
    const order: 'createdAtDesc' | 'titleAsc' = orderRaw === 'titleAsc' ? 'titleAsc' : 'createdAtDesc'
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '20')) || 20, 1), 200)
    const offset = Math.max(parseInt(String(req.query.offset ?? '0')) || 0, 0)

    const where: any = {}
    if (category) where.category = category
    if (q && q.trim()) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }

    const orderBy: any = order === 'titleAsc'
      ? [{ title: 'asc' }, { id: 'asc' }]
      : [{ createdAt: 'desc' }, { id: 'desc' }]
    const [total, items] = await Promise.all([
      db.resource.count({ where }),
      db.resource.findMany({ where, orderBy, take: limit, skip: offset })
    ])
    res.json({ items, total, limit, offset })
  } catch (e) {
    res.status(500).json({ error: 'Failed to list resources (paged)' })
  }
})

// CSV export
router.get('/export', async (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined
    const category = typeof req.query.category === 'string' ? req.query.category : undefined
    const orderRaw = typeof req.query.order === 'string' ? req.query.order : undefined
    const order: 'createdAtDesc' | 'titleAsc' = orderRaw === 'titleAsc' ? 'titleAsc' : 'createdAtDesc'
    const where: any = {}
    if (category) where.category = category
    if (q && q.trim()) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }
    const orderBy: any = order === 'titleAsc'
      ? [{ title: 'asc' }, { id: 'asc' }]
      : [{ createdAt: 'desc' }, { id: 'desc' }]
    const items = await db.resource.findMany({ where, orderBy })
    const header = ['id','title','url','description','category','fileName','mimeType','size','storagePath','createdAt']
    const rows = items.map((r: any) => [
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
    // Prepend UTF-8 BOM for Excel compatibility
    const bom = '\uFEFF'
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="resources.csv"')
    res.send(bom + csv)
  } catch (e) {
    res.status(500).json({ error: 'Failed to export resources' })
  }
})

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  url: z.string().url().optional(),
  category: z.string().optional(),
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createSchema.parse(req.body)
    if (!data.url) return res.status(400).json({ error: 'url is required when no file is uploaded' })
  const created = await db.resource.create({ data })
    res.status(201).json(created)
  } catch (e: any) {
    if (e?.issues) return res.status(400).json({ error: 'Invalid payload', issues: e.issues })
    res.status(500).json({ error: 'Failed to create resource' })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' })
  try {
    const data = createSchema.partial().parse(req.body)
  const updated = await db.resource.update({ where: { id }, data })
    res.json(updated)
  } catch (e: any) {
    if (e?.code === 'P2025') return res.status(404).json({ error: 'Resource not found' })
    if (e?.issues) return res.status(400).json({ error: 'Invalid payload', issues: e.issues })
    res.status(500).json({ error: 'Failed to update resource' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' })
  try {
  const existing = await db.resource.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Resource not found' })
  await db.resource.delete({ where: { id } })
    if (existing.storagePath && existing.storagePath.startsWith('/uploads/')) {
      const filePath = path.resolve(process.cwd(), 'apps', 'api', existing.storagePath.replace(/^\//, ''))
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath) } catch { /* ignore */ }
    }
    res.status(204).send()
  } catch (e: any) {
    if (e?.code === 'P2025') return res.status(404).json({ error: 'Resource not found' })
    res.status(500).json({ error: 'Failed to delete resource' })
  }
})

// Bulk delete resources
router.post('/bulk-delete', async (req: Request, res: Response) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? (req.body.ids as any[]).map(n => Number(n)).filter(n => Number.isInteger(n)) : []
    if (ids.length === 0) return res.status(400).json({ error: 'ids is required (non-empty array of integers)' })
    const existing = await db.resource.findMany({ where: { id: { in: ids } }, select: { id: true, storagePath: true } })
    await db.resource.deleteMany({ where: { id: { in: ids } } })
    for (const r of existing) {
      if (r.storagePath && r.storagePath.startsWith('/uploads/')) {
        const filePath = path.resolve(process.cwd(), 'apps', 'api', r.storagePath.replace(/^\//, ''))
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath) } catch {}
      }
    }
  res.json({ deleted: existing.map((e: { id: number }) => e.id) })
  } catch (e) {
    res.status(500).json({ error: 'Failed to bulk delete resources' })
  }
})

export default router

// File uploads
const uploadsDir = path.resolve(process.cwd(), 'apps', 'api', 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => cb(null, uploadsDir),
  filename: (_req: any, file: any, cb: any) => {
    const ts = Date.now()
    const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_')
    cb(null, `${ts}-${safe}`)
  }
})
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME = new Set(['application/pdf','image/png','image/jpeg','image/gif','text/plain'])
const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req: any, file: any, cb: any) => {
    if (!ALLOWED_MIME.has(file.mimetype)) return cb(new Error('Unsupported file type'), false)
    cb(null, true)
  }
})

router.post('/upload', (req: Request, res: Response, next) => {
  upload.single('file')(req as any, res as any, (err?: any) => {
    if (err) {
      if (err.message === 'Unsupported file type') return res.status(400).json({ error: 'Tipo de archivo no soportado' })
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Archivo demasiado grande (máx 10MB)' })
      return res.status(400).json({ error: 'Error de subida', detail: String(err?.message || err) })
    }
    next()
  })
}, async (req: Request, res: Response) => {
  try {
    const file = (req as any).file as { originalname: string; mimetype: string; size: number; filename: string } | undefined
    const title = (req.body?.title as string) || (file?.originalname ?? 'Archivo')
    const description = (req.body?.description as string) || undefined
    const category = (req.body?.category as string) || undefined
    if (!file) return res.status(400).json({ error: 'file is required' })
    const created = await db.resource.create({ data: {
      title,
      description,
      category,
      url: undefined,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storagePath: `/uploads/${file.filename}`,
    }})
    res.status(201).json(created)
  } catch (e) {
    res.status(500).json({ error: 'Failed to upload file' })
  }
})
