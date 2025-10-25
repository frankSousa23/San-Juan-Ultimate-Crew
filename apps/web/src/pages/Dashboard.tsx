import React from 'react'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Bienvenido al sistema de gestión de San Juan Ultimate</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Jugadores</h3>
          <p className="text-3xl font-bold text-blue-600">25</p>
          <p className="text-sm text-gray-500">Jugadores activos</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Eventos</h3>
          <p className="text-3xl font-bold text-green-600">12</p>
          <p className="text-sm text-gray-500">Eventos este mes</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Finanzas</h3>
          <p className="text-3xl font-bold text-purple-600">$2,500</p>
          <p className="text-sm text-gray-500">Balance actual</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Sistema</h3>
          <p className="text-3xl font-bold text-green-600">Online</p>
          <p className="text-sm text-gray-500">Estado del sistema</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Accesos Rápidos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/roster" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
            <div className="text-2xl mb-2">👥</div>
            <div className="text-sm font-medium">Roster</div>
          </a>
          <a href="/eventos" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
            <div className="text-2xl mb-2">📅</div>
            <div className="text-sm font-medium">Eventos</div>
          </a>
          <a href="/finanzas" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
            <div className="text-2xl mb-2">💰</div>
            <div className="text-sm font-medium">Finanzas</div>
          </a>
          <a href="/admin/monitoring" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm font-medium">Monitoreo</div>
          </a>
        </div>
      </div>
    </div>
  )
}