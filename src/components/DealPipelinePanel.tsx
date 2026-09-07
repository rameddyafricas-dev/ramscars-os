import { useEffect, useMemo } from 'react'
import { useVehicleStore } from '../store/useVehicleStore'
import { useInspectionStore } from '../store/useInspectionStore'
import { useDocumentStore } from '../store/useDocumentStore'
import { useSaleStore } from '../store/useSaleStore'
import type { Vehicle, Inspection, Sale, Document } from '../types'

interface Stage {
  key: string
  label: string
  test: (vehicle: Vehicle, inspection?: Inspection, docs?: Document[], sale?: Sale) => boolean
}

const stages: Stage[] = [
  { key: 'intake', label: 'Intake', test: () => true },
  { key: 'consignment', label: 'Consignment', test: (v, _inspection, docs = []) => docs.some(d => d.vehicleId === v.id && d.title.toLowerCase().includes('consignment')) },
  { key: 'inspection', label: 'Inspection', test: (_v, inspection) => !!inspection },
  { key: 'hpi', label: 'HPI', test: (v, _inspection, docs = []) => docs.some(d => d.vehicleId === v.id && d.title.toLowerCase().includes('hpi') && !d.title.toLowerCase().includes('failed')) },
  { key: 'marketing', label: 'Marketing', test: (_v, inspection) => !!inspection?.marketing?.title && inspection.marketing.channels.length > 0 },
  { key: 'sale', label: 'Sale', test: (_v, _inspection, _docs, sale) => !!sale },
  { key: 'ownership', label: 'Ownership', test: (v, _inspection, docs = []) => docs.some(d => d.vehicleId === v.id && d.title.toLowerCase().includes('change of ownership')) },
  { key: 'paid', label: 'Owner Paid', test: (_v, _inspection, _docs, sale) => sale?.paymentStatus === 'paid' },
]

export default function DealPipelinePanel() {
  const { vehicles, loadVehicles } = useVehicleStore()
  const { inspections, loadInspections } = useInspectionStore()
  const { documents, loadDocuments } = useDocumentStore()
  const { sales, loadSales } = useSaleStore()

  useEffect(() => {
    loadVehicles()
    loadInspections()
    loadDocuments()
    loadSales()
  }, [loadVehicles, loadInspections, loadDocuments, loadSales])

  const stageCounts = useMemo(() => {
    return stages.map(stage => ({
      key: stage.key,
      label: stage.label,
      count: vehicles.filter(vehicle => {
        const inspection = inspections.find(i => i.id === vehicle.inspectionId)
        const vehicleDocs = documents.filter(d => d.vehicleId === vehicle.id)
        const sale = sales
          .filter(s => s.vehicleId === vehicle.id && s.status !== 'cancelled')
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
        return stage.test(vehicle, inspection, vehicleDocs, sale)
      }).length,
    }))
  }, [vehicles, inspections, documents, sales])

  const total = vehicles.length

  return (
    <div className="card p-5 mb-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Deal Pipeline Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stageCounts.map(stage => {
          const percent = total > 0 ? Math.round((stage.count / total) * 100) : 0
          return (
            <div key={stage.key} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">{stage.label}</p>
              <p className="text-xl font-bold text-gray-800">{stage.count}</p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div className="h-1.5 bg-indigo-500 rounded-full" style={{ width: `${percent}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{percent}%</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
