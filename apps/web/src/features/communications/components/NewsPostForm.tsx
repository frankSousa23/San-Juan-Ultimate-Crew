import React, { useState } from 'react'
import { newsApi } from '../../../lib/api'
import { NewsPost, NewsPostFile } from '../../../types/news'
import { useToast } from '../../../hooks/useToast'
import ConfirmModal from '../../../components/ConfirmModal'

export function NewsPostForm({
  post,
  onSave,
  onCancel,
}: {
  post: NewsPost | null
  onSave: (data: { title: string; content: string; category?: string; isPinned?: boolean; isPublished?: boolean; commentsLocked?: boolean; eventId?: number | null }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(post?.title || '')
  const [content, setContent] = useState(post?.content || '')
  const [category, setCategory] = useState(post?.category || '📢 Anuncios Oficiales')
  const [isPinned, setIsPinned] = useState(post?.isPinned || false)
  const [isPublished, setIsPublished] = useState(post?.isPublished !== false)
  const [commentsLocked, setCommentsLocked] = useState(post?.commentsLocked || false)
  const [eventId, setEventId] = useState<string>(post?.eventId ? String(post.eventId) : '')
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<NewsPostFile[]>(post?.files || [])
  const [confirmState, setConfirmState] = useState<{ id: number; message: string; onYes: () => Promise<void> } | null>(null)
  const toasts = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      toasts.error('Título y contenido son requeridos')
      return
    }
    onSave({
      title: title.trim(),
      content: content.trim(),
      category: category.trim() || undefined,
      isPinned,
      isPublished,
      commentsLocked,
      eventId: eventId ? Number(eventId) : null,
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!post?.id) {
      setUploadingFiles(prev => [...prev, ...files])
      return
    }

    for (const file of files) {
      try {
        const uploaded = await newsApi.uploadFile(post.id, file)
        setUploadedFiles(prev => [...prev, uploaded])
        toasts.success(`Archivo "${file.name}" subido exitosamente`)
      } catch (error: any) {
        toasts.error(`Error al subir "${file.name}": ${error?.response?.data?.error || 'Error desconocido'}`)
      }
    }
  }

  const handleFileDelete = async (fileId: number) => {
    if (!post?.id) return
    try {
      await newsApi.deleteFile(post.id, fileId)
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
      toasts.success('Archivo eliminado exitosamente')
    } catch (error: any) {
      toasts.error(error?.response?.data?.error || 'Error al eliminar archivo')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
          <div className="text-lg font-bold">{post ? 'Editar' : 'Nueva'} Noticia</div>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
              placeholder="Título de la noticia"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contenido *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows={10}
              required
              placeholder="Contenido de la noticia (puedes usar Markdown)"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-1.5"
                placeholder="Ej: ⏱️ Eventualidad de Mesa Técnica, 🏆 Torneo / Eventos"
              />
              <div className="flex flex-wrap gap-1">
                {['⏱️ Eventualidad de Mesa Técnica', '🏆 Torneo / Eventos', '📢 Anuncios Oficiales', 'Entrenamiento'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className="text-[11px] px-2 py-0.5 rounded bg-gray-100 hover:bg-purple-100 hover:text-purple-700 transition"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vincular a Evento (Opcional)</label>
              <input
                type="number"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="ID del Evento (ej: 1, 2, 3...)"
              />
              <span className="text-[11px] text-gray-400 block mt-1">
                Si se vincula, incluirá un enlace directo a la mesa técnica o evento en el calendario.
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              <span className="text-xs font-semibold text-gray-800">📌 Fijar en la parte superior</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              <span className="text-xs font-semibold text-gray-800">🌐 Publicar inmediatamente</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={commentsLocked}
                onChange={(e) => setCommentsLocked(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="text-xs font-semibold text-rose-800">🔒 Cerrar comentarios</span>
            </label>
          </div>
          {post && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Archivos Adjuntos</label>
              <div className="space-y-2">
                {uploadedFiles.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{file.originalName}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => newsApi.downloadFile(post.id, file.id, file.originalName)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Descargar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmState({ id: file.id, message: '¿Eliminar este archivo?', onYes: () => handleFileDelete(file.id) })}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
                <input
                  type="file"
                  onChange={handleFileUpload}
                  multiple
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            >
              {post ? 'Actualizar' : 'Publicar'}
            </button>
          </div>
        </form>
      </div>
      {confirmState && (
        <ConfirmModal
          title="Confirmar eliminación"
          message={confirmState.message}
          confirmText="Sí, eliminar"
          cancelText="Cancelar"
          onCancel={() => setConfirmState(null)}
          onConfirm={async () => { await confirmState.onYes(); setConfirmState(null) }}
        />
      )}
    </div>
  )
}
