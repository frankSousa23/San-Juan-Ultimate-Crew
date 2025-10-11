import { useEffect } from 'react'

export default function Toast({ message, onClose, duration = 1500 }: { message: string; onClose: () => void; duration?: number }) {
  useEffect(() => {
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [onClose, duration])
  if (!message) return null
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white text-sm px-3 py-2 rounded shadow z-50">
      {message}
    </div>
  )
}
