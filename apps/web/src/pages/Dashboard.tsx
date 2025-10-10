import React from 'react'
import { NavLink } from 'react-router-dom'

const Card: React.FC<{ title: string; value: string; color: string; subtitle: string }> = ({ title, value, color, subtitle }) => (
  <div className="bg-white rounded-lg shadow-md p-6 text-center">
    <div className={`text-3xl font-bold ${color}`}>{value}</div>
    <div className="text-gray-600">{title}</div>
    <div className="text-xs text-gray-400 mt-1">{subtitle}</div>
  </div>
)

const NavCard: React.FC<{ to: string; title: string; emoji: string; gradient: string; subtitle: string; right?: string }> = ({ to, title, emoji, gradient, subtitle, right }) => (
  <NavLink to={to} className={`${gradient} rounded-xl shadow-lg p-8 text-white transition-transform hover:-translate-y-1 block`}>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-2xl font-bold">{title}</h3>
      <span className="text-4xl" aria-hidden>{emoji}</span>
    </div>
    <p className="opacity-80 mb-4">{subtitle}</p>
    <div className="flex justify-between text-sm opacity-90">
      <span>Ver detalles →</span>
      {right && <span>{right}</span>}
    </div>
  </NavLink>
)

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Jugadores Activos" value="24" color="text-blue-600" subtitle="Temporada 2025" />
        <Card title="Entrenamientos" value="12" color="text-green-600" subtitle="Este mes" />
        <Card title="Torneos" value="5" color="text-purple-600" subtitle="Programados" />
        <Card title="Asistencia Promedio" value="89%" color="text-red-600" subtitle="Últimos 30 días" />
      </div>

      {/* Main Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <NavCard to="/roster" title="Roster Principal" emoji="👥" gradient="bg-gradient-to-br from-sky-500 to-cyan-400" subtitle="Gestiona jugadores y estadísticas del equipo" right="24 Jugadores" />
        <NavCard to="/estadisticas" title="Estadísticas" emoji="📊" gradient="bg-gradient-to-br from-pink-500 to-rose-400" subtitle="Análisis de rendimiento y métricas" />
        <NavCard to="/eventos" title="Calendario" emoji="📅" gradient="bg-gradient-to-br from-emerald-500 to-teal-400" subtitle="Entrenamientos, torneos y eventos" right="Próximo: Mañana" />
        <NavCard to="/eventos" title="Roster Torneo" emoji="🏆" gradient="bg-gradient-to-br from-indigo-500 to-purple-600" subtitle="Selección para competencias" right="Torneo Regional" />
        <NavCard to="/jugadas" title="Jugadas" emoji="⚡" gradient="bg-gradient-to-br from-fuchsia-500 to-yellow-300" subtitle="Animaciones y esquemas tácticos" right="15 activas" />
        <NavCard to="/comunicacion" title="Jerarquía" emoji="🌳" gradient="bg-gradient-to-br from-teal-100 to-rose-100 text-gray-900" subtitle="Estructura organizacional y roles" />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Actividad Reciente</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">JM</div>
            <div className="flex-1">
              <p className="font-semibold">Juan Martínez registró 3 goles en el último entrenamiento</p>
              <p className="text-sm text-gray-600">Hace 2 horas</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">📅</div>
            <div className="flex-1">
              <p className="font-semibold">Nuevo entrenamiento programado para el viernes</p>
              <p className="text-sm text-gray-600">Hace 5 horas</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">🏆</div>
            <div className="flex-1">
              <p className="font-semibold">Roster para Torneo Regional actualizado</p>
              <p className="text-sm text-gray-600">Hace 1 día</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
