import React from 'react'
import { newsApi } from '../../../lib/api'
import { NewsPost } from '../../../types/news'

export function NewsPostDetail({
  post,
  canManage,
  onClose,
  onEdit,
  onDelete,
}: {
  post: NewsPost
  canManage: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-bold flex items-center gap-2">
              {post.isPinned && <span>📌</span>}
              {post.title}
            </div>
            <div className="text-sm opacity-90 mt-1">
              {post.author && `Por #${post.author.number} ${post.author.name}`} • {new Date(post.createdAt).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
          {canManage && (
            <div className="flex gap-2">
              <button
                onClick={onEdit}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm"
              >
                Editar
              </button>
              <button
                onClick={onDelete}
                className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-sm"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {post.category && (
            <div className="mb-4">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                {post.category}
              </span>
            </div>
          )}
          <div className="prose max-w-none mb-6">
            <div className="whitespace-pre-wrap text-gray-700">{post.content}</div>
          </div>
          {post.files && post.files.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h4 className="font-semibold text-gray-800 mb-3">Archivos Adjuntos</h4>
              <div className="space-y-2">
                {post.files.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📎</span>
                      <div>
                        <div className="font-medium text-gray-800">{file.originalName}</div>
                        <div className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB • {file.mimeType}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => newsApi.downloadFile(post.id, file.id, file.originalName)}
                      className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                    >
                      Descargar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-6 text-sm text-gray-500">
            {post.views} vista{post.views !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="p-4 flex justify-end border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
