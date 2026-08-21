import React, { useMemo } from 'react'
import { NewsPost } from '../../../types/news'

export function NewsSection({
  posts,
  loading,
  error,
  canManage,
  selectedPost: _selectedPost,
  onSelectPost,
  onRefresh: _onRefresh,
  onCreate,
  onEdit,
  onDelete,
  category,
  onCategoryChange,
  page,
  total,
  onPageChange,
}: {
  posts: NewsPost[]
  loading: boolean
  error: string | null
  canManage: boolean
  selectedPost: NewsPost | null
  onSelectPost: (post: NewsPost | null) => void
  onRefresh: () => void
  onCreate: () => void
  onEdit: (post: NewsPost) => void
  onDelete: (id: number) => void
  category: string
  onCategoryChange: (cat: string) => void
  page: number
  total: number
  onPageChange: (page: number) => void
}) {
  const categories = useMemo(() => {
    const defaultCats = [
      '⏱️ Eventualidad de Mesa Técnica',
      '🏆 Torneo / Eventos',
      '📢 Anuncios Oficiales',
      'Entrenamiento',
    ]
    const cats = new Set<string>(defaultCats)
    posts.forEach(p => {
      if (p.category) cats.add(p.category)
    })
    return Array.from(cats)
  }, [posts])

  const filteredPosts = useMemo(() => {
    if (category === 'all') return posts
    return posts.filter(p => p.category === category)
  }, [posts, category])

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="flex-1 flex flex-col min-h-[400px] sm:min-h-[600px]">
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 flex flex-col flex-1 overflow-hidden">
        {/* Top bar & quick categories */}
        <div className="border-b px-4 py-3.5 bg-slate-50/80 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <span>📰</span> Tablón Oficial de Comunicaciones & Eventos
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Avisos de directiva, eventualidades de mesa técnica y debates moderados.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canManage && (
                <button
                  onClick={onCreate}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  <span>+</span> Publicar Comunicado
                </button>
              )}
            </div>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => onCategoryChange('all')}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                category === 'all'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              🌟 Todos ({posts.length})
            </button>
            {categories.map(cat => {
              const count = posts.filter(p => p.category === cat).length
              return (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1 ${
                    category === cat
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <span>{cat}</span>
                  {count > 0 && <span className="opacity-75 text-[10px]">({count})</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading && <div className="text-gray-400 text-center py-12 text-sm">Cargando comunicaciones...</div>}
          {error && <div className="text-red-600 text-center py-6 text-sm">{error}</div>}
          {!loading && !error && filteredPosts.length === 0 && (
            <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-gray-200">
              <span className="text-3xl block mb-2">📭</span>
              <p className="text-sm font-semibold text-gray-700">
                {category === 'all' ? 'No hay comunicados publicados aún' : `No hay avisos en la categoría "${category}"`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Las eventualidades de eventos y anuncios oficiales aparecerán aquí en tiempo real.
              </p>
            </div>
          )}
          {!loading && !error && filteredPosts.length > 0 && (
            <div className="space-y-3.5">
              {filteredPosts.map(post => {
                const commentCount = post._count?.comments ?? post.comments?.length ?? 0
                const isContingency = post.category?.includes('Eventualidad') || post.category?.includes('Mesa')

                return (
                  <div
                    key={post.id}
                    className={`border rounded-xl p-4 transition-all cursor-pointer shadow-xs hover:shadow-md ${
                      post.isPinned
                        ? 'bg-amber-50/60 border-amber-300/80 hover:bg-amber-50'
                        : isContingency
                        ? 'bg-indigo-50/40 border-indigo-200 hover:bg-indigo-50/70'
                        : 'bg-white border-gray-200 hover:bg-slate-50/80'
                    }`}
                    onClick={() => onSelectPost(post)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Tags and badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {post.isPinned && (
                            <span className="bg-amber-200/90 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                              📌 FIJADO
                            </span>
                          )}
                          {post.category && (
                            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                              {post.category}
                            </span>
                          )}
                          {post.eventId && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[11px] font-bold">
                              🏆 Evento #{post.eventId}
                            </span>
                          )}
                          {post.commentsLocked && (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md text-[10px] font-semibold">
                              🔒 Comentarios cerrados
                            </span>
                          )}
                        </div>

                        {/* Title & Preview */}
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base leading-snug mb-1">
                          {post.title}
                        </h4>
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2.5 leading-relaxed">
                          {post.content}
                        </p>

                        {/* Metadata Footer */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 font-medium">
                          {post.author && (
                            <span className="text-gray-700">Por #{post.author.number} {post.author.name}</span>
                          )}
                          <span>•</span>
                          <span>{new Date(post.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          <span>•</span>
                          <span>{post.views} vistas</span>
                          {post.files && post.files.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-600 font-semibold">📎 {post.files.length} adjunto{post.files.length > 1 ? 's' : ''}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                            💬 {commentCount} {commentCount === 1 ? 'comentario' : 'comentarios'}
                          </span>
                        </div>
                      </div>

                      {canManage && (
                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onEdit(post)}
                            className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => onDelete(post.id)}
                            className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-xs font-medium"
              >
                Anterior
              </button>
              <span className="text-xs text-gray-600 font-medium">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-xs font-medium"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
