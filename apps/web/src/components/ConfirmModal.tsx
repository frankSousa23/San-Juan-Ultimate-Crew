import React, { useState } from 'react'

export default function ConfirmModal({
  title = 'Confirmar',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  disabled,
}: {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  disabled?: boolean
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const titleId = 'confirm-modal-title'

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={!isSubmitting ? onCancel : undefined}>
      <div
        className="bg-white rounded shadow w-full max-w-md"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="confirm-modal"
      >
        <div id={titleId} className="px-4 py-3 border-b font-medium">{title}</div>
        <div className="px-4 py-3 text-sm text-gray-700">{message}</div>
        <div className="px-4 py-3 flex justify-end gap-2 border-t">
          <button 
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50" 
            onClick={onCancel} 
            disabled={isSubmitting || disabled}
            data-testid="confirm-no"
          > 
            {cancelText} 
          </button>
          <button 
            className="px-3 py-1 rounded bg-rose-600 text-white disabled:opacity-50 flex items-center justify-center min-w-[100px]" 
            disabled={isSubmitting || disabled} 
            onClick={handleConfirm} 
            data-testid="confirm-yes"
          > 
            {isSubmitting ? (
              <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            {isSubmitting ? 'Procesando...' : confirmText} 
          </button>
        </div>
      </div>
    </div>
  )
}
