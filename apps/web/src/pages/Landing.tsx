import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { generateSystemManualPdf } from '../lib/generateManualPdf'
import { generateResourcePdf, RESOURCE_DOCS } from '../lib/generateResourcePdfs'
import toast from 'react-hot-toast'

export const Landing: React.FC = () => {
  const { user, login, isLoading } = useAuth()
  const navigate = useNavigate()

  // Interactive Live Scoreboard Simulator State
  const [teamScoreA, setTeamScoreA] = useState(11)
  const [teamScoreB, setTeamScoreB] = useState(9)
  const [activeLine, setActiveLine] = useState<'O-Line' | 'D-Line'>('O-Line')
  const [lastAction, setLastAction] = useState<string>('Pase largo completado a la zona de gol')
  const [turnoverCount, setTurnoverCount] = useState(2)

  // Interactive Module Showcase Tab
  const [activeTab, setActiveTab] = useState<'anotaciones' | 'roster' | 'torneos' | 'tactica' | 'finanzas' | 'pdf'>('anotaciones')

  // Interactive FAQ Accordion
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  // PDF Generation loading states
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const handleGuestLogin = async () => {
    try {
      toast.loading('Iniciando sesión como Invitado...', { id: 'guest-login' })
      await login('guest@sigedivo.com', '123456')
      toast.success('¡Bienvenido al modo demostración de SIGEDIVO!', { id: 'guest-login' })
      navigate('/', { replace: true })
    } catch (err: any) {
      toast.error('Error al ingresar como invitado', { id: 'guest-login' })
      console.error(err)
    }
  }

  const handleDownloadManual = () => {
    try {
      setGeneratingPdf(true)
      toast.loading('Generando Manual Oficial en PDF...', { id: 'manual-pdf' })
      const doc = generateSystemManualPdf()
      doc.save('SIGEDIVO_Manual_del_Sistema_Oficial.pdf')
      toast.success('¡Manual Oficial descargado exitosamente!', { id: 'manual-pdf' })
    } catch (error) {
      console.error('Error al generar manual PDF:', error)
      toast.error('No se pudo generar el manual en PDF', { id: 'manual-pdf' })
    } finally {
      setGeneratingPdf(false)
    }
  }

  const handleDownloadRulePdf = () => {
    try {
      toast.loading('Generando Reglamento WFDF en PDF...', { id: 'rules-pdf' })
      const doc = generateResourcePdf(RESOURCE_DOCS[1])
      doc.save('Reglamento_Oficial_Ultimate_WFDF.pdf')
      toast.success('Reglamento descargado con éxito', { id: 'rules-pdf' })
    } catch (error) {
      console.error('Error generando reglamento PDF:', error)
      toast.error('Error al descargar PDF', { id: 'rules-pdf' })
    }
  }

  const simulatePoint = (team: 'A' | 'B') => {
    if (team === 'A') {
      setTeamScoreA(prev => prev + 1)
      setLastAction('¡Gol de San Juan Ultimate Crew! Asistencia de #10 a #07 en Endzone.')
    } else {
      setTeamScoreB(prev => prev + 1)
      setLastAction('Gol del equipo rival. Transición ofensiva rápida.')
    }
  }

  const simulateTurnover = () => {
    setTurnoverCount(prev => prev + 1)
    setLastAction('¡Gran Defensa (D-Block)! Intercepción defensiva en la yarda 20.')
  }

  const faqs = [
    {
      q: '¿Qué es SIGEDIVO y a quién está dirigido?',
      a: 'SIGEDIVO (Sistema de Gestión para el Disco Volador) es una plataforma deportiva integral de código abierto diseñada para clubes, selecciones, entrenadores, capitanes y mesas técnicas de Ultimate Frisbee y disciplinas de disco volador. Centraliza Roster, Anotaciones en Vivo, Brackets de Torneos, Estadísticas, Finanzas, Salud y Manuales Oficiales.',
    },
    {
      q: '¿Cómo puedo probar el sistema sin crear una cuenta?',
      a: 'Puedes hacer clic en el botón "🚀 Probar Modo Invitado" en cualquier parte de esta página. Iniciarás sesión con 1 solo clic con credenciales de muestra para explorar todas las pantallas, pizarras, estadísticas y recursos sin comprometer datos reales.',
    },
    {
      q: '¿Puedo registrar mi propio equipo o club?',
      a: '¡Sí! Al registrarte desde el enlace de Registro (/register), puedes crear tu usuario y vincularlo a tu equipo o club. Si eres Administrador o Directiva, podrás configurar tu división, colores institucionales y gestionar las solicitudes de tus atletas.',
    },
    {
      q: '¿La pizarra de anotaciones funciona en celulares en medio de un partido?',
      a: 'Absolutamente. La interfaz de Anotaciones en Vivo y Mesa Técnica está diseñada con botones táctiles de gran tamaño, alto contraste bajo la luz del sol y retroalimentación táctil, permitiendo anotar goles, asistencias y defensas con una sola mano desde la banda.',
    },
    {
      q: '¿Los manuales y reglamentos en PDF requieren conexión a internet?',
      a: 'Los documentos en PDF se compilan directamente en tu navegador usando jsPDF con tipografía vectorial, encabezados oficiales y paginación matemática. Puedes descargarlos al instante incluso con conexiones lentas.',
    },
  ]

  return (
    <div className="w-full bg-slate-50 text-slate-900 font-sans pb-16">
      {/* Top Banner / Beta Announcement */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white px-4 py-2 text-xs sm:text-sm text-center font-medium shadow-inner flex items-center justify-center gap-2 flex-wrap">
        <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider animate-pulse">
          Beta Abierta v1.2.0
        </span>
        <span>Plataforma Oficial para Ultimate Frisbee y Deportes de Disco Volador</span>
        <span className="hidden md:inline text-slate-400">•</span>
        <span className="text-blue-200">Software Libre & Open Source (MIT)</span>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-100 border-b border-slate-200 pt-10 pb-16 sm:pt-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/95 border border-blue-200/90 text-xs sm:text-sm font-bold mb-6 shadow-sm">
            <span className="text-base">🥏</span>
            <span className="font-bold tracking-tight" style={{ color: '#0047AB' }}>
              Sistema Integral de Gestión Deportiva
            </span>
            <span className="bg-[#0047AB] text-white text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">2026</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-tight max-w-4xl mx-auto">
            Organiza, Analiza y Triunfa en el <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600">Disco Volador</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg lg:text-xl text-black dark:text-black font-medium max-w-3xl mx-auto leading-relaxed" style={{ color: '#000000' }}>
            <strong className="text-black font-bold">SIGEDIVO</strong> es la plataforma tecnológica todo-en-uno para equipos y torneos de Ultimate Frisbee. Gestiona rosters multi-división, toma anotaciones táctiles en tiempo real, genera brackets, analiza estadísticas avanzadas y descarga manuales oficiales en PDF.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-xl mx-auto">
            {user ? (
              <Link
                to="/"
                className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-base rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
              >
                <span>🏠 Ir a mi Panel de Control</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-base rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
                >
                  <span>🔐 Iniciar Sesión</span>
                </Link>

                <button
                  type="button"
                  onClick={handleGuestLogin}
                  disabled={isLoading}
                  className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-base rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                >
                  <span>🚀 Probar Modo Invitado (1 Clic)</span>
                </button>

                <Link
                  to="/register"
                  className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 active:scale-95 text-slate-800 font-bold text-base rounded-xl border border-slate-300 shadow-sm transition flex items-center justify-center gap-2"
                >
                  <span>✍️ Registrarse</span>
                </Link>
              </>
            )}
          </div>

          {/* Fast Features Badges */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <p className="text-xs font-bold text-slate-900">Mesa Táctil</p>
                <p className="text-[11px] text-slate-500">Anotaciones en campo</p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <span className="text-2xl">🛡️</span>
              <div>
                <p className="text-xs font-bold text-slate-900">Multi-Equipo</p>
                <p className="text-[11px] text-slate-500">Aislamiento por club</p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="text-xs font-bold text-slate-900">Analytics en Vivo</p>
                <p className="text-[11px] text-slate-500">+/- Plus/Minus & Goles</p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <span className="text-2xl">📄</span>
              <div>
                <p className="text-xs font-bold text-slate-900">PDFs Nativos</p>
                <p className="text-[11px] text-slate-500">Manuales vectoriales</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Scoreboard Simulator */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-700">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-700">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                SIMULADOR INTERACTIVO DE MESA TÉCNICA
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Prueba la fluidez de anotación en tiempo real
              </h2>
              <p className="text-sm text-slate-300 mt-1">
                Haz clic en los botones de acción para simular cómo se registra un partido oficial de Ultimate Frisbee en SIGEDIVO.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-600">
              <button
                type="button"
                onClick={() => setActiveLine('O-Line')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeLine === 'O-Line' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                Ofensiva (O-Line)
              </button>
              <button
                type="button"
                onClick={() => setActiveLine('D-Line')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeLine === 'D-Line' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                Defensiva (D-Line)
              </button>
            </div>
          </div>

          {/* Interactive Scoreboard Display */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Team A */}
            <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 text-center">
              <div className="text-3xl mb-1">🥏</div>
              <h3 className="font-bold text-lg text-white">San Juan Ultimate</h3>
              <p className="text-xs text-blue-300 font-medium">Línea activa: {activeLine}</p>
              <div className="text-5xl font-black text-blue-400 my-3 font-mono">{teamScoreA}</div>
              <button
                type="button"
                onClick={() => simulatePoint('A')}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow transition flex items-center justify-center gap-1.5"
              >
                <span>+1 Gol (Anotar)</span>
              </button>
            </div>

            {/* Match Status & Live Feed */}
            <div className="text-center space-y-3 px-2">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Límite: 15 Puntos • Tiempo: 74' 20"
              </div>
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-left space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Última jugada registrada:</span>
                  <span className="text-emerald-400 font-mono">EN VIVO</span>
                </div>
                <p className="text-sm font-semibold text-slate-100 leading-snug">
                  {lastAction}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>Defensas (D's): <strong className="text-white">{turnoverCount}</strong></span>
                  <span>Plus/Minus: <strong className="text-emerald-400">+{teamScoreA - teamScoreB}</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={simulateTurnover}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  🛡️ Registrar Defensa (D-Block)
                </button>
              </div>
            </div>

            {/* Team B */}
            <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 text-center">
              <div className="text-3xl mb-1">⚔️</div>
              <h3 className="font-bold text-lg text-white">Equipo Rival</h3>
              <p className="text-xs text-slate-400 font-medium">División Open Oficial</p>
              <div className="text-5xl font-black text-rose-400 my-3 font-mono">{teamScoreB}</div>
              <button
                type="button"
                onClick={() => simulatePoint('B')}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow transition flex items-center justify-center gap-1.5"
              >
                <span>+1 Gol Rival</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Feature Explorer Tabs */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
            Explora los Módulos del Sistema
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl mx-auto">
            Cada módulo ha sido programado para resolver las necesidades reales de los atletas, entrenadores y directivas de Ultimate Frisbee.
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 scrollbar-thin">
          <button
            type="button"
            onClick={() => setActiveTab('anotaciones')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'anotaciones'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            ⏱️ Mesa Técnica en Vivo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'roster'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            👥 Roster & Multi-Equipo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('torneos')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'torneos'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            🏆 Torneos & Brackets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tactica')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'tactica'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            🎯 Playbook Táctico
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('finanzas')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'finanzas'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            💰 Finanzas & Tesorería
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'pdf'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            📄 Manuales & PDFs
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="mt-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl">
          {activeTab === 'anotaciones' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                  Módulo de Campo
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mt-3">
                  Pizarra Táctica y Mesa Técnica Táctil
                </h3>
                <p className="text-slate-600 mt-2 leading-relaxed">
                  Permite al anotador o cuerpo técnico llevar las incidencias punto a punto en tiempo real. Diseñado para usarse con una sola mano en smartphones y tablets.
                </p>
                <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> Registro de Pasador (Asistencia) y Receptor (Gol).
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> Conteo de D-Blocks (Defensas) y Turnovers por línea.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> Cálculo inmediato de +/- Plus/Minus por jugador.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> Cronómetro de juego y alertas de medio tiempo / límite de tiempo.
                  </li>
                </ul>
                <div className="mt-6">
                  <Link
                    to="/login?next=/anotaciones"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow transition"
                  >
                    <span>Entrar a Anotaciones</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-inner border border-slate-800 font-mono text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
                  <span>RESUMEN EN VIVO</span>
                  <span className="text-emerald-400">PARTIDO EN CURSO</span>
                </div>
                <div className="space-y-1.5">
                  <div className="p-2 bg-slate-800/80 rounded flex justify-between">
                    <span>#10 Carlos M. (Handler)</span>
                    <span className="text-blue-300">3 Asistencias • 1 Gol • +4</span>
                  </div>
                  <div className="p-2 bg-slate-800/80 rounded flex justify-between">
                    <span>#07 Andrea R. (Cutter)</span>
                    <span className="text-blue-300">4 Goles • 2 D's • +6</span>
                  </div>
                  <div className="p-2 bg-slate-800/80 rounded flex justify-between">
                    <span>#23 Frank S. (Híbrido)</span>
                    <span className="text-blue-300">2 Asistencias • 3 D's • +5</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roster' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                  Gestión de Plantilla
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mt-3">
                  Roster Multi-División y Perfiles de Atletas
                </h3>
                <p className="text-slate-600 mt-2 leading-relaxed">
                  Organiza a tus jugadores por categoría (Open, Femenil, Mixto, Master), asigna posiciones tácticas (Handler, Cutter, Híbrido), dorsales y monitorea su disponibilidad física.
                </p>
                <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> Dorsales independientes por equipo con indexación segura.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> Ficha médica con seguimiento de lesiones y altas.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> Roles asignados: Capitán, Entrenador, Directiva, Jugador, Refuerzo.
                  </li>
                </ul>
                <div className="mt-6">
                  <Link
                    to="/login?next=/roster"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow transition"
                  >
                    <span>Ver Módulo Roster</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>ATLETAS DESTACADOS</span>
                  <span className="text-indigo-600">DIVISIÓN OPEN</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-bold text-slate-900">#10 Frank Sousa</div>
                    <div className="text-[11px] text-slate-500">Handler Principal • Capitán</div>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                      Activo
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-bold text-slate-900">#07 Valeria Gómez</div>
                    <div className="text-[11px] text-slate-500">Cutter Profundo • Sub-Cap</div>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                      Activo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'torneos' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">
                  Logística Competitiva
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mt-3">
                  Eventos, Convocatorias y Brackets de Torneos
                </h3>
                <p className="text-slate-600 mt-2 leading-relaxed">
                  Crea eventos de entrenamiento o competiciones oficiales. Visualiza cuadros eliminatorios (Brackets) en tiempo real y confirma asistencia de atletas (RSVP).
                </p>
                <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> Brackets interactivos de Cuartos, Semifinales y Final.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> Convocatorias con confirmación Sí / No / En Duda.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> Integración con scouting de equipos rivales.
                  </li>
                </ul>
                <div className="mt-6">
                  <Link
                    to="/login?next=/eventos"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl shadow transition"
                  >
                    <span>Explorar Torneos</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 text-xs">
                <div className="font-bold text-amber-400 mb-3 uppercase tracking-wider">
                  Torneo Nacional Open 2026 (Bracket Final)
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 bg-slate-800 rounded-lg flex justify-between items-center border border-slate-700">
                    <span>Semifinal 1: San Juan UC vs Furia Disc</span>
                    <span className="font-bold font-mono text-emerald-400">15 - 12 (Final)</span>
                  </div>
                  <div className="p-2.5 bg-slate-800 rounded-lg flex justify-between items-center border border-slate-700">
                    <span>Semifinal 2: Caracas Ultimate vs Relámpagos</span>
                    <span className="font-bold font-mono text-emerald-400">15 - 14 (Final)</span>
                  </div>
                  <div className="p-2.5 bg-indigo-900/60 rounded-lg flex justify-between items-center border border-indigo-500">
                    <span className="font-bold">GRAN FINAL: San Juan UC vs Caracas Ultimate</span>
                    <span className="font-bold font-mono text-amber-300">Por Jugar</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tactica' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2.5 py-1 rounded-md">
                  Estrategia y Pizarrón
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mt-3">
                  Playbook Táctico y Pizarra Libre
                </h3>
                <p className="text-slate-600 mt-2 leading-relaxed">
                  Diseña y comparte jugadas de ataque y esquemas defensivos. Explica tácticas clave como Vertical Stack, Horizontal Stack, Zona Copa (Cup Defense) y transiciones rápidas.
                </p>
                <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> Dibujo vectorial en tiempo real sobre campo reglamentario.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> Biblioteca de tácticas organizadas por ofensiva y defensiva.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> Visualizador paso a paso para charlas técnicas previas al partido.
                  </li>
                </ul>
                <div className="mt-6">
                  <Link
                    to="/login?next=/jugadas"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow transition"
                  >
                    <span>Ver Playbook Táctico</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center">
                <div className="w-full h-44 bg-emerald-800 rounded-xl border-2 border-white flex flex-col justify-between p-3 text-white font-mono text-xs relative overflow-hidden shadow-inner">
                  <div className="flex justify-between border-b border-emerald-600 pb-1 text-[10px] text-emerald-200">
                    <span>ZONA DE GOL (ENDZONE)</span>
                    <span>VERTICAL STACK • FORMACIÓN OFENSIVA</span>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-[10px] shadow">H1</span>
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-[10px] shadow">H2</span>
                    <span className="w-6 h-6 rounded-full bg-yellow-400 text-slate-900 flex items-center justify-center font-bold text-[10px] shadow">C1</span>
                    <span className="w-6 h-6 rounded-full bg-yellow-400 text-slate-900 flex items-center justify-center font-bold text-[10px] shadow">C2</span>
                    <span className="w-6 h-6 rounded-full bg-yellow-400 text-slate-900 flex items-center justify-center font-bold text-[10px] shadow">C3</span>
                  </div>
                  <div className="flex justify-between border-t border-emerald-600 pt-1 text-[10px] text-emerald-200">
                    <span>LÍNEA DE BRICK</span>
                    <span>LANZADOR CON DISCO (PIVOT)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'finanzas' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                  Transparencia Contable
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mt-3">
                  Control de Finanzas y Tesorería
                </h3>
                <p className="text-slate-600 mt-2 leading-relaxed">
                  Permite a la Tesorería y Directiva del club llevar un registro transparente de cuotas mensuales, inscripciones a torneos (Bid Fees), compra de discos y balances de caja.
                </p>
                <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> Registro categorizado de Ingresos y Egresos.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> Monitoreo del estado de pago de cada atleta.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> Balance neto y caja chica en tiempo real.
                  </li>
                </ul>
                <div className="mt-6">
                  <Link
                    to="/login?next=/finanzas"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow transition"
                  >
                    <span>Ver Módulo Finanzas</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                    <span className="text-[11px] font-bold text-emerald-800">Ingresos Totales</span>
                    <p className="text-xl font-bold text-emerald-700 mt-1">$1,450.00</p>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center">
                    <span className="text-[11px] font-bold text-rose-800">Egresos / Torneos</span>
                    <p className="text-xl font-bold text-rose-700 mt-1">$620.00</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-900 text-white rounded-xl text-center">
                  <span className="text-xs text-slate-400 font-medium">Balance Neto Disponible</span>
                  <p className="text-2xl font-black text-emerald-400 mt-0.5 font-mono">+$830.00</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pdf' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                  Exportación Vectorial
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mt-3">
                  Manual del Sistema y Documentos Técnicos en PDF
                </h3>
                <p className="text-slate-600 mt-2 leading-relaxed">
                  Generación instantánea de documentos oficiales estructurados en formato PDF: el Manual Maestro del Sistema (8 páginas de alta fidelidad), Planillas de Juego, Reglamento WFDF y Guías de Espíritu de Juego.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadManual}
                    disabled={generatingPdf}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow transition flex items-center gap-2"
                  >
                    <span>📘 Descargar Manual del Sistema (PDF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadRulePdf}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold rounded-xl shadow transition flex items-center gap-2"
                  >
                    <span>📖 Descargar Reglamento WFDF (PDF)</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                <div className="font-bold text-slate-800 uppercase tracking-wider">
                  Documentación Oficial Incluida
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                  <div>
                    <strong className="text-slate-900">Manual Maestro de Operaciones SIGEDIVO</strong>
                    <p className="text-slate-500 text-[11px]">8 Páginas • Guía de Roles, Anotación y Arquitectura</p>
                  </div>
                  <span className="font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">PDF</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                  <div>
                    <strong className="text-slate-900">Reglas Oficiales WFDF 2025/2026</strong>
                    <p className="text-slate-500 text-[11px]">Dimensiones, Pases, Faltas y Saques (Pull)</p>
                  </div>
                  <span className="font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">PDF</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Role-Based Access Control (RBAC) Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Roles de Acceso y Perfiles en SIGEDIVO
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-xl mx-auto">
            El sistema se adapta a la función de cada miembro en la organización deportiva.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl mb-3">
              👑
            </div>
            <h3 className="font-bold text-slate-900 text-base">Administrador / Directiva</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Aprobación de nuevos usuarios, creación de equipos/divisiones, asignación de permisos globales, monitoreo y auditoría del sistema.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl mb-3">
              🧢
            </div>
            <h3 className="font-bold text-slate-900 text-base">Capitán & Entrenador</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Gestión del Roster oficial, creación de eventos, convocatorias RSVP, diseño de jugadas en el Playbook y revisión de estadísticas.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl mb-3">
              💰
            </div>
            <h3 className="font-bold text-slate-900 text-base">Tesorería</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Administración de caja chica, pagos de mensualidades, control de deudas de torneos (Bid fees) y balances contables transparentes.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl mb-3">
              ⏱️
            </div>
            <h3 className="font-bold text-slate-900 text-base">Mesa Técnica / Anotador</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Registro rápido de goles, asistencias, defensas y faltas durante los partidos en vivo desde la línea de banda.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-xl mb-3">
              🏃
            </div>
            <h3 className="font-bold text-slate-900 text-base">Jugador / Atleta</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Perfil personal, confirmación de asistencia a prácticas, consulta de jugadas, noticias internas y estadísticas individuales.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl mb-3">
              🌟
            </div>
            <h3 className="font-bold text-slate-900 text-base">Invitado / Refuerzo (Guest)</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Acceso de sólo lectura para evaluar el sistema, explorar el Roster, ver brackets y descargar la documentación oficial sin registro.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Preguntas Frecuentes (FAQ)
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Todo lo que necesitas saber antes de comenzar a usar SIGEDIVO.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = expandedFaq === index
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition"
                >
                  <span className="font-bold text-slate-900 text-sm sm:text-base">
                    {faq.q}
                  </span>
                  <span className={`text-xl font-bold text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    ▾
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Final Call to Action Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 text-white rounded-3xl p-8 sm:p-12 shadow-2xl">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            ¿Listo para llevar la gestión de tu equipo al siguiente nivel?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Comienza a utilizar SIGEDIVO hoy mismo. Ingresa con el modo de demostración o regístrate con tu club.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-100 active:scale-95 text-blue-900 font-extrabold text-base rounded-xl shadow-lg transition"
            >
              🔐 Iniciar Sesión en SIGEDIVO
            </Link>
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="w-full sm:w-auto px-7 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-extrabold text-base rounded-xl shadow-lg transition"
            >
              🚀 Entrar como Invitado (Modo Demo)
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 pt-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center text-xs text-slate-500 space-y-4">
        <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold text-slate-700">
          <Link to="/login" className="hover:text-blue-600">Iniciar Sesión</Link>
          <Link to="/register" className="hover:text-blue-600">Registrarse</Link>
          <Link to="/forgot-password" className="hover:text-blue-600">Recuperar Contraseña</Link>
          <button type="button" onClick={handleDownloadManual} className="hover:text-blue-600 font-medium">
            Manual del Sistema (PDF)
          </button>
        </div>

        <p className="max-w-2xl mx-auto leading-relaxed">
          <strong>SIGEDIVO (Sistema de Gestión para el Disco Volador)</strong> — Desarrollado con ❤️ por <strong>Frank Sousa</strong> (<code>frankSousa23</code>) para la comunidad de Ultimate Frisbee en San Juan de los Morros, Guárico, Venezuela y el mundo.
        </p>

        <p className="text-[11px] text-slate-400">
          Licencia Pública de Código Abierto (MIT) • Compatible con normativas WFDF 2025/2026.
        </p>
      </footer>
    </div>
  )
}

export default Landing
