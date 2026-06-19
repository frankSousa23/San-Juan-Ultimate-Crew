import React from 'react'
import EventForm from './EventForm'
import { EventItem } from '../../../types/event'

interface EventModalsProps {
  createOpen: boolean
  editTarget: EventItem | null
  setCreateOpen: (val: boolean) => void
  setEditTarget: (val: EventItem | null) => void
  createEvent: (data: any) => Promise<void>
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
  return (
    <>
      {createOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setCreateOpen(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-amber-600 to-rose-600 text-white p-4">
              <div className="text-lg font-bold">Crear Evento</div>
            </div>
            <div className="p-4">
              <EventForm
                mode="create"
                initial={null}
                onCancel={() => setCreateOpen(false)}
                onSubmit={(data) => createEvent(data)}
              />
            </div>
          </div>
        </div>
      )}
      
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditTarget(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-600 to-amber-600 text-white p-4">
              <div className="text-lg font-bold">Editar Evento</div>
            </div>
            <div className="p-4">
              <EventForm
                mode="edit"
                initial={editTarget}
                onCancel={() => setEditTarget(null)}
                onSubmit={(data) => editTarget && updateEvent(editTarget.id, data)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
