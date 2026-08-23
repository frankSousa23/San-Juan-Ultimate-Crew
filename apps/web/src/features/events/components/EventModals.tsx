import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EventForm from './EventForm'
import { EventItem } from '../../../types/event'

interface EventModalsProps {
  createOpen: boolean
  editTarget: EventItem | null
  setCreateOpen: (val: boolean) => void
  setEditTarget: (val: EventItem | null) => void
  createEvent: (data: any) => Promise<any>
  updateEvent: (id: number, data: any) => Promise<void>
}

export function EventModals({
  createOpen,
  editTarget,
  setCreateOpen,
  setEditTarget,
  createEvent,
  updateEvent
}: EventModalsProps) {
  const navigate = useNavigate()
  const [backdropMouseDown, setBackdropMouseDown] = useState(false)

  const handleCreate = async (data: any) => {
    const created = await createEvent(data)
    setCreateOpen(false)
    return created
  }

  const handleCreateAndAnnotate = async (data: any) => {
    const created = await createEvent(data)
    setCreateOpen(false)
    if (created && created.id) {
      navigate(`/anotaciones?eventId=${created.id}`)
    }
  }

  const handleCreateAndPlanTournament = async (data: any) => {
    const created = await createEvent(data)
    setCreateOpen(false)
    if (created && created.id) {
      navigate(`/eventos?tab=tournaments`)
    }
  }

  const handleUpdate = async (data: any) => {
    if (editTarget) {
      await updateEvent(editTarget.id, data)
      setEditTarget(null)
    }
  }

  return (
    <>
      {createOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setBackdropMouseDown(true)
            else setBackdropMouseDown(false)
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && backdropMouseDown) {
              setCreateOpen(false)
            }
            setBackdropMouseDown(false)
          }}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150" 
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white p-4 sm:p-5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🥏</span>
                <div>
                  <h3 className="text-lg font-bold leading-tight">Crear Evento / Partido</h3>
                  <p className="text-xs text-amber-100/90 font-medium">Configuración de torneos, entrenamientos, caimaneras y mesa técnica</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setCreateOpen(false)}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition text-sm font-bold"
                aria-label="Cerrar ventana"
              >
                ✕
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto">
              <EventForm
                mode="create"
                initial={null}
                onCancel={() => setCreateOpen(false)}
                onSubmit={handleCreate}
                onSubmitAndAnnotate={handleCreateAndAnnotate}
                onSubmitAndPlanTournament={handleCreateAndPlanTournament}
              />
            </div>
          </div>
        </div>
      )}
      
      {editTarget && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setBackdropMouseDown(true)
            else setBackdropMouseDown(false)
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && backdropMouseDown) {
              setEditTarget(null)
            }
            setBackdropMouseDown(false)
          }}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150" 
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-amber-600 text-white p-4 sm:p-5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">✏️</span>
                <div>
                  <h3 className="text-lg font-bold leading-tight">Editar Evento / Mesa Técnica</h3>
                  <p className="text-xs text-indigo-100/90 font-medium">Modifica detalles, horarios, o asignaciones del evento</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setEditTarget(null)}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition text-sm font-bold"
                aria-label="Cerrar ventana"
              >
                ✕
              </button>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto">
              <EventForm
                mode="edit"
                initial={editTarget}
                onCancel={() => setEditTarget(null)}
                onSubmit={handleUpdate}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

