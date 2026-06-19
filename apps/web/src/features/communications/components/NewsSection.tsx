import React, { useMemo } from 'react'
import { NewsPost } from '../../../types/news'

export function NewsSection({
  posts,
  loading,
  error,
  canManage,
  selectedPost,
  onSelectPost,
  onRefresh,
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
    const cats = new Set<string>()
    posts.forEach(p => {
      if (p.category) cats.add(p.category)
    })
    return Array.from(cats).sort()
  }, [posts])

  const filteredPosts = useMemo(() => {
    if (category === 'all') return posts
    return posts.filter(p => p.category === category)
  }, [posts, category])

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="flex-1 flex flex-col min-h-[400px] sm:min-h-[600px]">
      <div className="bg-white rounded-lg shadow flex flex-col flex-1">
        <div className="border-b px-4 py-3 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="font-semibold text-gray-800">Noticias y Anuncios</div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="px-3 py-1 border rounded-lg text-sm"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {canManage && (
              <button
                onClick={onCreate}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                + Nueva Noticia
              </button>
            )}
            <button
              onClick={onRefresh}
              className="px-3 py-1 border rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && <div className="text-gray-500 text-center py-8">Cargando noticias...</div>}
          {error && <div className="text-red-600 text-center py-4">{error}</div>}
          {!loading && !error && filteredPosts.length === 0 && (
            <div className="text-gray-500 text-center py-8">
              {category === 'all' ? 'No hay noticias publicadas' : `No hay noticias en la categoría "${category}"`}
            </div>
          )}
          {!loading && !error && filteredPosts.length > 0 && (
            <div className="space-y-4">
              {filteredPosts.map(post => (
                <div
                  key={post.id}
                  className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    post.isPinned ? 'bg-yellow-50 border-yellow-300' : ''
                  }`}
                  onClick={() => onSelectPost(post)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {post.isPinned && (
                          <span className="text-yellow-600 text-sm">📌</span>
                        )}
                        <h3 className="font-semibold text-gray-900">{post.title}</h3>
                        {post.category && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                            {post.category}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-700 line-clamp-2 mb-2">
                        {post.content}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {post.author && (
                          <span>Por #{post.author.number} {post.author.name}</span>
                        )}
                        <span>{new Date(post.createdAt).toLocaleDateString('es-ES')}</span>
                        <span>{post.views} vistas</span>
                        {post.files && post.files.length > 0 && (
                          <span>📎 {post.files.length} archivo{post.files.length > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onEdit(post)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => onDelete(post.id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
