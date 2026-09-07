import { useEffect } from 'react'

interface VideoModalProps {
  src: string
  onClose: () => void
}

export default function VideoModal({ src, onClose }: VideoModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Video preview"
    >
      <video
        src={src}
        controls
        autoPlay
        className="max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        className="absolute top-4 right-4 text-white text-2xl bg-gray-800 rounded-full w-10 h-10"
        onClick={onClose}
        aria-label="Close video preview"
      >
        ✕
      </button>
    </div>
  )
}
