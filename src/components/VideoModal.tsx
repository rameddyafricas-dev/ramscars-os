interface VideoModalProps {
  src: string
  onClose: () => void
}

export default function VideoModal({ src, onClose }: VideoModalProps) {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={onClose}>
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
      >
        ✕
      </button>
    </div>
  )
}
