interface DealStageProps {
  vehicleId: string
  inspectionDone: boolean
  consignmentSigned: boolean
  hpiPassed: boolean
  marketingDone: boolean
  saleExists: boolean
  ownershipDone: boolean
  ownerPaid: boolean
}

const stages = [
  { key: 'inspection', label: 'Inspection', completed: (p: DealStageProps) => p.inspectionDone },
  { key: 'consignment', label: 'Consignment', completed: (p: DealStageProps) => p.consignmentSigned },
  { key: 'hpi', label: 'HPI', completed: (p: DealStageProps) => p.hpiPassed },
  { key: 'marketing', label: 'Marketing', completed: (p: DealStageProps) => p.marketingDone },
  { key: 'sale', label: 'Sale', completed: (p: DealStageProps) => p.saleExists },
  { key: 'ownership', label: 'Ownership', completed: (p: DealStageProps) => p.ownershipDone },
  { key: 'paid', label: 'Owner Paid', completed: (p: DealStageProps) => p.ownerPaid },
]

export default function DealStage(props: DealStageProps) {
  const completedCount = stages.filter(s => s.completed(props)).length
  const percent = Math.round((completedCount / stages.length) * 100)

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-medium text-gray-600">Deal Stage</span>
        <div className="flex-1 h-2 bg-gray-200 rounded-full">
          <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${percent}%` }} />
        </div>
        <span className="text-xs font-semibold text-indigo-600">{percent}%</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {stages.map(stage => (
          <span
            key={stage.key}
            className={`px-2 py-0.5 rounded-full text-xs ${
              stage.completed(props) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {stage.completed(props) ? '✓ ' : '• '}{stage.label}
          </span>
        ))}
      </div>
    </div>
  )
}
