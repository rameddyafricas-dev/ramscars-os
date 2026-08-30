import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVehicleStore } from '../store/useVehicleStore'
import { useInspectionStore } from '../store/useInspectionStore'
import { useCustomerStore } from '../store/useCustomerStore'
import { useLeadStore } from '../store/useLeadStore'

interface Insight {
  title: string
  description: string
  severity: 'info' | 'success' | 'warning' | 'danger'
  actionLabel: string
  actionRoute: string
}

export default function InsightsPanel() {
  const navigate = useNavigate()
  const { vehicles } = useVehicleStore()
  const { inspections } = useInspectionStore()
  const { customers } = useCustomerStore()
  const { leads } = useLeadStore()

  const insights = useMemo<Insight[]>(() => {
    const result: Insight[] = []

    const noPhotoVehicles = vehicles.filter((v) => !v.photos || v.photos.length === 0)
    if (noPhotoVehicles.length > 0) {
      result.push({
        title: `${noPhotoVehicles.length} vehicle(s) have no advertisement photos`,
        description: 'Vehicles without photos are less likely to attract buyers.',
        severity: 'warning',
        actionLabel: 'Review Inventory',
        actionRoute: '/inventory',
      })
    }

    const now = new Date()
    const expiredVehicles = inspections.filter((insp) => {
      const expiry = insp.vehicleInfo?.licenseExpiry
      return expiry && new Date(expiry) < now
    })
    if (expiredVehicles.length > 0) {
      result.push({
        title: `${expiredVehicles.length} vehicle(s) have expired license discs`,
        description: 'License expiry should be updated or flagged for renewal.',
        severity: 'danger',
        actionLabel: 'Open Inspections',
        actionRoute: '/inspection',
      })
    }

    const incompleteInspections = inspections.filter((i) => i.progress < 100 && i.status !== 'completed')
    if (incompleteInspections.length > 0) {
      result.push({
        title: `${incompleteInspections.length} inspection(s) not yet completed`,
        description: 'Continue capturing checklist items, photos, and financial details.',
        severity: 'info',
        actionLabel: 'Continue Inspection',
        actionRoute: '/inspection',
      })
    }

    const highMargin = inspections.filter((i) => {
      const margin = i.financial?.expectedMargin
      return margin !== null && margin !== undefined && margin > 15
    })
    if (highMargin.length > 0) {
      result.push({
        title: `${highMargin.length} vehicle(s) with high expected margin (>15%)`,
        description: 'These vehicles represent strong profit potential.',
        severity: 'success',
        actionLabel: 'View Reports',
        actionRoute: '/reports',
      })
    }

    const scoredInspections = inspections.filter((i) => {
      const scores = Object.values(i.score || {}).filter((s): s is number => typeof s === 'number' && s !== null)
      if (scores.length === 0) return false
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      return avg < 50
    })
    if (scoredInspections.length > 0) {
      result.push({
        title: `${scoredInspections.length} vehicle(s) have low inspection scores`,
        description: 'Low scores may indicate costly repairs or condition issues.',
        severity: 'warning',
        actionLabel: 'Review Inspections',
        actionRoute: '/inspection',
      })
    }

    const followUpLeads = leads.filter((l) => l.status === 'new' || l.status === 'contacted')
    if (followUpLeads.length > 0) {
      result.push({
        title: `${followUpLeads.length} lead(s) need follow-up`,
        description: 'Act quickly on new or contacted leads to improve conversion.',
        severity: 'info',
        actionLabel: 'Open Customers & Leads',
        actionRoute: '/customers',
      })
    }

    if (result.length === 0) {
      result.push({
        title: 'All systems look great',
        description: 'No critical issues detected.',
        severity: 'success',
        actionLabel: 'Go to Dashboard',
        actionRoute: '/',
      })
    }

    return result
  }, [vehicles, inspections, customers, leads])

  const severityStyles: Record<Insight['severity'], string> = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-red-50 text-red-800 border-red-200',
  }

  return (
    <div className="space-y-3">
      {insights.slice(0, 4).map((insight, idx) => (
        <div key={idx} className={`rounded-xl border p-4 ${severityStyles[insight.severity]}`}>
          <h3 className="font-semibold text-gray-900">{insight.title}</h3>
          <p className="text-sm mt-1 opacity-90">{insight.description}</p>
          <button
            onClick={() => navigate(insight.actionRoute)}
            className="mt-3 bg-white text-gray-800 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm hover:bg-gray-50"
          >
            {insight.actionLabel}
          </button>
        </div>
      ))}
    </div>
  )
}
