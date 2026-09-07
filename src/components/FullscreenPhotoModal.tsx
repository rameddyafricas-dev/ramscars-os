import { useEffect } from 'react'

interface FullscreenPhotoModalProps {
  src: string
  onClose: () => void
}

export default function FullscreenPhotoModal({ src, onClose }: FullscreenPhotoModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen photo preview"
    >
      <img
        src={src}
        alt="Fullscreen preview"
        className="max-w-full max-h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        className="absolute top-4 right-4 text-white text-2xl bg-gray-800 rounded-full w-10 h-10"
        onClick={onClose}
        aria-label="Close fullscreen preview"
      >
        ✕
      </button>
    </div>
  )
}
