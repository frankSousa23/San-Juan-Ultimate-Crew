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
  commentsLocked: z.boolean().optional().default(false),
  eventId: z.number().optional().nullable(),
})

const updatePostSchema = createPostSchema.partial()

const createCommentSchema = z.object({
  content: z.string().trim().min(3, 'El comentario debe tener al menos 3 caracteres').max(300, 'El comentario no puede exceder los 300 caracteres'),
  authorName: z.string().optional(),
  authorRole: z.string().optional(),
})

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
          select: { files: true, comments: true }
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
      },
      comments: {
        orderBy: { createdAt: 'asc' },
        take: 50,
      },
      _count: {
        select: { files: true, comments: true }
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

/**
 * @swagger
 * /api/news/{id}/comments:
 *   get:
 *     summary: Get comments for a news post
 *     tags: [News]
 */
router.get('/:id/comments', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const post = await prisma.newsPost.findUnique({
    where: { id: Number(id) }
  })
  if (!post) {
    return notFound(res, 'Post not found')
  }

  const comments = await prisma.newsComment.findMany({
    where: { postId: Number(id) },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        }
      }
    },
    orderBy: { createdAt: 'asc' },
    take: 50,
  })

  return success(res, comments)
}))

/**
 * @swagger
 * /api/news/{id}/comments:
 *   post:
 *     summary: Add a comment to a news post (with anti-saturation rules)
 *     tags: [News]
 */
router.post('/:id/comments', requireAuth, validateBody(createCommentSchema), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const postId = Number(id)
  const u = (req as any).user as any
  const userId = u?.sub ? Number(u.sub) : null
  const body = req.body

  const post = await prisma.newsPost.findUnique({
    where: { id: postId }
  })

  if (!post) {
    return notFound(res, 'Noticia o comunicado no encontrado')
  }

  if (post.commentsLocked) {
    return badRequest(res, 'Los comentarios para esta publicación han sido cerrados por la Mesa Técnica / Directiva.')
  }

  // Regla 1: Límite máximo de 50 comentarios en total por publicación (anti-saturación global)
  const totalCommentsCount = await prisma.newsComment.count({
    where: { postId }
  })

  if (totalCommentsCount >= 50) {
    return badRequest(res, 'Se ha alcanzado el límite máximo de 50 comentarios para este aviso para evitar saturación del hilo.')
  }

  // Regla 2: Límite de máximo 3 comentarios por usuario por publicación (anti-spam / anti-saturación individual)
  if (userId) {
    const userCommentsCount = await prisma.newsComment.count({
      where: {
        postId,
        userId
      }
    })

    if (userCommentsCount >= 3) {
      return badRequest(res, 'Has alcanzado el límite máximo de 3 comentarios por usuario en este aviso. Esto garantiza un espacio conciso y ordenado para todos los atletas.')
    }

    // Regla 3: Cooldown de 10 segundos entre comentarios
    const latestUserComment = await prisma.newsComment.findFirst({
      where: { postId, userId },
      orderBy: { createdAt: 'desc' }
    })

    if (latestUserComment) {
      const diffMs = Date.now() - new Date(latestUserComment.createdAt).getTime()
      if (diffMs < 10000) {
        return badRequest(res, 'Por favor espera unos segundos antes de enviar otro comentario.')
      }
    }
  }

  // Determinar rol y nombre del autor
  let authorName = body.authorName || 'Miembro'
  let authorRole = body.authorRole || 'Jugador'

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        player: true,
        roles: {
          include: {
            role: true
          }
        }
      }
    })

    if (user) {
      if (user.player?.name) {
        authorName = `#${user.player.number || ''} ${user.player.name}`.trim()
      } else if (user.name) {
        authorName = user.name
      }

      const roleNames = user.roles.map((r: any) => r.role?.name || '')
      if (roleNames.includes('admin')) {
        authorRole = 'Directiva'
      } else if (roleNames.includes('technical_table') || roleNames.includes('annotator')) {
        authorRole = 'Mesa Técnica'
      } else if (roleNames.includes('coach')) {
        authorRole = 'Entrenador'
      } else if (roleNames.includes('captain')) {
        authorRole = 'Capitán'
      } else if (roleNames.includes('treasurer')) {
        authorRole = 'Tesorero'
      } else if (user.player) {
        authorRole = 'Jugador'
      }
    }
  }

  const comment = await prisma.newsComment.create({
    data: {
      postId,
      userId,
      authorName,
      authorRole,
      content: body.content.trim(),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        }
      }
    }
  })

  const audit = createAuditHelper(req)
  await audit.log('CREATE', 'NewsComment', comment.id, {
    postId,
    authorName,
    contentPreview: body.content.slice(0, 50),
  })

  return created(res, comment)
}))

