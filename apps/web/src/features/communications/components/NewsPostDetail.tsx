import React, { useState, useEffect } from 'react'
import { newsApi } from '../../../lib/api'
import { NewsPost, NewsComment } from '../../../types/news'
import { useAuth } from '../../../contexts/AuthContext'
import { useToast } from '../../../hooks/useToast'
import { useNavigate } from 'react-router-dom'

export function NewsPostDetail({
  post,
  canManage,
  onClose,
  onEdit,
  onDelete,
  onPostUpdated,
}: {
  post: NewsPost
  canManage: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onPostUpdated?: (updated: NewsPost) => void
}) {
  const { user } = useAuth()
  const toasts = useToast()
  const navigate = useNavigate()

  const [currentPost, setCurrentPost] = useState<NewsPost>(post)
  const [comments, setComments] = useState<NewsComment[]>(post.comments || [])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [togglingLock, setTogglingLock] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const isGuest = !user

  // Cargar comentarios frescos al abrir
  useEffect(() => {
    let mounted = true
    const fetchComments = async () => {
      setLoadingComments(true)
      try {
        const fullPost = await newsApi.get(post.id)
        if (mounted) {
          setCurrentPost(fullPost)
          if (fullPost.comments) {
            setComments(fullPost.comments)
          }
        }
      } catch (err) {
        console.warn('Error loading fresh post comments:', err)
      } finally {
        if (mounted) setLoadingComments(false)
      }
    }
    fetchComments()
    return () => { mounted = false }
  }, [post.id])

  // Contar comentarios del usuario actual en esta publicación
  const currentUserId = user?.id ? Number(user.id) : null
  const userCommentsCount = comments.filter(c => c.userId === currentUserId).length
  const maxUserComments = 3
  const maxTotalComments = 50
  const isLocked = Boolean(currentPost.commentsLocked)
  const hasReachedUserLimit = !canManage && userCommentsCount >= maxUserComments
  const hasReachedTotalLimit = comments.length >= maxTotalComments

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = commentText.trim()
    if (!trimmed) return
    if (trimmed.length < 3) {
      setErrorMsg('El comentario debe tener al menos 3 caracteres.')
      return
    }
    if (trimmed.length > 300) {
      setErrorMsg('El comentario no puede exceder los 300 caracteres.')
      return
    }

    setSubmittingComment(true)
    setErrorMsg(null)
    try {
      const newComment = await newsApi.addComment(currentPost.id, {
        content: trimmed,
      })
      setComments(prev => [...prev, newComment])
      setCommentText('')
      toasts.success('Comentario publicado')
      if (onPostUpdated) {
        onPostUpdated({
          ...currentPost,
          _count: {
            ...currentPost._count,
            comments: (currentPost._count?.comments || comments.length) + 1
          }
        })
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'No se pudo publicar el comentario'
      setErrorMsg(msg)
      toasts.error(msg)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este comentario?')) return
    try {
      await newsApi.deleteComment(currentPost.id, commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
      toasts.success('Comentario eliminado')
    } catch (err: any) {
      toasts.error(err?.message || 'Error al eliminar comentario')
    }
  }

  const handleToggleLock = async () => {
    setTogglingLock(true)
    try {
      const updated = await newsApi.toggleLock(currentPost.id)
      setCurrentPost(updated)
      toasts.success(updated.commentsLocked ? 'Comentarios bloqueados para este aviso' : 'Comentarios desbloqueados')
      if (onPostUpdated) onPostUpdated(updated)
    } catch (err: any) {
      toasts.error(err?.message || 'Error al cambiar estado de comentarios')
    } finally {
      setTogglingLock(false)
    }
  }

  const getRoleBadge = (role?: string | null) => {
    const r = role?.toLowerCase() || ''
    if (r.includes('directiva') || r.includes('admin')) {
      return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">🛡️ Directiva</span>
    }
    if (r.includes('mesa') || r.includes('técnica') || r.includes('anotador')) {
      return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">⏱️ Mesa Técnica</span>
    }
    if (r.includes('entrenador') || r.includes('coach')) {
      return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">⚡ Entrenador</span>
    }
    if (r.includes('capitán') || r.includes('captain')) {
      return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">🧢 Capitán</span>
    }
    return <span className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-full">👤 Jugador</span>
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-800 text-white p-4 sm:p-5 flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {currentPost.isPinned && (
                <span className="bg-yellow-400/90 text-yellow-950 text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                  📌 FIJADO
                </span>
              )}
              {currentPost.category && (
                <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                  {currentPost.category}
                </span>
              )}
              {isLocked && (
                <span className="bg-rose-500/90 text-white text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                  🔒 Comentarios Cerrados
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-snug">
              {currentPost.title}
            </h2>
            <div className="text-xs text-purple-100/90 mt-1 flex flex-wrap items-center gap-3">
              {currentPost.author && <span>Por #{currentPost.author.number} {currentPost.author.name}</span>}
              <span>•</span>
              <span>{new Date(currentPost.createdAt).toLocaleDateString('es-ES', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}</span>
              <span>•</span>
              <span>{currentPost.views} vistas</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canManage && (
              <>
                <button
                  onClick={handleToggleLock}
                  disabled={togglingLock}
                  title={isLocked ? 'Reabrir comentarios' : 'Cerrar comentarios'}
                  className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold text-white transition flex items-center gap-1 border border-white/20"
                >
                  {isLocked ? '🔓 Abrir Hilo' : '🔒 Cerrar Hilo'}
                </button>
                <button
                  onClick={onEdit}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold text-white transition"
                >
                  Editar
                </button>
                <button
                  onClick={onDelete}
                  className="px-3 py-1.5 bg-red-600/90 hover:bg-red-600 rounded-lg text-xs font-bold text-white transition shadow-xs"
                >
                  Eliminar
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-xl font-bold p-1 leading-none ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Post Content */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 sm:p-5">
            <div className="whitespace-pre-wrap text-slate-800 text-sm sm:text-base leading-relaxed">
              {currentPost.content}
            </div>

            {/* Event link banner if attached to an event */}
            {currentPost.eventId && (
              <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-amber-50/80 p-3 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏆</span>
                  <div className="text-xs">
                    <span className="font-bold text-amber-900 block">Evento Oficial Vinculado</span>
                    <span className="text-amber-700">Este comunicado refleja eventualidades o cambios de cronograma del evento #{currentPost.eventId}.</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose()
                    navigate('/eventos')
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  📅 Ir a Eventos & Mesa Técnica
                </button>
              </div>
            )}
          </div>

          {/* Attachments */}
          {currentPost.files && currentPost.files.length > 0 && (
            <div className="border border-gray-200 rounded-xl p-4 bg-white">
              <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                <span>📎</span> Archivos Adjuntos ({currentPost.files.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentPost.files.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-2.5 bg-gray-50 border rounded-lg hover:bg-gray-100/80 transition">
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <span className="text-lg text-purple-600">📄</span>
                      <div className="truncate">
                        <div className="font-semibold text-xs text-gray-800 truncate">{file.originalName}</div>
                        <div className="text-[10px] text-gray-500">{(file.size / 1024).toFixed(1)} KB</div>
                      </div>
                    </div>
                    <button
                      onClick={() => newsApi.downloadFile(currentPost.id, file.id, file.originalName)}
                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium transition shrink-0"
                    >
                      Descargar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments & Interactions Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                  <span>💬</span> Interacción y Comentarios
                  <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded-full">
                    {comments.length} / {maxTotalComments}
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Espacio moderado para dudas puntuales y confirmaciones del club.
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {isLocked ? (
                  <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    🔒 Comentarios cerrados por la Mesa
                  </span>
                ) : (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    🟢 Abierto a participación
                  </span>
                )}
              </div>
            </div>

            {/* Clear Rules Box */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 rounded-xl p-3.5 mb-5 text-xs text-purple-950">
              <div className="flex items-center gap-1.5 font-bold text-purple-900 mb-1.5">
                <span>🛡️</span> Reglas Claras de Interacción (Anti-Saturación):
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-purple-900/90 list-disc list-inside">
                <li><strong className="text-purple-950">Límite por usuario:</strong> Máx. 3 comentarios por aviso.</li>
                <li><strong className="text-purple-950">Longitud:</strong> Entre 3 y 300 caracteres (sé conciso).</li>
                <li><strong className="text-purple-950">Espíritu de Juego (SOTG):</strong> Respeto y claridad.</li>
                <li><strong className="text-purple-950">Control de Mesa:</strong> La directiva puede cerrar o moderar el hilo.</li>
              </ul>
            </div>

            {/* Comment Input Box */}
            {!isLocked && !hasReachedUserLimit && !hasReachedTotalLimit && !isGuest && (
              <form onSubmit={handleAddComment} className="mb-6 bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Agregar comentario ({userCommentsCount}/{maxUserComments} utilizados):
                  </label>
                  <span className={`text-[11px] font-medium ${commentText.length > 280 ? 'text-rose-600 font-bold' : 'text-gray-400'}`}>
                    {commentText.length} / 300
                  </span>
                </div>
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value.slice(0, 300))}
                  rows={2}
                  placeholder="Escribe tu consulta o aporte breve para la mesa técnica o directiva..."
                  className="w-full px-3 py-2 border rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                  disabled={submittingComment}
                />
                {errorMsg && (
                  <div className="text-rose-600 text-xs mt-1.5 font-medium">
                    ⚠️ {errorMsg}
                  </div>
                )}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <span className="text-[11px] text-gray-400">
                    Visible para todo el club con tu rol verificado.
                  </span>
                  <button
                    type="submit"
                    disabled={submittingComment || !commentText.trim() || commentText.trim().length < 3}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50 flex items-center gap-1"
                  >
                    {submittingComment ? 'Publicando...' : 'Publicar Comentario'}
                  </button>
                </div>
              </form>
            )}

            {/* User Limit Reached Notice */}
            {hasReachedUserLimit && !isLocked && !isGuest && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs mb-5 flex items-center gap-2">
                <span>⚠️</span>
                <span>Has alcanzado el límite de <strong>3 comentarios</strong> para este aviso. Esto mantiene el tablón ordenado y legible para todos los atletas.</span>
              </div>
            )}

            {/* Total Limit Reached Notice */}
            {hasReachedTotalLimit && !isLocked && (
              <div className="bg-slate-100 border border-slate-300 text-slate-800 p-3 rounded-xl text-xs mb-5 flex items-center gap-2">
                <span>🛑</span>
                <span>Se ha alcanzado el límite total de <strong>50 comentarios</strong> para este aviso. La mesa técnica revisará las consultas expuestas.</span>
              </div>
            )}

            {/* Guest Notice */}
            {isGuest && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-xl text-xs mb-5">
                Inicia sesión como jugador o directivo para agregar comentarios en este comunicado.
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-3">
              {loadingComments && (
                <div className="text-center py-6 text-xs text-gray-400">Cargando comentarios...</div>
              )}

              {!loadingComments && comments.length === 0 && (
                <div className="text-center py-8 bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
                  <span className="text-2xl block mb-1">💬</span>
                  <p className="text-xs font-medium text-gray-500">No hay comentarios aún en este aviso.</p>
                  <p className="text-[11px] text-gray-400">Sé el primero en dejar una consulta o confirmación.</p>
                </div>
              )}

              {!loadingComments && comments.map((c) => {
                const isAuthor = currentUserId !== null && c.userId === currentUserId
                const canDeleteThisComment = isAuthor || canManage
                return (
                  <div key={c.id} className="p-3.5 bg-slate-50/70 border border-slate-200/90 rounded-xl flex items-start justify-between gap-3 text-xs">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-bold text-gray-900">
                          {c.authorName || c.user?.name || 'Miembro'}
                        </span>
                        {getRoleBadge(c.authorRole)}
                        <span className="text-[10px] text-gray-400">
                          {new Date(c.createdAt).toLocaleString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {c.content}
                      </p>
                    </div>

                    {canDeleteThisComment && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1 rounded text-[11px] font-semibold transition shrink-0"
                        title="Eliminar comentario"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-gray-50 border-t flex items-center justify-between">
          <span className="text-xs text-gray-500">
            ID de Noticia: #{currentPost.id}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 font-semibold text-xs text-gray-800 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
