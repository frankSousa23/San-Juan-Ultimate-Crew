import React, { useState, useEffect } from 'react'
import { http } from '../lib/api'
import { useApi } from '../hooks/useApi'
import { useToast } from '../hooks/useToast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Feedback {
  id: number
  name: string | null
  email: string | null
  category: string
  message: string
  createdAt: string
  user: {
    name: string | null
    email: string | null
  } | null
}

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(false)
  const toasts = useToast()

  const loadFeedbacks = async () => {
    setLoading(true)
    try {
      const res = await http.get<Feedback[]>('/api/feedback')
      if (res && res.data) {
        setFeedbacks(Array.isArray(res.data) ? res.data : [])
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Error al cargar feedback'
      toasts.error('Error al cargar el feedback: ' + errorMsg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeedbacks()
  }, [])

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'BUG': return 'bg-red-100 text-red-800'
      case 'FEATURE': return 'bg-blue-100 text-blue-800'
      case 'UX': return 'bg-purple-100 text-purple-800'
      case 'GENERAL': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'BUG': return 'Error/Bug'
      case 'FEATURE': return 'Sugerencia de Mejora'
      case 'UX': return 'Experiencia de Usuario'
      case 'GENERAL': return 'Comentario General'
      default: return category
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Feedback de Usuarios</h1>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {feedbacks.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay comentarios de feedback registrados.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {feedbacks.map((f) => (
              <li key={f.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(f.category)}`}>
                        {getCategoryLabel(f.category)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(f.createdAt), "d 'de' MMMM, yyyy HH:mm", { locale: es })}
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium mb-1">
                      {f.name || f.user?.name || 'Usuario Anónimo'} 
                      <span className="text-gray-500 font-normal ml-2">
                        ({f.email || f.user?.email || 'Sin correo'})
                      </span>
                    </p>
                    <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-4 rounded-md border border-gray-100 whitespace-pre-wrap">
                      {f.message}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