/**
 * @swagger
 * /api/news/{id}/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [News]
 */
router.delete('/:id/comments/:commentId', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { id, commentId } = req.params
  const u = (req as any).user as any
  const userId = u?.sub ? Number(u.sub) : null

  const comment = await prisma.newsComment.findUnique({
    where: { id: Number(commentId) }
  })

  if (!comment || comment.postId !== Number(id)) {
    return notFound(res, 'Comentario no encontrado')
  }

  // Verificar si es el autor o admin / gestor de comunicaciones
  const isAuthor = comment.userId === userId
  let canDelete = isAuthor

  if (!canDelete && userId) {
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
      canDelete = userRoles.includes('admin') || userPermissions.includes('communications:manage')
    }
  }

  if (!canDelete) {
    return unauthorized(res, 'No tienes permiso para eliminar este comentario')
  }

  await prisma.newsComment.delete({
    where: { id: Number(commentId) }
  })

  const audit = createAuditHelper(req)
  await audit.log('DELETE', 'NewsComment', Number(commentId), {
    postId: Number(id),
  })

  return success(res, { message: 'Comentario eliminado correctamente' })
}))

/**
 * @swagger
 * /api/news/{id}/toggle-lock:
 *   put:
 *     summary: Lock or unlock comments on a post
 *     tags: [News]
 */
router.put('/:id/toggle-lock', requireAuth, requirePermission('communications:manage'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const post = await prisma.newsPost.findUnique({
    where: { id: Number(id) }
  })

  if (!post) {
    return notFound(res, 'Post not found')
  }

  const updatedPost = await prisma.newsPost.update({
    where: { id: Number(id) },
    data: {
      commentsLocked: !post.commentsLocked
    },
    include: {
      author: true,
      files: true,
      comments: true,
      _count: {
        select: { files: true, comments: true }
      }
    }
  })

  const audit = createAuditHelper(req)
  await audit.log('UPDATE', 'NewsPost', Number(id), {
    commentsLocked: updatedPost.commentsLocked,
  })

  return success(res, updatedPost)
}))

/**
 * @swagger
 * /api/news/event-notice:
 *   post:
 *     summary: Publish an official event announcement or contingency notice
 *     tags: [News]
 */
router.post('/event-notice', requireAuth, requirePermission('events:manage'), asyncHandler(async (req: Request, res: Response) => {
  const { eventId, title, content, category, isPinned } = req.body
  const u = (req as any).user as any
  const userId = u?.sub ? Number(u.sub) : null

  const user = userId ? await prisma.user.findUnique({
    where: { id: userId },
    select: { playerId: true }
  }) : null

  const post = await prisma.newsPost.create({
    data: {
      title,
      content,
      category: category || '⏱️ Eventualidad de Mesa Técnica',
      isPinned: isPinned !== undefined ? isPinned : true,
      isPublished: true,
      commentsLocked: false,
      eventId: eventId ? Number(eventId) : null,
      authorId: user?.playerId || null,
      publishedAt: new Date(),
    },
    include: {
      author: true,
      comments: true,
      _count: {
        select: { files: true, comments: true }
      }
    }
  })

  const audit = createAuditHelper(req)
  await audit.log('CREATE', 'NewsPost', post.id, {
    eventId,
    title,
    category: post.category,
  })

  return created(res, post)
}))

export default router

