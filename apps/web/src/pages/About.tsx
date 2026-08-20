import React, { useState } from 'react'
import { http } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

export default function About() {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    category: 'GENERAL',
    message: ''
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    try {
      await http.post('/api/feedback', formData)
      setStatus('success')
      setFormData(prev => ({ ...prev, message: '' }))
      setTimeout(() => setStatus('idle'), 3000)
    } catch (error: any) {
      const errMsg = error.response?.data?.error || 'Ocurrió un error al enviar el feedback.'
      console.error(error)
      setStatus('error')
      setErrorMessage(typeof errMsg === 'string' ? errMsg : 'Ocurrió un error al enviar el feedback.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      {/* Cabecera / Intro */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">Acerca de SIGEDIVO (Sistema de Gestión para el Disco Volador)</h1>
        <p className="text-blue-100 text-lg leading-relaxed max-w-2xl mb-6">
          <strong>Sistema de Gestión para el Disco Volador</strong> es una plataforma diseñada para modernizar, digitalizar y optimizar la administración táctica y competitiva del Ultimate Frisbee.
        </p>
        
        <div className="bg-white/10 rounded-xl p-5 border border-white/20">
          <h3 className="font-bold text-amber-300 mb-2">Fase Actual: Lanzamiento Comunitario Global</h3>
          <p className="text-sm text-blue-50 leading-relaxed mb-3">
            El sistema se encuentra en una fase de prueba y recopilación de feedback para la comunidad del Ultimate Frisbee. 
            Actualmente todas las personas y equipos interesados pueden usar esta misma plataforma de forma unificada. 
            Próximamente se escalará para que cada club o equipo pueda tener su propio entorno de estadísticas aisladas.
          </p>
          <div className="text-xs text-blue-200 uppercase tracking-wider font-semibold">
            Autor: Frank Sousa (frankalfonso1988@gmail.com) • San Juan de los Morros
          </div>
        </div>
      </div>

      {/* Formulario de Feedback */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span>💬</span> Tu Opinión Nos Importa
          </h2>
          <p className="text-slate-500 mt-2">
            Déjanos tus comentarios, sugerencias o repórtanos si encontraste algún problema en el sistema. 
            Ayúdanos a construir la mejor herramienta para el Disco Volador.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre (Opcional)</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="Ej. Carlos Mendoza"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico (Opcional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="tucorreo@ejemplo.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría del Mensaje</label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
              required
            >
              <option value="GENERAL">📝 Comentario General</option>
              <option value="FEATURE">✨ Sugerencia de Nueva Función</option>
              <option value="UX">🎨 Mejora de Interfaz / Usabilidad</option>
              <option value="BUG">🐛 Reporte de Error / Problema</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tu Mensaje</label>
            <textarea
              value={formData.message}
              onChange={e => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition min-h-[120px] resize-y"
              placeholder="Escribe aquí tu comentario, idea o problema detallado..."
              required
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={status === 'submitting' || status === 'success'}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {status === 'submitting' ? 'Enviando...' : status === 'success' ? '¡Enviado con Éxito! ✓' : 'Enviar Comentarios 🚀'}
          </button>
          
          {status === 'error' && (
            <p className="text-red-500 text-sm mt-2 font-medium">{errorMessage}</p>
          )}
        </form>
      </div>
    </div>
  )
}
