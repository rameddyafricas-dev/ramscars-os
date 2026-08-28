interface FullscreenPhotoModalProps {
  src: string
  onClose: () => void
}

export default function FullscreenPhotoModal({ src, onClose }: FullscreenPhotoModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
      onClick={onClose}
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
      >
        ✕
      </button>
    </div>
  )
}
