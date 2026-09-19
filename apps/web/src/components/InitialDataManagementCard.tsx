import React, { useState, useEffect } from 'react'
import { maintenanceApi, MaintenanceStatus } from '../lib/api'
import { useToast } from '../hooks/useToast'
import ConfirmModal from './ConfirmModal'

interface Props {
  onDataChanged?: () => void
}

export default function InitialDataManagementCard({ onDataChanged }: Props) {
  const { showSuccessToast, showErrorToast } = useToast()
  const [status, setStatus] = useState<MaintenanceStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCleanModal, setShowCleanModal] = useState(false)
  const [showSeedModal, setShowSeedModal] = useState(false)

  const fetchStatus = async () => {
    try {
      const data = await maintenanceApi.getStatus()
      setStatus(data)
    } catch {
      // Si falla silenciosamente o no es admin, status permanece null
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleClean = async () => {
    setLoading(true)
    try {
      const res = await maintenanceApi.cleanSampleData()
      showSuccessToast(res.message || 'Datos de prueba eliminados. El sistema está limpio y listo para empezar desde cero.')
      setShowCleanModal(false)
      await fetchStatus()
      if (onDataChanged) onDataChanged()
    } catch (err: any) {
      showErrorToast(err?.message || 'Error al limpiar los datos de prueba')
    } finally {
      setLoading(false)
    }
  }

  const handleSeed = async () => {
    setLoading(true)
    try {
      const res = await maintenanceApi.seedSampleData()
      showSuccessToast(res.message || 'Datos de prueba de muestra recargados con éxito.')
      setShowSeedModal(false)
      await fetchStatus()
      if (onDataChanged) onDataChanged()
    } catch (err: any) {
      showErrorToast(err?.message || 'Error al recargar datos de prueba')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 rounded-2xl border border-indigo-800/40 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-2xl">🧹</span>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Puesta en Marcha y Gestión de Datos Iniciales
              </h3>
              {status ? (
                status.isClean ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                    ✓ Sistema Limpio (Listo para datos reales)
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold">
                    Datos de Muestra Activos ({status.playerCount} atletas • {status.eventCount} eventos • {status.transactionCount} transacciones)
                  </span>
                )
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300">
                  Verificando estado...
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              El sistema incluye datos sencillos de muestra para que cualquier persona que descargue y despliegue el proyecto pueda verificar el funcionamiento de las transiciones, el roster, los calendarios y las finanzas. Cuando tu organización deportiva esté lista, puedes limpiar todos los datos de muestra y comenzar a cargar la información oficial de tu club desde cero.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowCleanModal(true)}
              disabled={loading || (status?.isClean ?? false)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-white font-semibold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
            >
              <span>🧹</span>
              <span>Limpiar Datos y Empezar de Cero</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSeedModal(true)}
              disabled={loading}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-50 text-cyan-300 border border-cyan-500/30 font-semibold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2"
            >
              <span>🌱</span>
              <span>Recargar Datos de Muestra</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Confirmación de Limpieza a Cero */}
      <ConfirmModal
        isOpen={showCleanModal}
        title="¿Limpiar todos los datos de prueba del sistema?"
        message={
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              Esta acción eliminará de forma segura todos los datos de demostración para dejar la plataforma totalmente en blanco y lista para ingresar la información de tu club:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-gray-700">
              <li>Se eliminarán los atletas de muestra del Roster.</li>
              <li>Se eliminarán los eventos de prueba, asistencias y actas de mesa técnica.</li>
              <li>Se eliminarán las transacciones contables de muestra y los saldos de caja se reiniciarán a <strong>$0.00</strong>.</li>
              <li>Se mantendrá tu usuario <strong>Administrador</strong>, las escuadras base oficiales, las categorías financieras y las tácticas WFDF.</li>
            </ul>
            <p className="text-xs font-semibold text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              ⚠️ Esta acción dejará el sistema listo para producción inmediata. Podrás recargar los datos de prueba en cualquier momento si lo deseas.
            </p>
          </div>
        }
        confirmText={loading ? 'Limpiando...' : 'Sí, limpiar y empezar de cero'}
        cancelText="Cancelar"
        isDangerous={true}
        onConfirm={handleClean}
        onCancel={() => setShowCleanModal(false)}
      />

      {/* Modal Confirmación de Recarga de Muestra */}
      <ConfirmModal
        isOpen={showSeedModal}
        title="¿Recargar datos de muestra para pruebas?"
        message={
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              Se recargarán 8 atletas de muestra, 1 partido completado con acta de mesa técnica, 1 entrenamiento próximo convocado con confirmaciones de asistencia y transacciones financieras para demostración e inducción del personal.
            </p>
          </div>
        }
        confirmText={loading ? 'Recargando...' : 'Sí, recargar datos de muestra'}
        cancelText="Cancelar"
        isDangerous={false}
        onConfirm={handleSeed}
        onCancel={() => setShowSeedModal(false)}
      />
    </>
  )
}
