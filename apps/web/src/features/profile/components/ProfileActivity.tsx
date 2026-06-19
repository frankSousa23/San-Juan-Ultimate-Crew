import React from 'react'

export function ProfileActivity({ loadingActivity, activityLogs }: { loadingActivity: boolean, activityLogs: any[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Historial de Actividad</h3>
      {loadingActivity ? (
        <div className="text-gray-500">Cargando actividad...</div>
      ) : activityLogs.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {activityLogs.map((log: any) => (
            <div key={log.id} className="border rounded-lg p-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{log.action}</div>
                  <div className="text-sm text-gray-600">{log.entityType} #{log.entityId}</div>
                  {log.details && (
                    <div className="text-xs text-gray-500 mt-1">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(log.createdAt).toLocaleString('es-ES')}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500">No hay actividad registrada</div>
      )}
    </div>
  )
}
