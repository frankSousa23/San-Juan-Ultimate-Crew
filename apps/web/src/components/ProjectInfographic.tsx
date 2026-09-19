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
              <h3 className="text-sm font-black tracking-wide text-white uppercase">
                Infografía Oficial de Arquitectura e Identidad
              </h3>
              <p className="text-xs text-slate-400">
                SIGEDIVO: La Revolución Digital del Ultimate Frisbee
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="infographic-fullscreen-btn"
              onClick={() => setIsExpanded(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 border border-cyan-500/30 transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>🔍</span>
              <span>Ver en Pantalla Completa</span>
            </button>
            <a
              id="infographic-download-btn"
              href="/revolucion_digital_ultimate.svg"
              download="SIGEDIVO_Revolucion_Digital_Ultimate.svg"
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>📥</span>
              <span>Descargar SVG</span>
            </a>
          </div>
        </div>

        {/* Infographic Image Canvas */}
        <div className="relative p-2 sm:p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
          <img
            src="/revolucion_digital_ultimate.svg"
            alt="SIGEDIVO: La Revolución Digital del Ultimate Frisbee"
            referrerPolicy="no-referrer"
            className="w-full h-auto max-h-[680px] object-contain rounded-2xl shadow-2xl cursor-pointer transition hover:opacity-95"
            onClick={() => setIsExpanded(true)}
          />
        </div>

        {/* Bottom Banner */}
        <div className="px-6 py-3 bg-slate-900/60 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span>Diseño oficial y contextual del proyecto SIGEDIVO</span>
          <span className="text-cyan-400 font-mono font-bold">100% Vectorial • Modo Claro / Oscuro Compatible</span>
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
                  SIGEDIVO: La Revolución Digital del Ultimate Frisbee
                </h2>
              </div>
              <button
                type="button"
                id="infographic-close-modal-btn"
                onClick={() => setIsExpanded(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-bold transition"
              >
                ✕ Cerrar
              </button>
            </div>
            <div className="max-h-[82vh] overflow-auto flex items-center justify-center">
              <img
                src="/revolucion_digital_ultimate.svg"
                alt="SIGEDIVO: La Revolución Digital del Ultimate Frisbee"
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
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="text-2xl">🛡️</span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Identidad &amp; Propósito
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Plataforma White-Label para despliegue federativo o de club, 100% Software Libre bajo licencia MIT para profesionalizar el Ultimate en Latinoamérica.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="text-2xl">⚖️</span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Gobernanza &amp; Roles
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Matriz RBAC estricta (admin, directiva, capitán, entrenador, tesorero, anotador y jugador) con historial de lesiones y alta médica.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="text-2xl">📱</span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Módulos Deportivos
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Anotaciones táctiles en vivo, gestión de líneas O/D-Line, cálculo automático de +/- (Plus/Minus) y control financiero de torneos (Bid Fees).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="text-2xl">⚡</span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Stack Tecnológico
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              React 18, Vite 6, Tailwind CSS, Node.js + Express en TypeScript, PostgreSQL 16 con Prisma ORM, Vitest y Playwright.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectInfographic
