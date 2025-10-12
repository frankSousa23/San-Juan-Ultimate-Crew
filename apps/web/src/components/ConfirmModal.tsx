import React from 'react'

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
  onConfirm: () => void
  onCancel: () => void
  disabled?: boolean
}) {
  const titleId = 'confirm-modal-title'
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onCancel}>
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
          <button className="px-3 py-1 rounded bg-gray-200" onClick={onCancel} data-testid="confirm-no"> {cancelText} </button>
          <button className="px-3 py-1 rounded bg-rose-600 text-white disabled:opacity-50" disabled={disabled} onClick={onConfirm} data-testid="confirm-yes"> {confirmText} </button>
        </div>
      </div>
    </div>
  )
}
