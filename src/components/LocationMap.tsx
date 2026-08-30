import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'

interface LocationMapProps {
  latitude?: number
  longitude?: number
  onSelect: (lat: number, lng: number) => void
}

export default function LocationMap({ latitude, longitude, onSelect }: LocationMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.CircleMarker | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  )

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [latitude || -26.195246, longitude || 28.034088],
      zoom: 13,
      attributionControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      setPin({ lat, lng })
      onSelect(lat, lng)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return

    if (markerRef.current) {
      markerRef.current.setLatLng([pin?.lat || latitude || -26.195246, pin?.lng || longitude || 28.034088])
    } else {
      markerRef.current = L.circleMarker([pin?.lat || latitude || -26.195246, pin?.lng || longitude || 28.034088], {
        radius: 10,
        color: '#4f46e5',
        fillColor: '#6366f1',
        fillOpacity: 0.8,
      }).addTo(mapRef.current)
    }

    if (pin) {
      mapRef.current.setView([pin.lat, pin.lng], 15)
    }
  }, [pin, latitude, longitude])

  return (
    <div>
      <div
        ref={containerRef}
        className="w-full h-64 rounded-xl border border-gray-300 z-0"
      />
      <p className="text-xs text-gray-500 mt-2">
        {pin
          ? `Pinned location: ${pin.lat.toFixed(6)}, ${pin.lng.toFixed(6)}`
          : 'Click the map to pin the vehicle location.'}
      </p>
    </div>
  )
}
