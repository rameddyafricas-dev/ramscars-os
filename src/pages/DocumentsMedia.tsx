import { useEffect, useMemo, useState } from 'react'
import { useVehicleStore } from '../store/useVehicleStore'
import { useInspectionStore } from '../store/useInspectionStore'
import FullscreenPhotoModal from '../components/FullscreenPhotoModal'

interface MediaItem {
  id: string
  src: string
  type: 'advertisement' | 'checklist'
  label: string
  vehicleLabel: string
}

export default function DocumentsMedia() {
  const { vehicles, loadVehicles } = useVehicleStore()
  const { inspections, loadInspections } = useInspectionStore()
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  useEffect(() => {
    loadVehicles()
    loadInspections()
  }, [loadVehicles, loadInspections])

  const mediaItems = useMemo<MediaItem[]>(() => {
    const items: MediaItem[] = []

    // Advertisement photos from vehicles
    vehicles.forEach((vehicle) => {
      const label = `${vehicle.year} ${vehicle.make} ${vehicle.model}`
      if (vehicle.photos) {
        vehicle.photos.forEach((photo, idx) => {
          if (!photo) return
          items.push({
            id: `${vehicle.id}-adv-${idx}`,
            src: photo,
            type: 'advertisement',
            label: `Advertisement Photo ${idx + 1}`,
            vehicleLabel: label,
          })
        })
      }
    })

    // Checklist media from inspections
    inspections.forEach((inspection) => {
      const label = `${inspection.vehicleInfo.year} ${inspection.vehicleInfo.make} ${inspection.vehicleInfo.model}`
      inspection.checklist.forEach((item) => {
        if (item.mediaIds) {
          item.mediaIds.forEach((media, idx) => {
            if (!media) return
            items.push({
              id: `${item.id}-${idx}`,
              src: media,
              type: 'checklist',
              label: item.label,
              vehicleLabel: label,
            })
          })
        }
      })
      // also advertisement photos from inspections if not already in vehicle.photos
      inspection.advertisementPhotos.forEach((photo, idx) => {
        if (!photo) return
        items.push({
          id: `${inspection.id}-inspection-adv-${idx}`,
          src: photo,
          type: 'advertisement',
          label: `Inspection Photo ${idx + 1}`,
          vehicleLabel: label,
        })
      })
    })

    // Deduplicate by src
    const seen = new Set<string>()
    return items.filter((item) => {
      if (seen.has(item.src)) return false
      seen.add(item.src)
      return true
    })
  }, [vehicles, inspections])

  const advCount = mediaItems.filter((m) => m.type === 'advertisement').length
  const checklistCount = mediaItems.filter((m) => m.type === 'checklist').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Documents & Media</h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {mediaItems.length} item(s)
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-sm text-gray-500">Advertisement Photos</p>
          <p className="text-2xl font-bold text-indigo-600">{advCount}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-sm text-gray-500">Checklist Photos</p>
          <p className="text-2xl font-bold text-green-600">{checklistCount}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-sm text-gray-500">Documents</p>
          <p className="text-2xl font-bold text-gray-600">0</p>
        </div>
      </div>

      {mediaItems.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          No media available yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {mediaItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
              <img
                src={item.src}
                alt={item.label}
                className="h-32 w-full object-cover cursor-pointer"
                onClick={() => setSelectedPhoto(item.src)}
              />
              <div className="p-2">
                <p className="text-xs font-medium text-gray-700 truncate">{item.label}</p>
                <p className="text-[10px] text-gray-500 truncate">{item.vehicleLabel}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPhoto && (
        <FullscreenPhotoModal src={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </div>
  )
}
