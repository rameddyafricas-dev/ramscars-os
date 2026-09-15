import { useEffect } from 'react'
import { useToastStore } from '../store/useToastStore'

export default function ToastContainer() {
  const { message, type, clear } = useToastStore()

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => clear(), 4000)
    return () => clearTimeout(timer)
  }, [message, clear])

  if (!message) return null

  const bg =
    type === 'success' ? 'bg-green-600' :
    type === 'error' ? 'bg-red-600' :
    'bg-gray-900'

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 ${bg} text-white px-4 py-3 rounded-xl shadow-lg z-[9999]`}
    >
      {message}
    </div>
  )
}
