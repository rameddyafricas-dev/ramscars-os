import { useRef, useEffect, useState } from 'react'

interface CameraModalProps {
  onCapture: (dataUrl: string) => void
  onClose: () => void
}

export default function CameraModal({ onCapture, onClose }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          videoRef.current.play()
        }
      } catch (err) {
        console.error('getUserMedia error:', err)
        setError('Camera not available or permission denied. Please use gallery upload.')
      }
    }
    startCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const handleCapture = () => {
    const video = videoRef.current
    if (!video || !stream) return

    const canvas = document.createElement('canvas')
    const maxWidth = 1024
    const maxHeight = 1024
    const ratio = Math.min(maxWidth / video.videoWidth, maxHeight / video.videoHeight, 1)
    canvas.width = Math.round(video.videoWidth * ratio)
    canvas.height = Math.round(video.videoHeight * ratio)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
    onCapture(dataUrl)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-2">Take Photo</h2>
        {error ? (
          <div className="text-red-600 mb-2">{error}</div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-64 bg-gray-200 rounded" />
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">Cancel</button>
          {!error && (
            <button onClick={handleCapture} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Capture</button>
          )}
        </div>
      </div>
    </div>
  )
}
