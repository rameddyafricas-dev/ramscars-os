import type { DealStage as DealStageType } from '../services/dealEngine'

interface DealStageLegacyProps {
  vehicleId?: string
  inspectionDone?: boolean
  consignmentSigned?: boolean
  hpiPassed?: boolean
  marketingDone?: boolean
  saleExists?: boolean
  ownershipDone?: boolean
  ownerPaid?: boolean
}

interface DealStageNewProps {
  stages: DealStageType[]
  progress: number
  nextAction?: string
}

type DealStageProps = DealStageNewProps | DealStageLegacyProps

function isNewFormat(props: DealStageProps): props is DealStageNewProps {
  return Array.isArray((props as DealStageNewProps).stages)
}

export default function DealStage(props: DealStageProps) {
  let stages: DealStageType[]
  let percent: number
  let nextAction: string | undefined

  if (isNewFormat(props)) {
    stages = props.stages
    percent = props.progress
    nextAction = props.nextAction
  } else {
    const legacy = props
    stages = [
      { key: 'intake', label: 'Intake', done: true },
      { key: 'consignment', label: 'Consignment', done: !!legacy.consignmentSigned },
      { key: 'inspection', label: 'Inspection', done: !!legacy.inspectionDone },
      { key: 'hpi', label: 'HPI', done: !!legacy.hpiPassed },
      { key: 'marketing', label: 'Marketing', done: !!legacy.marketingDone },
      { key: 'sale', label: 'Sale', done: !!legacy.saleExists },
      { key: 'ownership', label: 'Ownership', done: !!legacy.ownershipDone },
      { key: 'paid', label: 'Owner Paid', done: !!legacy.ownerPaid },
    ]
    percent = Math.round((stages.filter(s => s.done).length / stages.length) * 100)
  }

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-medium text-gray-600">Deal Stage</span>
        <div className="flex-1 h-2 bg-gray-200 rounded-full">
          <div
            className="h-2 bg-indigo-500 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-indigo-600">{percent}%</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {stages.map(stage => (
          <span
            key={stage.key}
            className={`px-2 py-0.5 rounded-full text-xs ${
              stage.done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {stage.done ? '✓ ' : '• '}{stage.label}
          </span>
        ))}
      </div>
      {nextAction && (
        <p className="text-xs text-indigo-600 mt-2 font-medium">
          Next: {nextAction}
        </p>
      )}
    </div>
  )
}
