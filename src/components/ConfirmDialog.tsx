import { ReactNode, useEffect, useRef } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  children?: ReactNode
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    confirmButtonRef.current?.focus()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
        <h3 id="confirm-dialog-title" className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p id="confirm-dialog-message" className="text-sm text-gray-600 mb-4">{message}</p>
        {children}
        <div className="flex gap-2">
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700"
          >
            {confirmLabel}
          </button>
          <button onClick={onCancel} className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-300">
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
