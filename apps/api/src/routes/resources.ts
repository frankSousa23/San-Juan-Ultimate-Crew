import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma.js'
import { z } from 'zod'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { requireRole } from './auth.js'
import type { Prisma } from '@prisma/client'
import { createAuditHelper } from '../lib/audit.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { success, created, updated, deleted, paginated, validationError, notFound } from '../lib/response.js'

const router = Router()

type ResourceWhereInput = Prisma.ResourceWhereInput
type ResourceOrderByInput = Prisma.ResourceOrderByWithRelationInput | Prisma.ResourceOrderByWithRelationInput[]

const querySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
})

/**
 * @swagger
 * /api/resources:
 *   get:
 *     summary: Get all resources
 *     tags: [Resources]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query (searches in title and description)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: List of resources
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Resource'
 *       400:
 *         description: Invalid query parameters
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const parsed = querySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid query parameters', issues: parsed.error.errors })
  }
  
  const { q, category } = parsed.data
  const where: ResourceWhereInput = {}
  
  if (category) where.category = category
  if (q) {
    const trimmedQ = q.trim()
    if (trimmedQ) {
      where.OR = [
        { title: { contains: trimmedQ, mode: 'insensitive' } },
        { description: { contains: trimmedQ, mode: 'insensitive' } },
      ]
    }
  }
  
  const items = await prisma.resource.findMany({ 
    where, 
    orderBy: { createdAt: 'desc' } 
  })
  return success(res, items)
}))

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

/**
 * @swagger
 * /api/resources/paged:
 *   get:
 *     summary: Get paginated resources
 *     tags: [Resources]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [createdAtDesc, titleAsc]
 *           default: createdAtDesc
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 200
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *     responses:
 *       200:
 *         description: Paginated resources
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Resource'
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 */
router.get('/paged', asyncHandler(async (req: Request, res: Response) => {
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
  
  return paginated(res, items, total, limit, offset)
}))

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

/**
 * @swagger
 * /api/resources:
 *   post:
 *     summary: Create a new resource
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - url
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               url:
 *                 type: string
 *                 format: uri
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Resource created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Resource'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.post('/', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = createSchema.parse(req.body)
    if (!data.url) {
      return validationError(res, 'url is required when no file is uploaded')
    }
    
    const resource = await prisma.resource.create({ data })
    return created(res, resource)
  } catch (error) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return validationError(res, 'Invalid payload', (error as z.ZodError).issues)
    }
    throw error
  }
}))

/**
 * @swagger
 * /api/resources/{id}:
 *   put:
 *     summary: Update a resource
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               url:
 *                 type: string
 *                 format: uri
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resource updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Resource'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Resource not found
 */
router.put('/:id', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return validationError(res, 'Invalid id')
  try {
    const data = createSchema.partial().parse(req.body)
    const resource = await prisma.resource.update({ where: { id }, data })
    return updated(res, resource)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return notFound(res, 'Resource')
    }
    if (error && typeof error === 'object' && 'issues' in error) {
      return validationError(res, 'Invalid payload', (error as z.ZodError).issues)
    }
    throw error
  }
}))

router.delete('/:id', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return validationError(res, 'Invalid id')
  try {
    const existing = await prisma.resource.findUnique({ where: { id } })
    if (!existing) return notFound(res, 'Resource')
    await prisma.resource.delete({ where: { id } })
    if (existing.storagePath && existing.storagePath.startsWith('/uploads/')) {
      const filePath = path.resolve(process.cwd(), 'apps', 'api', existing.storagePath.replace(/^\//, ''))
      try { 
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath) 
      } catch {
        // Ignore file deletion errors
      }
    }
    const audit = createAuditHelper(req)
    await audit.log('FILE_DELETE', 'Resource', id, {
      fileName: existing.fileName,
      title: existing.title
    })
    return deleted(res)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return notFound(res, 'Resource')
    }
    throw error
  }
}))

/**
 * @swagger
 * /api/resources/bulk-delete:
 *   post:
 *     summary: Delete multiple resources
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of resource IDs to delete
 *     responses:
 *       200:
 *         description: Resources deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deleted:
 *                   type: array
 *                   items:
 *                     type: integer
 *       400:
 *         description: Invalid input - ids is required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.post('/bulk-delete', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const ids = Array.isArray(req.body?.ids) 
    ? req.body.ids.map((n: unknown) => Number(n)).filter((n: number) => Number.isInteger(n))
    : []
  if (ids.length === 0) {
    return validationError(res, 'ids is required (non-empty array of integers)')
  }
  
  const existing = await prisma.resource.findMany({ 
    where: { id: { in: ids } }, 
    select: { id: true, storagePath: true } 
  })
  
  await prisma.resource.deleteMany({ where: { id: { in: ids } } })
  
  // Delete files in parallel
  const fileDeletions = existing
    .filter(r => r.storagePath && r.storagePath.startsWith('/uploads/'))
    .map(r => {
      const filePath = path.resolve(process.cwd(), 'apps', 'api', r.storagePath!.replace(/^\//, ''))
      return Promise.resolve().then(() => {
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath)
          } catch {
            // Ignore file deletion errors
          }
        }
      })
    })
  
  await Promise.all(fileDeletions)
  
  const audit = createAuditHelper(req)
  const auditLogs = existing.map(r => 
    audit.log('FILE_DELETE', 'Resource', r.id, { bulkDelete: true })
  )
  await Promise.all(auditLogs)
  
  return success(res, { deleted: existing.map(e => e.id) })
}))

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

/**
 * @swagger
 * /api/resources/upload:
 *   post:
 *     summary: Upload a file resource
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: File to upload (PDF, images, or text files, max 10MB)
 *       - in: formData
 *         name: title
 *         type: string
 *         description: Optional title for the resource
 *       - in: formData
 *         name: description
 *         type: string
 *         description: Optional description
 *       - in: formData
 *         name: category
 *         type: string
 *         description: Optional category
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Resource'
 *       400:
 *         description: Invalid file or file too large
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Failed to upload file
 */
router.post('/upload', requireRole(['admin']), (req: Request, res: Response, next: NextFunction) => {
  const multerHandler = upload.single('file')
  multerHandler(req, res, (err?: unknown) => {
    if (err) {
      const error = err as Error & { code?: string }
      if (error.message === 'Unsupported file type') {
        return validationError(res, 'Tipo de archivo no soportado')
      }
      if (error.code === 'LIMIT_FILE_SIZE') {
        return validationError(res, 'Archivo demasiado grande (máx 10MB)')
      }
      return validationError(res, 'Error de subida', String(error?.message || error))
    }
    next()
  })
}, asyncHandler(async (req: Request, res: Response) => {
  const file = (req as Request & { file?: MulterFile }).file
  const title = (req.body?.title as string) || (file?.originalname ?? 'Archivo')
  const description = (req.body?.description as string) || undefined
  const category = (req.body?.category as string) || undefined
  if (!file) return validationError(res, 'file is required')
  
  const resource = await prisma.resource.create({ 
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
  const audit = createAuditHelper(req)
  await audit.log('FILE_UPLOAD', 'Resource', resource.id, {
    fileName: file.originalname,
    mimeType: file.mimetype,
    size: file.size
  })
  return created(res, resource)
}))

export default router
