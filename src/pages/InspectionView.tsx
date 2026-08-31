import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useInspectionStore } from '../store/useInspectionStore'
import CollapsibleCard from '../components/CollapsibleCard'
import FullscreenPhotoModal from '../components/FullscreenPhotoModal'
import type { Inspection } from '../types'

export default function InspectionView() {
  const { id } = useParams()
  const { inspections, loadInspections } = useInspectionStore()
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      await loadInspections()
    }
    load()
  }, [loadInspections])

  useEffect(() => {
    if (id && inspections.length > 0) {
      const found = inspections.find((i) => i.id === id) || null
      setInspection(found)
    }
  }, [id, inspections])

  const totalChecklistItems = useMemo(() => {
    return inspection?.checklist.length || 0
  }, [inspection])

  if (!inspection) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Inspection not found.</p>
        <Link to="/inventory" className="text-indigo-600 hover:underline">← Back to Inventory</Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 p-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">View Inspection</h1>
        <div className="flex gap-2">
          <Link to="/inventory" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50">
            ← Inventory
          </Link>
          <Link to={`/inspection`} className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700">
            Edit Inspection
          </Link>
        </div>
      </div>

      <CollapsibleCard defaultOpen title="Owner Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <p><span className="font-medium">Name:</span> {inspection.ownerInfo.name || '—'}</p>
          <p><span className="font-medium">Contact:</span> {inspection.ownerInfo.contactNumber || '—'}</p>
          <p><span className="font-medium">Email:</span> {inspection.ownerInfo.email || '—'}</p>
          <p><span className="font-medium">ID:</span> {inspection.ownerInfo.idNumber || '—'}</p>
          <p className="col-span-full"><span className="font-medium">Address:</span> {inspection.ownerInfo.physicalAddress || '—'}</p>
        </div>
      </CollapsibleCard>

      <CollapsibleCard defaultOpen title="Vehicle Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <p><span className="font-medium">VIN:</span> {inspection.vehicleInfo.vin || '—'}</p>
          <p><span className="font-medium">Stock:</span> {inspection.vehicleInfo.stockNumber || '—'}</p>
          <p><span className="font-medium">Make:</span> {inspection.vehicleInfo.make}</p>
          <p><span className="font-medium">Model:</span> {inspection.vehicleInfo.model}</p>
          <p><span className="font-medium">Year:</span> {inspection.vehicleInfo.year}</p>
          <p><span className="font-medium">Color:</span> {inspection.vehicleInfo.color || '—'}</p>
          <p><span className="font-medium">Body:</span> {inspection.vehicleInfo.bodyType || '—'}</p>
          <p><span className="font-medium">Mileage:</span> {inspection.vehicleInfo.mileage}</p>
          <p><span className="font-medium">Transmission:</span> {inspection.vehicleInfo.transmission}</p>
          <p><span className="font-medium">Fuel:</span> {inspection.vehicleInfo.fuelType}</p>
        </div>
      </CollapsibleCard>

      <CollapsibleCard defaultOpen title={`Faults (${inspection.faults.length})`}>
        {inspection.faults.length === 0 ? (
          <p className="text-gray-500 text-sm">No faults recorded.</p>
        ) : (
          <ul className="space-y-1 list-disc list-inside text-sm">
            {inspection.faults.map((fault) => (
              <li key={fault.id}>{fault.description}</li>
            ))}
          </ul>
        )}
      </CollapsibleCard>

      <CollapsibleCard defaultOpen title={`Advertisement Photos (${inspection.advertisementPhotos.length})`}>
        <div className="flex gap-2 flex-wrap">
          {inspection.advertisementPhotos.map((photo, idx) => (
            <img
              key={idx}
              src={photo}
              alt={`Photo ${idx + 1}`}
              className="photo-thumb h-20 w-20"
              onClick={() => setSelectedPhoto(photo)}
            />
          ))}
        </div>
      </CollapsibleCard>

      <CollapsibleCard defaultOpen title={`Checklist (${totalChecklistItems})`}>
        {(['documentation','exterior','interior','engine_bay','underbody'] as const).map((category) => {
          const items = inspection.checklist.filter((c) => c.category === category)
          if (items.length === 0) return null
          return (
            <div key={category} className="mb-3">
              <h4 className="text-sm font-semibold capitalize mb-1">{category.replace('_', ' ')}</h4>
              <div className="space-y-1">
                {items.map((item) => (
                  <div key={item.id} className="text-sm bg-gray-50 rounded-lg p-2">
                    <div className="flex justify-between">
                      <span>{item.label}</span>
                      <span className="font-medium capitalize">{item.result || 'not set'}</span>
                    </div>
                    {item.note && <p className="text-xs text-gray-600 mt-1">📝 {item.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </CollapsibleCard>

      <CollapsibleCard defaultOpen title="Financial Information">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p><span className="font-medium">Purchase:</span> R {inspection.financial.purchasePrice ?? '—'}</p>
          <p><span className="font-medium">Selling:</span> R {inspection.financial.sellingPrice ?? '—'}</p>
          {inspection.financial.additionalCosts && inspection.financial.additionalCosts.length > 0 && (
            <div className="col-span-2">
              <p className="font-medium">Additional Costs</p>
              {inspection.financial.additionalCosts.map((cost, idx) => (
                <p key={idx} className="text-sm">{cost.label}: R {cost.amount.toLocaleString()}</p>
              ))}
            </div>
          )}
          <p><span className="font-medium">Profit:</span> R {inspection.financial.estimatedProfit ?? '—'}</p>
          <p><span className="font-medium">Margin:</span> {inspection.financial.expectedMargin ?? '—'}%</p>
        </div>
      </CollapsibleCard>

      {selectedPhoto && (
        <FullscreenPhotoModal src={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </div>
  )
}
