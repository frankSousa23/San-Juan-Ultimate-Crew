import React from 'react'

interface ProfileRequestsProps {
  user: any
  myRequests: any[]
  requestNote: string
  setRequestNote: (note: string) => void
  requestPlayerId: string
  setRequestPlayerId: (id: string) => void
  showPlayerDataForm: boolean
  setShowPlayerDataForm: (show: boolean) => void
  playerData: any
  setPlayerData: (data: any | ((prev: any) => any)) => void
  handleRoleRequest: () => void
}

export function ProfileRequests({
  user,
  myRequests,
  requestNote,
  setRequestNote,
  requestPlayerId,
  setRequestPlayerId,
  showPlayerDataForm,
  setShowPlayerDataForm,
  playerData,
  setPlayerData,
  handleRoleRequest
}: ProfileRequestsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Mis Solicitudes de Rol</h3>
      
      {/* Create new request for guests */}
      {user.roles && user.roles.includes('guest') && !user.roles.includes('player') && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-indigo-900 mb-2">Solicitar Rol de Jugador</h4>
          <p className="text-sm text-indigo-700 mb-4">
            Si eres parte del equipo, puedes solicitar acceso como jugador. Puedes vincular un jugador existente o crear uno nuevo.
          </p>
          <div className="space-y-3">
            {!showPlayerDataForm && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID de Jugador (opcional)</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={requestPlayerId}
                  onChange={e => {
                    const val = e.target.value
                    if (val === '' || (Number(val) > 0 && Number.isInteger(Number(val)))) {
                      setRequestPlayerId(val)
                    }
                  }}
                  placeholder="Ingresa tu número de jugador si ya estás en el roster"
                  min="1"
                />
                <button
                  type="button"
                  className="mt-2 text-sm text-indigo-600 hover:underline"
                  onClick={() => setShowPlayerDataForm(true)}
                >
                  O crear un nuevo jugador
                </button>
              </div>
            )}
            
            {showPlayerDataForm && (
              <div className="bg-white border border-indigo-300 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-indigo-900">Datos del Jugador</h5>
                  <button
                    type="button"
                    className="text-sm text-gray-600 hover:text-gray-800"
                    onClick={() => {
                      setShowPlayerDataForm(false)
                      setPlayerData({ number: '', position: 'CUTTER', heightCm: '', experience: '' })
                    }}
                  >
                    Usar ID existente
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="w-full border rounded px-3 py-2 text-sm"
                      value={playerData.number}
                      onChange={e => {
                        const val = e.target.value
                        if (val === '' || (Number(val) > 0 && Number.isInteger(Number(val)))) {
                          setPlayerData((prev: any) => ({ ...prev, number: val }))
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Posición <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full border rounded px-3 py-2 text-sm"
                      value={playerData.position}
                      onChange={e => setPlayerData((prev: any) => ({ ...prev, position: e.target.value as any }))}
                    >
                      <option value="HANDLER">Manejador</option>
                      <option value="CUTTER">Cortador</option>
                      <option value="HYBRID">Híbrido</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Altura (cm) <span className="text-gray-500 text-xs">(opcional)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full border rounded px-3 py-2 text-sm"
                      value={playerData.heightCm}
                      onChange={e => {
                        const val = e.target.value
                        if (val === '' || (Number(val) > 0 && Number.isInteger(Number(val)))) {
                          setPlayerData((prev: any) => ({ ...prev, heightCm: val }))
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Experiencia <span className="text-gray-500 text-xs">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 text-sm"
                      value={playerData.experience}
                      onChange={e => setPlayerData((prev: any) => ({ ...prev, experience: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nota (opcional)</label>
              <textarea
                className="w-full border rounded px-3 py-2 text-sm"
                value={requestNote}
                onChange={e => setRequestNote(e.target.value)}
                placeholder="Agrega información adicional sobre tu solicitud"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{requestNote.length}/500 caracteres</p>
            </div>
            <button
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              onClick={handleRoleRequest}
              disabled={(!requestNote.trim() && !requestPlayerId && !showPlayerDataForm) || (showPlayerDataForm && (!playerData.number || !playerData.position))}
            >
              Enviar Solicitud
            </button>
          </div>
        </div>
      )}

      {/* List of requests */}
      {myRequests.length > 0 ? (
        <div className="space-y-3">
          {myRequests.map((r: any) => (
            <div key={r.id} className="border rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-800">Solicitud #{r.id}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    r.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    r.status === 'DENIED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {r.status === 'APPROVED' ? '✓ Aprobada' : 
                     r.status === 'DENIED' ? '✗ Denegada' : 
                     '⏳ Pendiente'}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(r.createdAt).toLocaleDateString('es-ES')}
                </div>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <div><span className="font-medium">Rol solicitado:</span> {r.role}</div>
                {r.playerId && <div><span className="font-medium">ID de Jugador:</span> {r.playerId}</div>}
                {r.note && (
                  <div>
                    <span className="font-medium">Nota:</span>
                    <div className="text-gray-600 mt-1 bg-gray-50 p-2 rounded">{r.note}</div>
                  </div>
                )}
                {r.decidedAt && (
                  <div className="text-xs text-gray-500 mt-2">
                    Decidida el: {new Date(r.decidedAt).toLocaleString('es-ES')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <div className="text-gray-500">No tienes solicitudes de rol</div>
          {user.roles && user.roles.includes('guest') && !user.roles.includes('player') && (
            <div className="text-sm text-gray-400 mt-2">Usa el formulario arriba para crear una</div>
          )}
        </div>
      )}
    </div>
  )
}
