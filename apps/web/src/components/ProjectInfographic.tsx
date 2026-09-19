import React, { useState } from 'react'

interface ProjectInfographicProps {
  className?: string
  showDetailedCards?: boolean
}

export const ProjectInfographic: React.FC<ProjectInfographicProps> = ({
  className = '',
  showDetailedCards = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div id="project-infographic-container" className={`w-full ${className}`}>
      {/* Visual Infographic Card */}
      <div className="relative group overflow-hidden rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl">
        {/* Top bar header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
            <div>
              <h3 className="text-sm font-black tracking-wide text-white uppercase flex items-center gap-2">
                Infografía Oficial de Arquitectura e Identidad
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  2026 Actualizada
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                SIGEDIVO: La Revolución Digital en la Gestión del Ultimate Frisbee
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="infographic-fullscreen-btn"
              onClick={() => setIsExpanded(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 border border-cyan-500/30 transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>🔍</span>
              <span>Pantalla Completa</span>
            </button>
            <a
              id="infographic-download-png-btn"
              href="/SIGEDIVO__Gestión_de_Disco_Volador.png"
              download="SIGEDIVO__Gestión_de_Disco_Volador.png"
              className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>🖼️</span>
              <span>Descargar PNG</span>
            </a>
            <a
              id="infographic-download-svg-btn"
              href="/revolucion_digital_ultimate.svg"
              download="SIGEDIVO_Revolucion_Digital_Ultimate.svg"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>📐</span>
              <span>SVG Vectorial</span>
            </a>
            <a
              id="infographic-download-presentation-btn"
              href="/SIGEDIVO_Presentacion_Ejecutiva_2026.pdf"
              download="SIGEDIVO_Presentacion_Ejecutiva_2026.pdf"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>📊</span>
              <span>PDF Diapositivas (15 págs)</span>
            </a>
            <a
              id="infographic-view-slides-btn"
              href="/presentacion.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>🖥️</span>
              <span>Ver Online</span>
            </a>
          </div>
        </div>

        {/* Infographic Image Canvas */}
        <div className="relative p-2 sm:p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
          <img
            src="/SIGEDIVO__Gestión_de_Disco_Volador.png"
            alt="SIGEDIVO: La Revolución Digital en la Gestión del Ultimate Frisbee"
            referrerPolicy="no-referrer"
            className="w-full h-auto max-h-[720px] object-contain rounded-2xl shadow-2xl cursor-pointer transition hover:opacity-95"
            onClick={() => setIsExpanded(true)}
            onError={(e) => {
              // Fallback to SVG if PNG is loading
              const target = e.currentTarget
              if (!target.src.endsWith('.svg')) {
                target.src = '/revolucion_digital_ultimate.svg'
              }
            }}
          />
        </div>

        {/* Bottom Banner */}
        <div className="px-6 py-3 bg-slate-900/60 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span>Diseño oficial y contextual del proyecto SIGEDIVO (Frank Sousa • Licencia MIT)</span>
          <span className="text-cyan-400 font-mono font-bold">1920x1080 Ultra-HD • PNG &amp; SVG Vectorial</span>
        </div>
      </div>

      {/* Expanded Modal */}
      {isExpanded && (
        <div
          id="infographic-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="relative max-w-7xl w-full bg-slate-950 border border-slate-700 rounded-3xl p-4 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 px-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🥏</span>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  SIGEDIVO: La Revolución Digital en la Gestión del Ultimate Frisbee
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/SIGEDIVO__Gestión_de_Disco_Volador.png"
                  download="SIGEDIVO__Gestión_de_Disco_Volador.png"
                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition"
                >
                  Descargar PNG
                </a>
                <button
                  type="button"
                  id="infographic-close-modal-btn"
                  onClick={() => setIsExpanded(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-bold transition"
                >
                  ✕ Cerrar
                </button>
              </div>
            </div>
            <div className="max-h-[82vh] overflow-auto flex items-center justify-center">
              <img
                src="/SIGEDIVO__Gestión_de_Disco_Volador.png"
                alt="SIGEDIVO: La Revolución Digital en la Gestión del Ultimate Frisbee"
                referrerPolicy="no-referrer"
                className="w-full h-auto max-h-[78vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Structural Pillars Grid (Synchronized with the Infographic) */}
      {showDetailedCards && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm border-t-4 border-t-cyan-500">
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="text-2xl">🛡️</span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                1. Identidad &amp; Propósito
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Plataforma White-Label y Autohospedable. ADN venezolano (San Juan de los Morros) bajo licencia MIT, con 100% de éxito en certificación de producción y pruebas de estrés.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm border-t-4 border-t-amber-500">
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="text-2xl">⏱️</span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                2. Gestión en Campo
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Convocatorias O/D-Line con control de asistencia en tiempo real. Mesa técnica con botones táctiles gigantes (GOL, DEFENSA D, TURNOVER), marcador sticky y pizarra de jugadas (Playbook).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm border-t-4 border-t-emerald-500">
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="text-2xl">🔒</span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                3. Gobernanza &amp; Finanzas
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Matriz RBAC para 9 roles diferenciados, gestión de tesorería integrada (cuentas bancarias y caja chica) y arquitectura multi-equipo con dorsales independientes sin conflicto.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm border-t-4 border-t-sky-500">
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="text-2xl">⚙️</span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                4. Ecosistema Tech
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Frontend en React 18, Vite 6 y TypeScript. Backend en Node.js 22 LTS con Prisma ORM 7 y PostgreSQL 16. Generador de PDFs integrado y despliegue rápido con Docker Compose.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectInfographic
