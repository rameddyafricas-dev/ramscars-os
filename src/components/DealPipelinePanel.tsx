import { useEffect, useMemo } from 'react'
import { useVehicleStore } from '../store/useVehicleStore'
import { useInspectionStore } from '../store/useInspectionStore'
import { useDocumentStore } from '../store/useDocumentStore'
import { useSaleStore } from '../store/useSaleStore'
import { getDealState, type DealStageKey } from '../services/dealEngine'

const stageOrder: DealStageKey[] = [
  'intake',
  'consignment',
  'inspection',
  'hpi',
  'marketing',
  'sale',
  'ownership',
  'paid',
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
    const counts: Record<DealStageKey, number> = {
      intake: 0,
      consignment: 0,
      inspection: 0,
      hpi: 0,
      marketing: 0,
      sale: 0,
      ownership: 0,
      paid: 0,
    }

    for (const vehicle of vehicles) {
      const inspection = inspections.find(i => i.id === vehicle.inspectionId)
      const sale = sales
        .filter(s => s.vehicleId === vehicle.id && s.status !== 'cancelled')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      const deal = getDealState(vehicle, inspection, documents, sale)
      for (const stage of deal.stages) {
        if (stage.done) counts[stage.key]++
      }
    }

    return stageOrder.map(key => {
      const label = key === 'paid' ? 'Owner Paid' : key.charAt(0).toUpperCase() + key.slice(1)
      return { key, label, count: counts[key] }
    })
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
