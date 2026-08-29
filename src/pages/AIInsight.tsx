import { useEffect, useMemo } from 'react'
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

export default function AIInsight() {
  const navigate = useNavigate()
  const { vehicles, loadVehicles } = useVehicleStore()
  const { inspections, loadInspections } = useInspectionStore()
  const { customers, loadCustomers } = useCustomerStore()
  const { leads, loadLeads } = useLeadStore()

  useEffect(() => {
    loadVehicles()
    loadInspections()
    loadCustomers()
    loadLeads()
  }, [loadVehicles, loadInspections, loadCustomers, loadLeads])

  const insights = useMemo<Insight[]>(() => {
    const result: Insight[] = []

    // Vehicles with no photos
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

    // Expired license
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

    // Incomplete inspections
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

    // High margin opportunities
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

    // Low inspection scores
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

    // Leads needing follow-up
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

    // Customers with no leads
    const customerIdsWithLeads = new Set(leads.map((l) => l.customerId))
    const customersWithoutLeads = customers.filter((c) => !customerIdsWithLeads.has(c.id))
    if (customersWithoutLeads.length > 0) {
      result.push({
        title: `${customersWithoutLeads.length} customer(s) have no active leads`,
        description: 'Consider creating leads or follow-up tasks for these customers.',
        severity: 'warning',
        actionLabel: 'Manage Customers',
        actionRoute: '/customers',
      })
    }

    // No insights
    if (result.length === 0) {
      result.push({
        title: 'All systems look great',
        description: 'No critical issues detected across vehicles, inspections, customers, and leads.',
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">AI Insight</h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Local Smart Analytics
        </span>
      </div>

      <div className="card p-5 mb-6">
        <p className="text-gray-600 text-sm">
          These insights are generated automatically from your vehicles, inspections, customers, and leads.
          No data leaves your device.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className={`rounded-2xl border p-5 ${severityStyles[insight.severity]}`}
          >
            <h3 className="font-semibold text-gray-900">{insight.title}</h3>
            <p className="text-sm mt-1 opacity-90">{insight.description}</p>
            <button
              onClick={() => navigate(insight.actionRoute)}
              className="mt-4 bg-white text-gray-800 px-4 py-2 rounded-xl text-sm font-medium shadow-sm hover:bg-gray-50"
            >
              {insight.actionLabel}
            </button>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total Vehicles</p>
          <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total Inspections</p>
          <p className="text-2xl font-bold text-gray-900">{inspections.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total Customers</p>
          <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Open Leads</p>
          <p className="text-2xl font-bold text-gray-900">
            {leads.filter((l) => l.status === 'new' || l.status === 'contacted' || l.status === 'viewing').length}
          </p>
        </div>
      </div>
    </div>
  )
}
