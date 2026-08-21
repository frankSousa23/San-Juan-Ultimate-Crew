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
    setColor('#4f46e5')
    setLogoUrl('')
    setShowCreateModal(true)
  }

  const handleOpenEdit = (team: TeamItem) => {
    setEditingTeam(team)
    setName(team.name)
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
      if (editingTeam) {
        await teamsApi.update(editingTeam.id, {
          name: name.trim(),
          color,
          logoUrl: logoUrl.trim() || undefined,
        })
        showSuccessToast('Equipo actualizado con éxito')
      } else {
        await teamsApi.create({
          name: name.trim(),
          color,
          logoUrl: logoUrl.trim() || undefined,
        })
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
                      <span className="text-xs text-gray-500">ID: {team.id}</span>
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
                <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-gray-100 text-center">
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xl font-bold text-gray-900">
                      {team._count?.players ?? 0}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">Jugadores</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xl font-bold text-gray-900">
                      {team._count?.users ?? 0}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">Usuarios</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-xl font-bold text-gray-900">
                      {team._count?.events ?? 0}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">Eventos</div>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Equipo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Femenino, Open, Master, Sub-20"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                />
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
                    className="w-32 border border-gray-300 rounded px-3 py-2 text-sm"
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
                  placeholder="https://ejemplo.com/logo.png"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
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
