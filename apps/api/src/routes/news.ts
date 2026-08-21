import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { success, created, badRequest, notFound, unauthorized } from '../lib/response.js'
import { requireAuth, requirePermission } from './auth.js'
import { isGuestRequest, GUEST_POSTS } from '../lib/guestDemoData.js'
import { validateBody, validateParams } from '../middleware/validation.js'
import { createAuditHelper } from '../lib/audit.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'

const router = Router()

// Configuración de multer para subir archivos
const currentFilename = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url || 'file://' + process.cwd() + '/index.js')
const currentDir = typeof __dirname !== 'undefined' ? __dirname : path.dirname(currentFilename)
const uploadsDir = path.join(currentDir, '../../uploads/news')

// Asegurar que el directorio existe
fs.mkdir(uploadsDir, { recursive: true }).catch(() => {})

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    try {
      await fs.mkdir(uploadsDir, { recursive: true })
      cb(null, uploadsDir)
    } catch (error) {
      cb(error as Error, '')
    }
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, `${uniqueSuffix}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (_req, file, cb) => {
    // Permitir todos los tipos de archivo
    cb(null, true)
  }
})

// Schemas de validación
const createPostSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1),
  category: z.string().optional(),
  isPinned: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(true),
})

const updatePostSchema = createPostSchema.partial()

const postIdSchema = z.object({
  id: z.coerce.number().int().positive()
})

/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Get all news posts
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: published
 *         schema:
 *           type: boolean
 *         description: Filter by published status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Offset for pagination
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const published = req.query.published === 'true' ? true : req.query.published === 'false' ? false : undefined
  const category = req.query.category as string | undefined
  const limit = req.query.limit ? Number(req.query.limit) : 50
  const offset = req.query.offset ? Number(req.query.offset) : 0

  const where: any = {}
  if (published !== undefined) where.isPublished = published
  if (category) where.category = category

  const [posts, total] = await Promise.all([
    prisma.newsPost.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            number: true,
          }
        },
        files: {
          select: {
            id: true,
            fileName: true,
            originalName: true,
            mimeType: true,
            size: true,
            description: true,
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: { files: true }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset,
    }),
    prisma.newsPost.count({ where })
  ])

  return success(res, {
    items: posts,
    total,
    limit,
    offset,
  })
}))

/**
 * @swagger
 * /api/news/{id}:
 *   get:
 *     summary: Get a specific news post
 *     tags: [News]
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string }
  
  const post = await prisma.newsPost.findUnique({
    where: { id: Number(id) },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          number: true,
        }
      },
      files: {
        select: {
          id: true,
          fileName: true,
          originalName: true,
          mimeType: true,
          size: true,
          description: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  if (!post) {
    return notFound(res, 'Post not found')
  }

  // Incrementar contador de vistas
  await prisma.newsPost.update({
    where: { id: Number(id) },
    data: { views: { increment: 1 } }
  })

  return success(res, { ...post, views: post.views + 1 })
}))

/**
 * @swagger
 * /api/news:
 *   post:
 *     summary: Create a new news post
 *     tags: [News]
 */
router.post('/', requireAuth, requirePermission('communications:manage'), validateBody(createPostSchema), asyncHandler(async (req: Request, res: Response) => {
  const u = (req as any).user as any
  const userId = u?.sub ? Number(u.sub) : null

  if (!userId) {
    return unauthorized(res, 'User not authenticated')
  }

  // Obtener el playerId del usuario
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { playerId: true }
  })

  if (!user?.playerId) {
    return badRequest(res, 'User must be linked to a player to create posts')
  }

  const payload = req.body
  const publishedAt = payload.isPublished ? new Date() : null

  const post = await prisma.newsPost.create({
    data: {
      title: payload.title,
      content: payload.content,
      category: payload.category,
      isPinned: payload.isPinned || false,
      isPublished: payload.isPublished !== false,
      authorId: user.playerId,
      publishedAt,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          number: true,
        }
      },
      files: true
    }
  })

  const audit = createAuditHelper(req)
  await audit.log('CREATE', 'NewsPost', post.id, {
    title: post.title,
    category: post.category,
  })

  return created(res, post)
}))

/**
 * @swagger
 * /api/news/{id}:
 *   put:
 *     summary: Update a news post
 *     tags: [News]
 */
router.put('/:id', requireAuth, requirePermission('communications:manage'), validateParams(postIdSchema), validateBody(updatePostSchema), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string }
  const payload = req.body

  const existing = await prisma.newsPost.findUnique({
    where: { id: Number(id) }
  })

  if (!existing) {
    return notFound(res, 'Post not found')
  }

  const updateData: any = {}
  if (payload.title !== undefined) updateData.title = payload.title
  if (payload.content !== undefined) updateData.content = payload.content
  if (payload.category !== undefined) updateData.category = payload.category
  if (payload.isPinned !== undefined) updateData.isPinned = payload.isPinned
  if (payload.isPublished !== undefined) {
    updateData.isPublished = payload.isPublished
    // Si se publica por primera vez, establecer publishedAt
    if (payload.isPublished && !existing.publishedAt) {
      updateData.publishedAt = new Date()
    }
  }

  const post = await prisma.newsPost.update({
    where: { id: Number(id) },
    data: updateData,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          number: true,
        }
      },
      files: {
        select: {
          id: true,
          fileName: true,
          originalName: true,
          mimeType: true,
          size: true,
          description: true,
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  const audit = createAuditHelper(req)
  await audit.log('UPDATE', 'NewsPost', post.id, {
    title: post.title,
  })

  return success(res, post)
}))

/**
 * @swagger
 * /api/news/{id}:
 *   delete:
 *     summary: Delete a news post
 *     tags: [News]
 */
router.delete('/:id', requireAuth, requirePermission('communications:manage'), validateParams(postIdSchema), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string }

  const existing = await prisma.newsPost.findUnique({
    where: { id: Number(id) },
    include: { files: true }
  })

  if (!existing) {
    return notFound(res, 'Post not found')
  }

  // Eliminar archivos físicos
  for (const file of existing.files) {
    try {
      const filePath = path.join(uploadsDir, file.fileName)
      await fs.unlink(filePath).catch(() => {}) // Ignorar errores si el archivo no existe
    } catch (error) {
      // Continuar aunque falle la eliminación del archivo
    }
  }

  await prisma.newsPost.delete({
    where: { id: Number(id) }
  })

  const audit = createAuditHelper(req)
  await audit.log('DELETE', 'NewsPost', Number(id), {
    title: existing.title,
  })

  return success(res, { message: 'Post deleted successfully' })
}))

/**
 * @swagger
 * /api/news/{id}/files:
 *   post:
 *     summary: Upload a file to a news post
 *     tags: [News]
 */
router.post('/:id/files', requireAuth, requirePermission('communications:manage'), validateParams(postIdSchema), upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string }
  const file = (req as any).file

  if (!file) {
    return badRequest(res, 'No file uploaded')
  }

  const post = await prisma.newsPost.findUnique({
    where: { id: Number(id) }
  })

  if (!post) {
    // Eliminar archivo subido si el post no existe
    try {
      await fs.unlink(file.path)
    } catch {}
    return notFound(res, 'Post not found')
  }

  const description = req.body.description || null

  const postFile = await prisma.newsPostFile.create({
    data: {
      postId: Number(id),
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storagePath: file.path,
      description,
    }
  })

  const audit = createAuditHelper(req)
  await audit.log('FILE_UPLOAD', 'NewsPostFile', postFile.id, {
    postId: Number(id),
    fileName: file.originalname,
  })

  return created(res, postFile)
}))

/**
 * @swagger
 * /api/news/{id}/files/{fileId}:
 *   delete:
 *     summary: Delete a file from a news post
 *     tags: [News]
 */
router.delete('/:id/files/:fileId', requireAuth, requirePermission('communications:manage'), asyncHandler(async (req: Request, res: Response) => {
  const { id, fileId } = req.params

  const file = await prisma.newsPostFile.findUnique({
    where: { id: Number(fileId) },
    include: { post: true }
  })

  if (!file || file.postId !== Number(id)) {
    return notFound(res, 'File not found')
  }

  // Eliminar archivo físico
  try {
    const filePath = path.join(uploadsDir, file.fileName)
    await fs.unlink(filePath).catch(() => {})
  } catch (error) {
    // Continuar aunque falle la eliminación del archivo
  }

  await prisma.newsPostFile.delete({
    where: { id: Number(fileId) }
  })

  const audit = createAuditHelper(req)
  await audit.log('FILE_DELETE', 'NewsPostFile', Number(fileId), {
    postId: Number(id),
    fileName: file.originalName,
  })

  return success(res, { message: 'File deleted successfully' })
}))

/**
 * @swagger
 * /api/news/{id}/files/{fileId}/download:
 *   get:
 *     summary: Download a file from a news post
 *     tags: [News]
 */
router.get('/:id/files/:fileId/download', asyncHandler(async (req: Request, res: Response) => {
  const { id, fileId } = req.params

  const file = await prisma.newsPostFile.findUnique({
    where: { id: Number(fileId) },
    include: { post: true }
  })

  if (!file || file.postId !== Number(id)) {
    return notFound(res, 'File not found')
  }

  // Verificar que el post esté publicado (o el usuario tenga permisos)
  const u = (req as any).user as any
  const userId = u?.sub ? Number(u.sub) : null
  let canAccess = file.post.isPublished

  if (!canAccess && userId) {
    // Verificar permisos
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (user) {
      const userRoles = user.roles.map(ur => ur.role.name)
      const userPermissions = user.roles.flatMap(ur => 
        ur.role.permissions.map(rp => rp.permission.name)
      )
      
      canAccess = userRoles.includes('admin') || userPermissions.includes('communications:manage')
    }
  }

  if (!canAccess) {
    return unauthorized(res, 'Access denied')
  }

  const filePath = path.join(uploadsDir, file.fileName)
  
  try {
    await fs.access(filePath)
    res.download(filePath, file.originalName, (err) => {
      if (err) {
        console.error('Error downloading file:', err)
        return res.status(500).json({ error: 'Error downloading file' })
      }
    })
  } catch (error) {
    return notFound(res, 'File not found on disk')
  }
}))

export default router

