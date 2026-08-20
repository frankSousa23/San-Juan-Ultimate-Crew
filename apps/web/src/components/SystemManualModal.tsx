import React, { useState } from 'react'
import { downloadSystemManualPdf } from '../lib/generateManualPdf'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function SystemManualModal({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'roles' | 'modules' | 'tactics' | 'flow' | 'license' | 'guest' | 'faq'>('roles')
  const [isDownloading, setIsDownloading] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleDownload = () => {
    setIsDownloading(true)
    try {
      downloadSystemManualPdf()
    } catch (e) {
      console.error('Error generating PDF:', e)
    } finally {
      setTimeout(() => setIsDownloading(false), 800)
    }
  }

  const handleLogout = async () => {
    onClose()
    await logout()
    navigate('/login')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-300 w-full max-w-6xl h-[94vh] max-h-[960px] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header - Fixed shrink-0 */}
        <div className="shrink-0 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between border-b border-slate-800 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-xl sm:text-2xl shrink-0 shadow-inner">
              📘
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-white truncate">
                  Manual del Usuario & Guía de Operaciones SIGEDIVO
                </h2>
                <span className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-sm shrink-0">
                  PDF Oficial 2026
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 truncate hidden sm:block">
                Arquitectura del sistema, matriz de roles y permisos, diagramas tácticos WFDF y capturas de vistas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-black rounded-xl shadow-md transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span>{isDownloading ? 'Generando...' : '📥 Descargar PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
              aria-label="Cerrar modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation - Fixed shrink-0 with guaranteed non-clipping padding */}
        <div className="shrink-0 bg-slate-100/90 border-b border-slate-200 px-3 sm:px-6 py-2.5 overflow-x-auto scrollbar-thin flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('roles')}
            className={`shrink-0 px-3.5 py-2 text-xs sm:text-sm font-black rounded-xl transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'roles'
                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600/30'
                : 'text-slate-700 bg-white hover:bg-slate-200 border border-slate-200/80'
            }`}
          >
            <span>👥</span> Roles y Permisos
          </button>
          <button
            onClick={() => setActiveTab('flow')}
            className={`shrink-0 px-3.5 py-2 text-xs sm:text-sm font-black rounded-xl transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'flow'
                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600/30'
                : 'text-slate-700 bg-white hover:bg-slate-200 border border-slate-200/80'
            }`}
          >
            <span>🛡️</span> Aprobación & Seguridad
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`shrink-0 px-3.5 py-2 text-xs sm:text-sm font-black rounded-xl transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'modules'
                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600/30'
                : 'text-slate-700 bg-white hover:bg-slate-200 border border-slate-200/80'
            }`}
          >
            <span>🖥️</span> Vistas & Capturas
          </button>
          <button
            onClick={() => setActiveTab('tactics')}
            className={`shrink-0 px-3.5 py-2 text-xs sm:text-sm font-black rounded-xl transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'tactics'
                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600/30'
                : 'text-slate-700 bg-white hover:bg-slate-200 border border-slate-200/80'
            }`}
          >
            <span>📐</span> Cancha & Táctica WFDF
          </button>
          <button
            onClick={() => setActiveTab('license')}
            className={`shrink-0 px-3.5 py-2 text-xs sm:text-sm font-black rounded-xl transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'license'
                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600/30'
                : 'text-slate-700 bg-white hover:bg-slate-200 border border-slate-200/80'
            }`}
          >
            <span>📜</span> Licencia & Normativa
          </button>
          <button
            onClick={() => setActiveTab('guest')}
            className={`shrink-0 px-3.5 py-2 text-xs sm:text-sm font-black rounded-xl transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'guest'
                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600/30'
                : 'text-slate-700 bg-white hover:bg-slate-200 border border-slate-200/80'
            }`}
          >
            <span>🌟</span> Modo Invitado (Guest)
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`shrink-0 px-3.5 py-2 text-xs sm:text-sm font-black rounded-xl transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'faq'
                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600/30'
                : 'text-slate-700 bg-white hover:bg-slate-200 border border-slate-200/80'
            }`}
          >
            <span>❓</span> Preguntas Frecuentes
          </button>
        </div>

        {/* Content Body - Scrollable Area */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto flex-1 text-slate-800 space-y-6 text-sm bg-slate-50/50">
          
          {/* TAB: ROLES & PERMISSIONS */}
          {activeTab === 'roles' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Banner intro */}
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/40 text-blue-200 text-xs font-bold">
                    <span>🛡️</span> Matriz de Control de Acceso Basado en Roles (RBAC)
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Estructura Jerárquica y Permisos del Club
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-100 max-w-3xl leading-relaxed">
                    SIGEDIVO aplica un estricto modelo RBAC para garantizar la integridad contable, la confidencialidad médica y la gestión técnica de alineaciones y partidos oficiales de Ultimate Frisbee.
                  </p>
                </div>
                <div className="shrink-0 bg-white/10 p-3 rounded-xl border border-white/20 text-center">
                  <div className="text-2xl font-black text-amber-300">7 Roles</div>
                  <div className="text-[11px] text-blue-200 font-bold uppercase tracking-wider">Especializados</div>
                </div>
              </div>

              {/* Graphic Diagram: Role Hierarchy */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <span>📊</span> Esquema Gráfico de Dependencias y Roles
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-purple-50 border-2 border-purple-300 rounded-xl">
                    <div className="text-lg">👑</div>
                    <div className="font-black text-xs text-purple-900">ADMINISTRACIÓN</div>
                    <div className="text-[11px] text-purple-700 font-bold mt-1">Super Admin</div>
                    <div className="text-[10px] text-purple-600 mt-1 bg-white p-1 rounded border border-purple-200">Aprobación, Auditoría, Configuración</div>
                  </div>
                  <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl">
                    <div className="text-lg">🧢 📋</div>
                    <div className="font-black text-xs text-emerald-900">CUERPO TÉCNICO</div>
                    <div className="text-[11px] text-emerald-700 font-bold mt-1">Capitán • Entrenador</div>
                    <div className="text-[10px] text-emerald-600 mt-1 bg-white p-1 rounded border border-emerald-200">Alineaciones, Táctica, Asistencias</div>
                  </div>
                  <div className="p-3 bg-teal-50 border-2 border-teal-300 rounded-xl">
                    <div className="text-lg">💰 🎯</div>
                    <div className="font-black text-xs text-teal-900">OPERACIONES</div>
                    <div className="text-[11px] text-teal-700 font-bold mt-1">Tesorero • Anotador</div>
                    <div className="text-[10px] text-teal-600 mt-1 bg-white p-1 rounded border border-teal-200">Finanzas, Marcador en Vivo, SOTG</div>
                  </div>
                  <div className="p-3 bg-sky-50 border-2 border-sky-300 rounded-xl">
                    <div className="text-lg">🏃 🌟</div>
                    <div className="font-black text-xs text-sky-900">PLANTEL & DEMO</div>
                    <div className="text-[11px] text-sky-700 font-bold mt-1">Jugador • Invitado</div>
                    <div className="text-[10px] text-sky-600 mt-1 bg-white p-1 rounded border border-sky-200">Convocatorias, Playbook, Muestra</div>
                  </div>
                </div>
              </div>

              {/* Roles Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Super Admin */}
                <div className="p-5 rounded-2xl border-2 border-purple-200 bg-purple-50/60 space-y-3 shadow-sm hover:shadow transition">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-purple-950 flex items-center gap-2 text-base">
                      <span>👑</span> Super Admin (admin)
                    </span>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-purple-200 text-purple-900 border border-purple-300">
                      Control Total
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-purple-950 leading-relaxed">
                    Máxima autoridad técnica y administrativa. Aprueba nuevos usuarios registrados, asigna roles, monitorea logs inmutables de auditoría, gestiona finanzas globales y configura los parámetros de la plataforma.
                  </p>
                  <div className="text-xs font-mono text-purple-900 bg-white/90 p-2.5 rounded-xl border border-purple-200 space-y-1">
                    <strong className="block text-[11px] uppercase tracking-wider text-purple-700">Permisos Activos:</strong>
                    <div className="flex flex-wrap gap-1">
                      {['users:manage', 'audit:view', 'roster:manage', 'events:manage', 'finance:manage', 'annotations:manage', 'plays:manage', 'injuries:manage', 'rivals:manage'].map(p => (
                        <span key={p} className="px-1.5 py-0.5 bg-purple-100 rounded text-[10px] font-bold text-purple-800">{p}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Capitán */}
                <div className="p-5 rounded-2xl border-2 border-blue-200 bg-blue-50/60 space-y-3 shadow-sm hover:shadow transition">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-blue-950 flex items-center gap-2 text-base">
                      <span>🧢</span> Capitán de Equipo (captain)
                    </span>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-blue-200 text-blue-900 border border-blue-300">
                      Liderazgo Deportivo
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-blue-950 leading-relaxed">
                    Gestiona el roster de torneos, define líneas (Línea O ofensiva y Línea D defensiva), convoca jugadores, registra anotaciones en vivo durante partidos y evalúa el Espíritu de Juego (SOTG).
                  </p>
                  <div className="text-xs font-mono text-blue-900 bg-white/90 p-2.5 rounded-xl border border-blue-200 space-y-1">
                    <strong className="block text-[11px] uppercase tracking-wider text-blue-700">Permisos Activos:</strong>
                    <div className="flex flex-wrap gap-1">
                      {['roster:manage', 'events:manage', 'annotations:manage', 'attendance:manage', 'plays:manage', 'rivals:manage', 'injuries:manage'].map(p => (
                        <span key={p} className="px-1.5 py-0.5 bg-blue-100 rounded text-[10px] font-bold text-blue-800">{p}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Entrenador */}
                <div className="p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 space-y-3 shadow-sm hover:shadow transition">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-emerald-950 flex items-center gap-2 text-base">
                      <span>📋</span> Entrenador / Coach (coach)
                    </span>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900 border border-emerald-300">
                      Técnico y Táctico
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
                    Planifica sesiones de entrenamiento, publica jugadas tácticas en el pizarrón, supervisa la asistencia semanal y monitorea el estado clínico y lesiones del plantel.
                  </p>
                  <div className="text-xs font-mono text-emerald-900 bg-white/90 p-2.5 rounded-xl border border-emerald-200 space-y-1">
                    <strong className="block text-[11px] uppercase tracking-wider text-emerald-700">Permisos Activos:</strong>
                    <div className="flex flex-wrap gap-1">
                      {['events:manage', 'plays:manage', 'attendance:manage', 'resources:manage', 'injuries:manage', 'annotations:manage'].map(p => (
                        <span key={p} className="px-1.5 py-0.5 bg-emerald-100 rounded text-[10px] font-bold text-emerald-800">{p}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tesorero */}
                <div className="p-5 rounded-2xl border-2 border-teal-200 bg-teal-50/60 space-y-3 shadow-sm hover:shadow transition">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-teal-950 flex items-center gap-2 text-base">
                      <span>💰</span> Tesorero (treasurer)
                    </span>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-teal-200 text-teal-900 border border-teal-300">
                      Gestión Financiera
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-teal-950 leading-relaxed">
                    Control de cuentas bancarias y caja chica. Registra ingresos (cuotas, inscripciones) y egresos (alquiler de canchas, uniformes, hidratación) y exporta balances contables.
                  </p>
                  <div className="text-xs font-mono text-teal-900 bg-white/90 p-2.5 rounded-xl border border-teal-200 space-y-1">
                    <strong className="block text-[11px] uppercase tracking-wider text-teal-700">Permisos Activos:</strong>
                    <div className="flex flex-wrap gap-1">
                      {['finance:manage', 'finance:view', 'roster:view', 'events:view', 'statistics:view'].map(p => (
                        <span key={p} className="px-1.5 py-0.5 bg-teal-100 rounded text-[10px] font-bold text-teal-800">{p}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Anotador */}
                <div className="p-5 rounded-2xl border-2 border-amber-200 bg-amber-50/60 space-y-3 shadow-sm hover:shadow transition">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-amber-950 flex items-center gap-2 text-base">
                      <span>🎯</span> Mesa Técnica / Anotador (annotator)
                    </span>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                      Estadísticas Oficiales
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-950 leading-relaxed">
                    Registro jugada a jugada durante partidos: goles, asistencias, defensas, drops y turnovers. Cálculo automático de la tabla de posiciones y rubricación SOTG.
                  </p>
                  <div className="text-xs font-mono text-amber-900 bg-white/90 p-2.5 rounded-xl border border-amber-200 space-y-1">
                    <strong className="block text-[11px] uppercase tracking-wider text-amber-700">Permisos Activos:</strong>
                    <div className="flex flex-wrap gap-1">
                      {['annotations:manage', 'annotations:view', 'statistics:view', 'events:view', 'roster:view', 'rivals:view'].map(p => (
                        <span key={p} className="px-1.5 py-0.5 bg-amber-100 rounded text-[10px] font-bold text-amber-800">{p}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Jugador */}
                <div className="p-5 rounded-2xl border-2 border-sky-200 bg-sky-50/60 space-y-3 shadow-sm hover:shadow transition">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sky-950 flex items-center gap-2 text-base">
                      <span>🏃</span> Jugador del Roster (player)
                    </span>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-sky-200 text-sky-900 border border-sky-300">
                      Miembro Activo
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-sky-950 leading-relaxed">
                    Consulta el calendario de entrenamientos y torneos, confirma asistencia con un clic, revisa sus estadísticas individuales, visualiza el pizarrón táctico y participa en los canales.
                  </p>
                  <div className="text-xs font-mono text-sky-900 bg-white/90 p-2.5 rounded-xl border border-sky-200 space-y-1">
                    <strong className="block text-[11px] uppercase tracking-wider text-sky-700">Permisos Activos:</strong>
                    <div className="flex flex-wrap gap-1">
                      {['roster:view', 'events:view', 'attendance:view', 'statistics:view', 'plays:view', 'communications:manage'].map(p => (
                        <span key={p} className="px-1.5 py-0.5 bg-sky-100 rounded text-[10px] font-bold text-sky-800">{p}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: FLOW & APPROVALS */}
          {activeTab === 'flow' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-gradient-to-r from-amber-900 to-orange-950 rounded-2xl p-5 sm:p-6 text-white shadow-md">
                <h3 className="font-black text-xl sm:text-2xl flex items-center gap-2 mb-2">
                  <span>🔐</span> Flujo de Registro, Verificación y Aprobación
                </h3>
                <p className="text-xs sm:text-sm text-amber-100 leading-relaxed max-w-3xl">
                  Para preservar la privacidad deportiva y contable del club, ningún usuario registrado puede ingresar hasta que el Super Administrador valide su identidad y le asigne su rol y dorsal correspondiente.
                </p>
              </div>

              {/* Interactive Visual Stepper with SVG graphics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border-2 border-blue-200 shadow-sm relative space-y-2">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-base shadow">
                    1
                  </div>
                  <h4 className="font-black text-slate-900 text-sm">Registro Web</h4>
                  <p className="text-xs text-slate-600">
                    El deportista ingresa en <code className="bg-blue-50 text-blue-700 font-bold px-1 rounded">/register</code>, indica nombre, correo y contraseña.
                  </p>
                  <div className="pt-2">
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-black rounded-md border border-amber-300">
                      ESTADO: PENDING
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border-2 border-amber-200 shadow-sm relative space-y-2">
                  <div className="w-10 h-10 rounded-full bg-amber-600 text-white font-black flex items-center justify-center text-base shadow">
                    2
                  </div>
                  <h4 className="font-black text-slate-900 text-sm">Validación Admin</h4>
                  <p className="text-xs text-slate-600">
                    El Super Admin accede a <code className="bg-amber-50 text-amber-800 font-bold px-1 rounded">/admin/usuarios</code> y visualiza la solicitud pendiente.
                  </p>
                  <div className="pt-2">
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-[10px] font-black rounded-md border border-purple-300">
                      ASIGNACIÓN DE ROL
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border-2 border-purple-200 shadow-sm relative space-y-2">
                  <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-black flex items-center justify-center text-base shadow">
                    3
                  </div>
                  <h4 className="font-black text-slate-900 text-sm">Vinculación Roster</h4>
                  <p className="text-xs text-slate-600">
                    Se vincula con un jugador existente del Roster o se crea uno nuevo con su dorsal y posición oficial.
                  </p>
                  <div className="pt-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-[10px] font-black rounded-md border border-blue-300">
                      DORSAL & FICHA
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border-2 border-emerald-200 shadow-sm relative space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-base shadow">
                    4
                  </div>
                  <h4 className="font-black text-slate-900 text-sm">Acceso Concedido</h4>
                  <p className="text-xs text-slate-600">
                    El usuario inicia sesión inmediatamente con sus credenciales y accede a todas las funciones habilitadas.
                  </p>
                  <div className="pt-2">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md border border-emerald-300">
                      ESTADO: APPROVED ✓
                    </span>
                  </div>
                </div>
              </div>

              {/* Security & Audit notice */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                  <span>🛡️</span> Registro Inmutable de Auditoría & Seguridad
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Cada acción crítica (aprobación de usuario, cambio de rol, registro financiero o eliminación de eventos) genera un registro inmutable con marca de tiempo UTC, dirección IP y el ID del usuario autorizador en la tabla de auditoría interna de SIGEDIVO.
                </p>
              </div>
            </div>
          )}

          {/* TAB: MODULES & SCREEN CAPTURES */}
          {activeTab === 'modules' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md">
                <h3 className="font-black text-xl sm:text-2xl text-white mb-2 flex items-center gap-2">
                  <span>🖥️</span> Catálogo de Módulos & Pizarras de SIGEDIVO
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
                  Recorrido visual explicativo por cada una de las herramientas diseñadas para la gestión táctica, deportiva y organizativa del Disco Volador.
                </p>
              </div>

              {/* Grid of Views with Visual Mockups */}
              <div className="space-y-5">
                
                {/* 1. Roster */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
                    <span className="font-black text-sm sm:text-base flex items-center gap-2">
                      <span>1️⃣</span> Roster del Equipo & Jugadores (/roster)
                    </span>
                    <span className="text-xs text-blue-300 font-bold bg-blue-900/60 px-2.5 py-0.5 rounded-full border border-blue-700">
                      Dorsales & Posiciones
                    </span>
                  </div>
                  <div className="p-5 space-y-4">
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      Permite administrar la nómina activa de atletas. Incluye filtros por posición: <strong>Manejador (Handler)</strong> para control de disco, <strong>Cortador (Cutter)</strong> para ataque en profundidad e <strong>Híbrido</strong> para polivalencia.
                    </p>
                    {/* Visual Mockup Card */}
                    <div className="bg-slate-950 p-4 rounded-xl text-white border border-slate-800 font-mono text-xs space-y-3 shadow-inner">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-slate-400">
                        <span className="text-emerald-400 font-bold">● ROSTER SIGEDIVO 2026</span>
                        <span>Total: 8 Atletas Registrados</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                          <div className="text-amber-400 font-bold text-xs">#1 Franco Sousa</div>
                          <div className="text-slate-400">Posición: MANEJADOR • 182 cm</div>
                          <div className="text-emerald-400 text-[10px] font-bold mt-1">CAPITÁN • ACTIVO</div>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                          <div className="text-amber-400 font-bold text-xs">#2 Carlos Mendoza</div>
                          <div className="text-slate-400">Posición: CORTADOR • 185 cm</div>
                          <div className="text-blue-400 text-[10px] font-bold mt-1">LÍNEA O • ACTIVO</div>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                          <div className="text-amber-400 font-bold text-xs">#3 Eduardo Silva</div>
                          <div className="text-slate-400">Posición: HÍBRIDO • 178 cm</div>
                          <div className="text-purple-400 text-[10px] font-bold mt-1">COACH • ACTIVO</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Anotaciones en Vivo */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
                    <span className="font-black text-sm sm:text-base flex items-center gap-2">
                      <span>2️⃣</span> Anotaciones en Vivo & Mesa Técnica (/eventos/:id/anotaciones)
                    </span>
                    <span className="text-xs text-amber-300 font-bold bg-amber-900/60 px-2.5 py-0.5 rounded-full border border-amber-700">
                      Marcador en Tiempo Real
                    </span>
                  </div>
                  <div className="p-5 space-y-4">
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      Pizarra táctica de alta velocidad para registro de eventos en partidos oficiales y amistosos multiequipo. Permite computar goles, asistencias cruzadas, bloqueos (D), pérdidas de posesión (turnovers) y rubricar el Espíritu de Juego (SOTG).
                    </p>
                    {/* Visual Mockup Card */}
                    <div className="bg-slate-950 p-4 rounded-xl text-white border border-slate-800 font-mono text-xs space-y-3 shadow-inner">
                      <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                        <div className="text-blue-400 font-black text-base sm:text-lg">SIGEDIVO (15)</div>
                        <div className="text-slate-500 font-bold text-xs">VS FINAL</div>
                        <div className="text-red-400 font-black text-base sm:text-lg">DRAGONES (11)</div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                        <div className="bg-emerald-950/80 border border-emerald-600 text-emerald-300 p-2 rounded text-center font-bold">
                          ⚽ +1 GOL
                        </div>
                        <div className="bg-blue-950/80 border border-blue-600 text-blue-300 p-2 rounded text-center font-bold">
                          🎯 +1 ASISTENCIA
                        </div>
                        <div className="bg-purple-950/80 border border-purple-600 text-purple-300 p-2 rounded text-center font-bold">
                          🛡️ +1 DEFENSA (D)
                        </div>
                        <div className="bg-amber-950/80 border border-amber-600 text-amber-300 p-2 rounded text-center font-bold">
                          🤝 SOTG: 10/20
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Finanzas */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
                    <span className="font-black text-sm sm:text-base flex items-center gap-2">
                      <span>3️⃣</span> Finanzas & Libro Contable (/finanzas)
                    </span>
                    <span className="text-xs text-teal-300 font-bold bg-teal-900/60 px-2.5 py-0.5 rounded-full border border-teal-700">
                      Balance & Cuotas
                    </span>
                  </div>
                  <div className="p-5 space-y-4">
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      Administración transparente de cuentas (Banco, Caja Chica, Pago Móvil), balance de ingresos por cuotas de pretemporada y egresos por canchas e hidratación.
                    </p>
                    <div className="bg-slate-950 p-4 rounded-xl text-white border border-slate-800 font-mono text-xs shadow-inner flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="text-teal-400 font-bold text-sm">BALANCE NETO: +$880.00 USD</div>
                      <div className="text-slate-400 text-xs">Ingresos: $1,300.00 | Egresos: $420.00</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: TACTICS & WFDF FIELD */}
          {activeTab === 'tactics' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-gradient-to-r from-emerald-900 to-teal-950 rounded-2xl p-5 sm:p-6 text-white shadow-md">
                <h3 className="font-black text-xl sm:text-2xl text-white mb-2 flex items-center gap-2">
                  <span>📐</span> Dimensiones Oficiales WFDF & Formaciones Tácticas
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100 max-w-3xl leading-relaxed">
                  Especificaciones técnicas del campo reglamentario de Ultimate Frisbee (Césped 100m x 37m) y estrategias de juego integradas en el playbook de SIGEDIVO.
                </p>
              </div>

              {/* Visual Field Diagram (SVG) */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span>🏟️</span> Dimensiones Reglamentarias WFDF (Césped)
                  </h4>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    100m x 37m
                  </span>
                </div>

                {/* Drawn SVG Field */}
                <div className="w-full overflow-x-auto bg-emerald-800 p-4 rounded-xl text-white shadow-inner">
                  <svg className="w-full min-w-[600px] h-48" viewBox="0 0 1000 370" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Campo Principal */}
                    <rect x="10" y="10" width="980" height="350" fill="#15803d" stroke="#ffffff" strokeWidth="4" />
                    
                    {/* End Zone Izquierda (18m) */}
                    <rect x="10" y="10" width="180" height="350" fill="#166534" stroke="#ffffff" strokeWidth="4" />
                    <text x="100" y="195" fill="#fef08a" fontSize="24" fontWeight="bold" textAnchor="middle">END ZONE (18m)</text>
                    
                    {/* Zona Central de Juego (64m) */}
                    <rect x="190" y="10" width="620" height="350" fill="#15803d" stroke="#ffffff" strokeWidth="4" />
                    <text x="500" y="195" fill="#ffffff" fontSize="28" fontWeight="black" textAnchor="middle">CAMPO CENTRAL (64m x 37m)</text>
                    
                    {/* End Zone Derecha (18m) */}
                    <rect x="810" y="10" width="180" height="350" fill="#166534" stroke="#ffffff" strokeWidth="4" />
                    <text x="900" y="195" fill="#fef08a" fontSize="24" fontWeight="bold" textAnchor="middle">END ZONE (18m)</text>
                    
                    {/* Brick Marks (18m de la línea de gol) */}
                    <circle cx="370" cy="185" r="8" fill="#facc15" stroke="#000" strokeWidth="2" />
                    <text x="370" y="215" fill="#fef08a" fontSize="14" fontWeight="bold" textAnchor="middle">Brick Mark (18m)</text>

                    <circle cx="630" cy="185" r="8" fill="#facc15" stroke="#000" strokeWidth="2" />
                    <text x="630" y="215" fill="#fef08a" fontSize="14" fontWeight="bold" textAnchor="middle">Brick Mark (18m)</text>
                  </svg>
                </div>
              </div>

              {/* Tactical Formations Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border-2 border-emerald-200 shadow-sm space-y-2">
                  <div className="font-black text-emerald-950 text-sm flex items-center gap-1.5">
                    <span>1️⃣</span> Vertical Stack (V-Stack)
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    2 o 3 Manejadores en la base con 4 o 5 Cortadores alineados en columna central, abriendo pasillos laterales despejados a los lados abierto y cerrado (break side).
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border-2 border-blue-200 shadow-sm space-y-2">
                  <div className="font-black text-blue-950 text-sm flex items-center gap-1.5">
                    <span>2️⃣</span> Horizontal Stack (H-Stack)
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    3 Manejadores en abanico y 4 Cortadores distribuidos a lo ancho del campo. Crea dos carriles de aislamiento centrales ideales para pases largos (hucks).
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border-2 border-purple-200 shadow-sm space-y-2">
                  <div className="font-black text-purple-950 text-sm flex items-center gap-1.5">
                    <span>3️⃣</span> Zona 3-3-1 Cup
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Defensa de contención contra viento: 3 jugadores en la Copa (Cup) asfixian lanzamientos, 3 medios cubren pases flotados y 1 fondo previene el huck largo.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: LICENSE & LEGAL */}
          {activeTab === 'license' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-md">
                <h3 className="font-black text-xl sm:text-2xl text-white mb-2 flex items-center gap-2">
                  <span>📜</span> Licencia Institucional & Certificación de Normativa
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                  Declaración oficial de uso, propiedad intelectual, estándares de la Federación Mundial de Disco Volador (WFDF) y política de privacidad de datos de atletas.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <span>⚖️</span> Licencia Institucional SIGEDIVO 2026
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Este software ha sido desarrollado para modernizar y facilitar la administración técnica, arbitral y financiera de clubes, ligas y federaciones de Disco Volador.
                  </p>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700">
                    Autor: Frank Sousa (frankalfonso1988@gmail.com)<br />
                    Edición: 2026 Oficial • San Juan de los Morros
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <span>🏅</span> Cumplimiento de Reglas WFDF 2025-2028
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    El sistema de anotaciones, rubricación de faltas y evaluación SOTG (Espíritu de Juego) se rigen íntegramente por los estándares oficiales de la World Flying Disc Federation (WFDF) y la Federación Venezolana de Disco Volador (FMDV).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: GUEST MODE */}
          {activeTab === 'guest' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-gradient-to-r from-emerald-900 to-teal-950 rounded-2xl p-5 sm:p-6 text-white shadow-md">
                <h3 className="font-black text-xl sm:text-2xl text-white mb-2 flex items-center gap-2">
                  <span>🌟</span> Modo Invitado (Guest Role) / Demo Pública
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100 max-w-3xl leading-relaxed">
                  Permite a cualquier aficionado, directivo o deportista explorar la plataforma sin alterar estadísticas oficiales.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border-2 border-emerald-200 bg-white shadow-sm space-y-2">
                  <h4 className="font-black text-emerald-900 text-sm flex items-center gap-2">
                    <span>✅</span> Funciones Habilitadas:
                  </h4>
                  <ul className="text-xs text-slate-700 space-y-1.5 pl-4 list-disc">
                    <li>Exploración del <strong>Roster de Jugadores</strong> y dorsales.</li>
                    <li>Consulta del <strong>Calendario de Eventos</strong> y torneos.</li>
                    <li>Estadísticas globales de goles, asistencias y defensas.</li>
                    <li>Visualización del <strong>Playbook Táctico</strong> de jugadas.</li>
                    <li>Descarga de este <strong>Manual Oficial en PDF</strong>.</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl border-2 border-rose-200 bg-white shadow-sm space-y-2">
                  <h4 className="font-black text-rose-900 text-sm flex items-center gap-2">
                    <span>🚫</span> Restricciones por Seguridad:
                  </h4>
                  <ul className="text-xs text-slate-700 space-y-1.5 pl-4 list-disc">
                    <li>No puede modificar marcadores ni anotaciones en vivo.</li>
                    <li>No tiene acceso al módulo contable de <strong>Finanzas</strong>.</li>
                    <li>No puede editar fichas médicas ni historiales de lesiones.</li>
                    <li>No puede administrar usuarios ni ver logs de auditoría.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-black text-slate-900 text-sm">¿Por qué mi cuenta recién registrada dice "Pendiente de Aprobación"?</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Por seguridad e integridad de las alineaciones y datos contables, el Super Administrador debe verificar la identidad del deportista y asignarle su rol oficial antes de permitir el ingreso.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-black text-slate-900 text-sm">¿Cómo se descarga este manual completo en PDF?</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Haz clic en el botón azul <strong>"📥 Descargar PDF"</strong> en la cabecera o pie de este diálogo. Se generará un PDF de alta calidad listo para imprimir o enviar por correo.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-black text-slate-900 text-sm">¿Cómo contactar al cuerpo técnico o administración?</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Puedes escribir directamente a <code className="bg-blue-50 text-blue-800 font-bold px-1.5 py-0.5 rounded">contacto@sigedivo.com</code> o enviar un comentario mediante la sección "Acerca de SIGEDIVO".
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer - Fixed shrink-0 */}
        <div className="shrink-0 bg-slate-100 border-t border-slate-200 px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-black text-slate-800">SIGEDIVO © 2026</span>
            <span>•</span>
            <span>Documentación & Manual Oficial</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-xl shadow transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>{isDownloading ? 'Generando...' : '📥 Descargar PDF'}</span>
            </button>
            {user && (
              <button
                onClick={handleLogout}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs sm:text-sm rounded-xl transition active:scale-95 cursor-pointer"
              >
                <span>🚪 Salir</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
