import React, { useEffect, useState } from 'react'
import { teamsApi, TeamItem } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../contexts/AuthContext'

export default function AdminTeams() {
  const [teams, setTeams] = useState<TeamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<TeamItem | null>(null)
  const [name, setName] = useState('')
  const [tag, setTag] = useState('')
  const [categories, setCategories] = useState('')
  const [notes, setNotes] = useState('')
  const [color, setColor] = useState('#4f46e5')
  const [logoUrl, setLogoUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { showSuccessToast, showErrorToast } = useToast()
  const { hasRole } = useAuth()

  const loadTeams = async () => {
    setLoading(true)
    try {
      const data = await teamsApi.list()
      setTeams(data)
    } catch (err: any) {
      showErrorToast(err?.response?.data?.error || 'Error al cargar equipos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeams()
  }, [])

  const handleOpenCreate = () => {
    setEditingTeam(null)
    setName('')
    setTag('')
    setCategories('')
    setNotes('')
    setColor('#4f46e5')
    setLogoUrl('')
    setShowCreateModal(true)
  }

  const handleOpenEdit = (team: TeamItem) => {
    setEditingTeam(team)
    setName(team.name)
    setTag(team.tag || '')
    setCategories(team.categories || '')
    setNotes(team.notes || '')
    setColor(team.color || '#4f46e5')
    setLogoUrl(team.logoUrl || '')
    setShowCreateModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      showErrorToast('El nombre del equipo es obligatorio')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        tag: tag.trim() || undefined,
        categories: categories.trim() || undefined,
        notes: notes.trim() || undefined,
        color,
        logoUrl: logoUrl.trim() || undefined,
      }

      if (editingTeam) {
        await teamsApi.update(editingTeam.id, payload)
        showSuccessToast('Equipo actualizado con éxito')
      } else {
        await teamsApi.create(payload)
        showSuccessToast('Equipo creado con éxito')
      }
      setShowCreateModal(false)
      await loadTeams()
    } catch (err: any) {
      showErrorToast(err?.response?.data?.error || 'Error al guardar el equipo')
    } finally {
      setSubmitting(false)
    }
  }

  const isAdminOrDirectiva = hasRole('admin') || hasRole('directiva')

  return (
    <div id="admin-teams-container" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Equipos</h1>
          <p className="text-sm text-gray-600">
            Administra los equipos y divisiones que participan en la plataforma
          </p>
        </div>
        {isAdminOrDirectiva && (
          <button
            id="btn-create-team"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
          >
            + Nuevo Equipo
          </button>
        )}
      </div>

      {/* Grid of Teams */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando equipos...</div>
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500 mb-4">No hay equipos registrados aún en el sistema.</p>
          {isAdminOrDirectiva && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 font-medium"
            >
              Crear el primer equipo
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div
              key={team.id}
              id={`team-card-${team.id}`}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow transition-shadow"
            >
              {/* Colored header stripe */}
              <div
                className="h-3 w-full"
                style={{ backgroundColor: team.color || '#4f46e5' }}
              />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {team.logoUrl ? (
                      <img
                        src={team.logoUrl}
                        alt={team.name}
                        className="w-12 h-12 rounded-full object-cover border"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: team.color || '#4f46e5' }}
                      >
                        {team.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{team.name}</h3>
                    </div>
                  </div>
                  {isAdminOrDirectiva && (
                    <button
                      onClick={() => handleOpenEdit(team)}
                      className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                    >
                      Editar
                    </button>
                  )}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 mt-5 text-center">
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xl font-bold text-gray-900">
                      {team._count?.players ?? 0}
                    </div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mt-0.5">Jugadores</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xl font-bold text-gray-900">
                      {team._count?.users ?? 0}
                    </div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mt-0.5">Usuarios</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xl font-bold text-gray-900">
                      {team._count?.events ?? 0}
                    </div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mt-0.5">Eventos</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 text-xs space-y-2">
                  <div className="flex justify-between items-center text-gray-600">
                    <span className="font-semibold">ID / Tag:</span>
                    <div className="flex gap-1.5 items-center">
                      <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-[10px]">#{team.id}</span>
                      {team.tag ? <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-bold">{team.tag}</span> : '-'}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-start text-gray-600">
                    <span className="font-semibold whitespace-nowrap mt-0.5">Categorías:</span>
                    <span className="text-right ml-2 text-gray-800 line-clamp-2">
                      {team.categories || <span className="text-gray-400 italic">No especificadas</span>}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal create / edit */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              {editingTeam ? 'Editar Equipo' : 'Nuevo Equipo'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Equipo / Club <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Warao, Medusa, Motherflowers"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                  {!editingTeam && (
                    <div className="mt-2">
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                        Sugerencias Base:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: 'Warao', col: '#1E40AF', tag: 'WAR', cat: 'Open Masculino, Mixto' },
                          { label: 'Medusa', col: '#7C3AED', tag: 'MED', cat: 'Mixto' },
                          { label: 'Motherflowers', col: '#E11D48', tag: 'MF', cat: 'Mixto, Femenino' },
                          { label: 'Agente Libre / Refuerzo', col: '#64748b', tag: 'LIB', cat: '' }
                        ].map(sug => (
                          <button
                            key={sug.label}
                            type="button"
                            onClick={() => {
                              setName(sug.label)
                              setColor(sug.col)
                              setTag(sug.tag)
                              setCategories(sug.cat)
                            }}
                            className="text-xs px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-300 text-gray-700 transition-colors"
                          >
                            + {sug.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tag / Abreviación
                  </label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="Ej: WAR, MED, MF"
                    maxLength={5}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categorías Participantes
                  </label>
                  <input
                    type="text"
                    value={categories}
                    onChange={(e) => setCategories(e.target.value)}
                    placeholder="Ej: Open Masculino, Mixto, Femenino"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Categorías en las que participa (separadas por coma).</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color Representativo
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-10 h-10 p-1 border rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm uppercase font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL del Logo <span className="text-gray-500 font-normal text-xs">(Opcional)</span>
                  </label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas / Descripción
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Información adicional del equipo..."
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 min-h-[60px]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : editingTeam ? 'Guardar Cambios' : 'Crear Equipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
