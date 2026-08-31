import { useEffect, useMemo, useState } from 'react'
import { useVehicleStore } from '../store/useVehicleStore'
import { useInspectionStore } from '../store/useInspectionStore'
import { useDocumentStore } from '../store/useDocumentStore'
import FullscreenPhotoModal from '../components/FullscreenPhotoModal'
import VideoModal from '../components/VideoModal'

interface MediaGroup {
  vehicleId: string
  vehicleLabel: string
  images: string[]
  videos: { label: string; src: string }[]
  documents: { title: string; url: string }[]
}

export default function DocumentsMedia() {
  const { vehicles, loadVehicles } = useVehicleStore()
  const { inspections, loadInspections } = useInspectionStore()
  const { documents, loadDocuments } = useDocumentStore()
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)

  useEffect(() => {
    loadVehicles()
    loadInspections()
    loadDocuments()
  }, [loadVehicles, loadInspections, loadDocuments])

  const groups = useMemo<MediaGroup[]>(() => {
    return vehicles.map((vehicle) => {
      const label = `${vehicle.year} ${vehicle.make} ${vehicle.model}`
      const images: string[] = []
      const videos: { label: string; src: string }[] = []
      const documentsForVehicle = documents.filter((d) => d.vehicleId === vehicle.id)

      // vehicle photos
      if (vehicle.photos) {
        vehicle.photos.forEach((photo) => {
          if (photo) images.push(photo)
        })
      }

      // inspection data
      const inspection = inspections.find((i) => i.id === vehicle.inspectionId)
      if (inspection) {
        // advertisement slots (images + video)
        inspection.advertisementSlots?.forEach((slot) => {
          if (!slot.photo) return
          if (slot.label === 'Video') {
            videos.push({ label: 'Video', src: slot.photo })
          } else {
            images.push(slot.photo)
          }
        })

        // old advertisementPhotos fallback
        inspection.advertisementPhotos?.forEach((photo) => {
          if (photo) images.push(photo)
        })

        // checklist media
        inspection.checklist.forEach((item) => {
          item.mediaIds?.forEach((media) => {
            if (media) images.push(media)
          })
        })
      }

      return {
        vehicleId: vehicle.id,
        vehicleLabel: label,
        images: Array.from(new Set(images)),
        videos,
        documents: documentsForVehicle.map((doc) => ({
          title: doc.title,
          url: doc.fileUrl || '',
        })),
      }
    })
  }, [vehicles, inspections, documents])

  const selectedGroup = groups.find((g) => g.vehicleId === selectedVehicleId)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {vehicles.length} vehicle(s)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Vehicle list */}
        <div className="card p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Vehicles</h2>
          <div className="space-y-2">
            {groups.map((group) => (
              <button
                key={group.vehicleId}
                onClick={() => setSelectedVehicleId(group.vehicleId)}
                className={`w-full text-left p-3 rounded-xl border ${
                  selectedVehicleId === group.vehicleId
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <p className="font-medium text-gray-800 truncate">{group.vehicleLabel}</p>
                <p className="text-xs text-gray-500">
                  {group.images.length} image(s) • {group.videos.length} video(s) • {group.documents.length} doc(s)
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Media display */}
        <div className="md:col-span-2 card p-4">
          {!selectedGroup ? (
            <p className="text-gray-500">Select a vehicle to view its media.</p>
          ) : (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-800">{selectedGroup.vehicleLabel}</h2>

              {/* Images */}
              <section>
                <h3 className="font-medium text-gray-700 mb-2">Images ({selectedGroup.images.length})</h3>
                {selectedGroup.images.length === 0 ? (
                  <p className="text-gray-500 text-sm">No images</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {selectedGroup.images.map((src, idx) => (
                      <img
                        key={idx}
                        src={src}
                        alt={`Image ${idx + 1}`}
                        className="h-32 w-full object-cover rounded-lg cursor-pointer border border-gray-200"
                        onClick={() => setSelectedPhoto(src)}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Videos */}
              <section>
                <h3 className="font-medium text-gray-700 mb-2">Videos ({selectedGroup.videos.length})</h3>
                {selectedGroup.videos.length === 0 ? (
                  <p className="text-gray-500 text-sm">No videos</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedGroup.videos.map((video, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-2">
                        <video src={video.src} className="w-full h-32 object-cover rounded" muted />
                        <button
                          onClick={() => setSelectedVideo(video.src)}
                          className="mt-2 bg-indigo-600 text-white px-3 py-1 rounded text-xs"
                        >
                          Play Video
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Documents */}
              <section>
                <h3 className="font-medium text-gray-700 mb-2">Documents ({selectedGroup.documents.length})</h3>
                {selectedGroup.documents.length === 0 ? (
                  <p className="text-gray-500 text-sm">No documents</p>
                ) : (
                  <div className="space-y-2">
                    {selectedGroup.documents.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block bg-gray-50 rounded-lg p-3 hover:bg-gray-100"
                      >
                        <p className="font-medium text-gray-800">📄 {doc.title}</p>
                      </a>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>

      {selectedPhoto && <FullscreenPhotoModal src={selectedPhoto} onClose={() => setSelectedPhoto(null)} />}
      {selectedVideo && <VideoModal src={selectedVideo} onClose={() => setSelectedVideo(null)} />}
    </div>
  )
}
