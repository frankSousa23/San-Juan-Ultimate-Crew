import React, { useState } from 'react'
import { downloadSystemManualPdf } from '../lib/generateManualPdf'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function SystemManualModal({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'roles' | 'modules' | 'flow' | 'guest' | 'faq'>('roles')
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-xl">
              📘
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Manual del Usuario & Guía de Operaciones SIGEDIVO
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  PDF Oficial 2026
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Arquitectura del sistema, matriz de roles y permisos, y manual con capturas de todas las vistas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow transition active:scale-95"
            >
              <span>{isDownloading ? 'Generando PDF...' : '📥 Descargar PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Cerrar modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Action bar for mobile download */}
        <div className="sm:hidden bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-medium text-blue-900">Documento imprimible oficial</span>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow"
          >
            {isDownloading ? 'Generando...' : '📥 Descargar PDF'}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 overflow-x-auto gap-2 py-2">
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-3 py-2 text-xs sm:text-sm font-bold rounded-lg transition whitespace-nowrap ${
              activeTab === 'roles'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            👥 Roles y Permisos
          </button>
          <button
            onClick={() => setActiveTab('flow')}
            className={`px-3 py-2 text-xs sm:text-sm font-bold rounded-lg transition whitespace-nowrap ${
              activeTab === 'flow'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            🛡️ Aprobación & Seguridad
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`px-3 py-2 text-xs sm:text-sm font-bold rounded-lg transition whitespace-nowrap ${
              activeTab === 'modules'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            🖥️ Vistas & Capturas
          </button>
          <button
            onClick={() => setActiveTab('guest')}
            className={`px-3 py-2 text-xs sm:text-sm font-bold rounded-lg transition whitespace-nowrap ${
              activeTab === 'guest'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            🌟 Modo Invitado (Guest)
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-3 py-2 text-xs sm:text-sm font-bold rounded-lg transition whitespace-nowrap ${
              activeTab === 'faq'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            ❓ Preguntas Frecuentes
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-slate-800 space-y-6 text-sm">
          
          {/* TAB: ROLES & PERMISSIONS */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-950">
                <h3 className="font-bold text-base flex items-center gap-2 mb-1">
                  <span>🛡️</span> Matriz de Control de Acceso Basado en Roles (RBAC)
                </h3>
                <p className="text-xs text-blue-800">
                  Cada cuenta tiene asignado un conjunto de permisos específicos para preservar la confidencialidad,
                  la integridad de las alineaciones de torneos y el control contable del club.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Super Admin */}
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-purple-900 flex items-center gap-1.5 text-base">
                      👑 Super Admin
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-200 text-purple-800">
                      Control Total
                    </span>
                  </div>
                  <p className="text-xs text-purple-950">
                    Máxima autoridad técnica y administrativa. Aprueba nuevos usuarios registrados, asigna roles,
                    monitorea logs de auditoría, gestiona finanzas completas y configura el sistema.
                  </p>
                  <div className="text-[11px] font-mono text-purple-800 bg-white/80 p-2 rounded-lg border border-purple-200">
                    <strong>Permisos:</strong> users:manage, audit:view, roster:manage, events:manage, finance:manage, annotations:manage, plays:manage, injuries:manage
                  </div>
                </div>

                {/* Capitán */}
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-blue-900 flex items-center gap-1.5 text-base">
                      🧢 Capitán de Equipo
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-200 text-blue-800">
                      Liderazgo Deportivo
                    </span>
                  </div>
                  <p className="text-xs text-blue-950">
                    Gestiona el roster de torneos, define líneas (O-Line y D-Line), convoca jugadores, registra
                    anotaciones en vivo durante partidos y evalúa el Spirit of the Game (SOTG).
                  </p>
                  <div className="text-[11px] font-mono text-blue-800 bg-white/80 p-2 rounded-lg border border-blue-200">
                    <strong>Permisos:</strong> roster:manage, events:manage, annotations:manage, attendance:manage, plays:manage, rivals:manage, injuries:manage
                  </div>
                </div>

                {/* Entrenador */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-900 flex items-center gap-1.5 text-base">
                      📋 Entrenador (Coach)
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                      Técnico y Táctico
                    </span>
                  </div>
                  <p className="text-xs text-emerald-950">
                    Planifica sesiones de entrenamiento, publica jugadas tácticas en el pizarrón, supervisa la
                    asistencia semanal y monitorea el estado clínico y lesiones del plantel.
                  </p>
                  <div className="text-[11px] font-mono text-emerald-800 bg-white/80 p-2 rounded-lg border border-emerald-200">
                    <strong>Permisos:</strong> events:manage, plays:manage, attendance:manage, resources:manage, injuries:manage, annotations:manage
                  </div>
                </div>

                {/* Tesorero */}
                <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-teal-900 flex items-center gap-1.5 text-base">
                      💰 Tesorero
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-200 text-teal-800">
                      Gestión Financiera
                    </span>
                  </div>
                  <p className="text-xs text-teal-950">
                    Control de cuentas bancarias y caja chica. Registra ingresos (cuotas, inscripciones) y egresos
                    (alquiler de canchas, uniformes, hidratación) y exporta balances contables.
                  </p>
                  <div className="text-[11px] font-mono text-teal-800 bg-white/80 p-2 rounded-lg border border-teal-200">
                    <strong>Permisos:</strong> finance:manage, finance:view, roster:view, events:view, statistics:view
                  </div>
                </div>

                {/* Anotador */}
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-900 flex items-center gap-1.5 text-base">
                      🎯 Mesa Técnica / Anotador
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                      Estadísticas Oficiales
                    </span>
                  </div>
                  <p className="text-xs text-amber-950">
                    Registro jugada a jugada durante partidos: goles, asistencias, defensas, drops y turnovers.
                    Cálculo automático de la tabla de posiciones y rubricación SOTG.
                  </p>
                  <div className="text-[11px] font-mono text-amber-800 bg-white/80 p-2 rounded-lg border border-amber-200">
                    <strong>Permisos:</strong> annotations:manage, annotations:view, statistics:view, events:view, roster:view
                  </div>
                </div>

                {/* Jugador */}
                <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sky-900 flex items-center gap-1.5 text-base">
                      🏃 Jugador del Roster
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-200 text-sky-800">
                      Miembro Activo
                    </span>
                  </div>
                  <p className="text-xs text-sky-950">
                    Consulta el calendario de entrenamientos y torneos, confirma asistencia con un clic, revisa
                    sus estadísticas individuales, visualiza el pizarrón táctico y participa en el chat de evento.
                  </p>
                  <div className="text-[11px] font-mono text-sky-800 bg-white/80 p-2 rounded-lg border border-sky-200">
                    <strong>Permisos:</strong> roster:view, events:view, attendance:view, statistics:view, plays:view, communications:manage
                  </div>
                </div>

                {/* Invitado */}
                <div className="p-4 rounded-xl border border-slate-300 bg-slate-100 md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5 text-base">
                      🌟 Invitado / Visitante (guest)
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-300 text-slate-800">
                      Modo Muestra / Solo Lectura
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">
                    Diseñado para exploración pública y demostración del sistema. Permite ver el roster general, calendario de eventos,
                    estadísticas globales, biblioteca de jugadas y este manual. No puede modificar datos ni acceder a finanzas privadas.
                  </p>
                  <div className="text-[11px] font-mono text-slate-700 bg-white/90 p-2 rounded-lg border border-slate-200">
                    <strong>Permisos:</strong> roster:view, events:view, statistics:view, plays:view, resources:view, annotations:view, rivals:view
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: FLOW & APPROVALS */}
          {activeTab === 'flow' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-950">
                <h3 className="font-bold text-base flex items-center gap-2 mb-1">
                  <span>🔐</span> Arquitectura de Usuarios y Flujo de Aprobación Obligatorio
                </h3>
                <p className="text-xs text-amber-900">
                  Para garantizar que solo los miembros autorizados del club puedan acceder a la información deportiva y financiera,
                  el sistema implementa un ciclo de vida de usuarios estricto.
                </p>
              </div>

              {/* Step by step card */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Restauración y Usuarios Base</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Al reiniciar o restaurar el sistema, únicamente se inicializan dos cuentas pre-aprobadas:
                      el <strong>Super Administrador</strong> (<code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">frankalfonso1988@gmail.com</code>)
                      y el <strong>Invitado de Muestra</strong> (<code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">guest@sigedivo.com</code>).
                      El rol Admin no se exhibe en la pantalla de login para proteger las credenciales administrativas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Registro de Nuevos Integrantes</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Cualquier jugador, capitán o miembro nuevo completa el formulario en <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-700">/register</code>.
                      Su cuenta se almacena con estado <span className="font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded text-[11px]">PENDING</span>.
                      Si intenta iniciar sesión de inmediato, el sistema le informará que debe esperar la aprobación del Administrador.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Panel de Aprobaciones del Administrador (/admin/usuarios)</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      El Super Admin ingresa al módulo de gestión de usuarios, donde visualiza todas las solicitudes pendientes.
                      Puede seleccionar el rol a otorgar (Jugador, Capitán, Entrenador, Tesorero), vincular el usuario a un jugador existente del Roster
                      o registrarlo con su número de dorsal y posición, y hacer clic en <strong>"Aprobar Usuario"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Activación Inmediata y Acceso Concedido</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Una vez aprobado, el estado cambia a <span className="font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded text-[11px]">APPROVED</span>.
                      El usuario ya puede iniciar sesión libremente con su correo y contraseña, accediendo a todas las funciones de su rol asignado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MODULES & SCREEN CAPTURES */}
          {activeTab === 'modules' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="font-bold text-base text-slate-900 mb-1">
                  🖥️ Guía de Vistas del Sistema con Capturas y Esquemas
                </h3>
                <p className="text-xs text-slate-600">
                  A continuación se detalla el funcionamiento y la interfaz de cada módulo de la plataforma SIGEDIVO.
                </p>
              </div>

              {/* Roster Module */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
                  <span className="font-bold text-sm">1. Módulo de Roster & Jugadores (/roster)</span>
                  <span className="text-xs text-blue-300">Gestión de Dorsales y Posiciones</span>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-xs text-slate-700">
                    Permite visualizar y administrar a todos los jugadores activos del club. Incluye filtros por posición
                    (<strong>Handler</strong>: lanzador principal, <strong>Cutter</strong>: receptor de pases largos, <strong>Hybrid</strong>: polivalente),
                    estatura física en centímetros, experiencia previa y estado médico.
                  </p>
                  {/* Simulated Screen Mockup */}
                  <div className="bg-slate-950 text-slate-200 rounded-lg p-3 font-mono text-xs border border-slate-800 space-y-1.5">
                    <div className="text-slate-400 border-b border-slate-800 pb-1 flex justify-between">
                      <span>[VISTA: ROSTER SIGEDIVO]</span>
                      <span className="text-emerald-400">Total: 8 Jugadores Activos</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <span className="text-amber-400 font-bold">#1 Franco Sousa</span>
                        <div className="text-slate-400">Posición: HANDLER | 182 cm</div>
                        <div className="text-xs text-emerald-400">Estado: ACTIVO • Capitán</div>
                      </div>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <span className="text-amber-400 font-bold">#2 Carlos Mendoza</span>
                        <div className="text-slate-400">Posición: CUTTER | 185 cm</div>
                        <div className="text-xs text-emerald-400">Estado: ACTIVO • O-Line</div>
                      </div>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <span className="text-amber-400 font-bold">#3 Eduardo Silva</span>
                        <div className="text-slate-400">Posición: HYBRID | 178 cm</div>
                        <div className="text-xs text-emerald-400">Estado: ACTIVO • Coach</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Scoring Module */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
                  <span className="font-bold text-sm">2. Módulo de Anotaciones en Vivo & SOTG (/eventos/:id/anotaciones)</span>
                  <span className="text-xs text-amber-300">Marcador en Tiempo Real</span>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-xs text-slate-700">
                    Interfaz de alta velocidad para registrar jugada por jugada durante partidos oficiales. Con un solo clic
                    se adjudican goles, asistencias, defensas o turnovers a cada jugador, actualizando la tabla acumulativa al instante.
                  </p>
                  {/* Simulated Screen Mockup */}
                  <div className="bg-slate-950 text-slate-200 rounded-lg p-3 font-mono text-xs border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-center bg-slate-900 p-2 rounded border border-slate-800">
                      <div className="text-blue-400 font-bold text-sm">SAN JUAN ULTIMATE (15)</div>
                      <div className="text-slate-500 font-bold text-xs">VS</div>
                      <div className="text-red-400 font-bold text-sm">DRAGONES VALENCIA (11)</div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
                      <span className="bg-emerald-950 border border-emerald-700 text-emerald-300 px-2 py-1 rounded">[+1 GOL #2 Carlos Mendoza]</span>
                      <span className="bg-blue-950 border border-blue-700 text-blue-300 px-2 py-1 rounded">[+1 ASIST #1 Franco Sousa]</span>
                      <span className="bg-indigo-950 border border-indigo-700 text-indigo-300 px-2 py-1 rounded">[+1 DEFENSA #5 Gabriel Torres]</span>
                      <span className="bg-amber-950 border border-amber-700 text-amber-300 px-2 py-1 rounded">[EVALUAR SOTG 10/20]</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tactic & Playbook */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
                  <span className="font-bold text-sm">3. Módulo de Táctica & Pizarrón de Jugadas (/jugadas)</span>
                  <span className="text-xs text-emerald-300">Playbook Ofensivo y Defensivo</span>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-xs text-slate-700">
                    Repositorio visual de estrategias del equipo: <strong>Vertical Stack</strong> (flujo de cortes en profundidad),
                    <strong>Horizontal Stack</strong> (creación de pasillos laterales) y <strong>Defensa de Zona 3-3-1 Cup</strong> (contención contra viento).
                  </p>
                  <div className="bg-slate-950 text-slate-200 rounded-lg p-3 font-mono text-xs border border-slate-800 space-y-1">
                    <div className="text-emerald-400 font-bold">[ESTRATEGIA] Vertical Stack - Break Flow</div>
                    <div className="text-slate-300 text-[11px]">
                      1. Handlers dominan el centro • 2. Cutter 1 rompe en diagonal al lado abierto • 3. Pase huck a la zona de gol
                    </div>
                  </div>
                </div>
              </div>

              {/* Finance Module */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
                  <span className="font-bold text-sm">4. Módulo de Finanzas & Libro Contable (/finanzas)</span>
                  <span className="text-xs text-teal-300">Cuentas, Ingresos y Egresos</span>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-xs text-slate-700">
                    Transparencia y control económico: administración de cuentas (Banco, Caja Chica, Pago Móvil), balance neto
                    en tiempo real y registro de cuotas mensuales de pretemporada e inscripciones de torneos.
                  </p>
                  <div className="bg-slate-950 text-slate-200 rounded-lg p-3 font-mono text-xs border border-slate-800 space-y-1">
                    <div className="flex justify-between text-teal-300 font-bold">
                      <span>[BALANCE NETO: +$880.00]</span>
                      <span>Ingresos: $1,300.00 | Egresos: $420.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: GUEST MODE */}
          {activeTab === 'guest' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-950">
                <h3 className="font-bold text-base flex items-center gap-2 mb-1">
                  <span>🌟</span> Experiencia y Alcance del Modo Invitado (Guest Role)
                </h3>
                <p className="text-xs text-emerald-800">
                  El rol Invitado permite a cualquier persona interesada en el club explorar las capacidades del sistema
                  sin riesgo de alterar la información de partidos o finanzas.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <h4 className="font-bold text-emerald-800 text-sm flex items-center gap-1.5">
                    <span>✅</span> Lo que PUEDE hacer un Invitado:
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-1.5 pl-4 list-disc">
                    <li>Explorar el <strong>Roster de Jugadores</strong> y sus posiciones oficiales.</li>
                    <li>Consultar el <strong>Calendario de Eventos</strong> y fechas de próximos torneos.</li>
                    <li>Ver las <strong>Estadísticas Generales</strong> de goles, asistencias y defensas.</li>
                    <li>Estudiar las <strong>Jugadas Tácticas</strong> publicadas en el Playbook.</li>
                    <li>Leer y descargar este <strong>Manual Completo del Sistema en PDF</strong>.</li>
                    <li>Solicitar su incorporación oficial al club mediante el formulario de Registro.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <h4 className="font-bold text-red-800 text-sm flex items-center gap-1.5">
                    <span>🚫</span> Lo que NO puede hacer un Invitado:
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-1.5 pl-4 list-disc">
                    <li>Crear, editar o eliminar jugadores del Roster oficial.</li>
                    <li>Modificar el marcador o registrar asistencias en partidos en vivo.</li>
                    <li>Acceder al libro de <strong>Finanzas</strong> o modificar cuentas bancarias.</li>
                    <li>Aprobar o gestionar otros usuarios en el panel administrativo.</li>
                    <li>Consultar logs de auditoría interna de seguridad.</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 text-xs">
                <strong>¿Cómo ingresar como Invitado?</strong> En la pantalla de inicio de sesión (<code className="bg-white px-1 py-0.5 rounded text-blue-700">/login</code>),
                haz clic en el botón <strong>"Entrar en Modo Invitado"</strong>. El sistema te otorgará acceso de demostración con 1 solo clic.
              </div>
            </div>
          )}

          {/* TAB: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900">
                <h3 className="font-bold text-base mb-1">
                  <span>❓</span> Preguntas Frecuentes y Soporte Técnico SIGEDIVO
                </h3>
                <p className="text-xs text-slate-600">
                  Respuestas rápidas a las consultas más habituales sobre la plataforma.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <h4 className="font-bold text-sm text-slate-900">¿Por qué mi cuenta recién registrada dice "Pendiente de Aprobación"?</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Por seguridad del club, todos los registros requieren que el Super Administrador verifique la identidad del usuario y le asigne su rol deportivo correspondiente (Jugador, Capitán, Entrenador o Tesorero) antes de activar el acceso.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <h4 className="font-bold text-sm text-slate-900">¿Cómo se descarga este manual en PDF para imprimir?</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Haz clic en el botón superior azul <strong>"📥 Descargar PDF"</strong>. Se generará un documento PDF completo de alta calidad con todas las tablas, diagramas y especificaciones técnicas.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <h4 className="font-bold text-sm text-slate-900">¿Cómo contactar al cuerpo técnico o directiva?</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Puedes escribir a <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-bold">contacto@sigedivo.com</code> o acercarte a los entrenamientos oficiales los martes y jueves a las 19:00 en la Cancha Principal 1.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              SIGEDIVO © 2026 • Documento Oficial
            </span>
            {user && (
              <span className="text-[11px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-md">
                Sesión: {user.name || user.email}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition active:scale-95 flex items-center gap-1.5"
            >
              <span>{isDownloading ? 'Generando PDF...' : '📥 Descargar PDF'}</span>
            </button>
            {user && (
              <button
                onClick={handleLogout}
                className="px-3 sm:px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs sm:text-sm rounded-xl transition active:scale-95 flex items-center gap-1.5"
                title="Cerrar sesión actual"
              >
                <span>🚪 Salir</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs sm:text-sm rounded-xl transition"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
