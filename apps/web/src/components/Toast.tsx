import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'
type ToastItem = { id: number; type: ToastType; message: string; timeoutMs?: number }

type ToastContextValue = {
  add: (type: ToastType, message: string, timeoutMs?: number) => void
  success: (message: string, timeoutMs?: number) => void
  error: (message: string, timeoutMs?: number) => void
  info: (message: string, timeoutMs?: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const add = useCallback((type: ToastType, message: string, timeoutMs = 3000) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts(prev => [...prev, { id, type, message, timeoutMs }])
    if (timeoutMs && timeoutMs > 0) {
      setTimeout(() => remove(id), timeoutMs)
    }
  }, [remove])

  const value = useMemo<ToastContextValue>(() => ({
    add,
    success: (m: string, ms?: number) => add('success', m, ms),
    error: (m: string, ms?: number) => add('error', m, ms),
    info: (m: string, ms?: number) => add('info', m, ms),
  }), [add])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map(t => (
          <div key={t.id}
               className={
                 'shadow rounded px-3 py-2 text-sm text-white ' +
                 (t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-rose-600' : 'bg-slate-700')
               }>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
// Legacy inline Toast component removed; use global ToastProvider + useToast instead.
