import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useVehicleStore } from '../store/useVehicleStore'
import { useInspectionStore } from '../store/useInspectionStore'
import { useCustomerStore } from '../store/useCustomerStore'
import { useLeadStore } from '../store/useLeadStore'
import InsightsPanel from '../components/InsightsPanel'
import { useSaleStore } from '../store/useSaleStore'

export default function Dashboard() {
  const { vehicles, loadVehicles } = useVehicleStore()
  const { inspections, loadInspections } = useInspectionStore()
  const { customers, loadCustomers } = useCustomerStore()
  const { leads, loadLeads } = useLeadStore()
  const { sales, payments, loadSales, loadPayments } = useSaleStore()

  useEffect(() => {
    loadVehicles()
    loadInspections()
    loadCustomers()
    loadLeads()
    loadSales()
    loadPayments()
  }, [loadVehicles, loadInspections, loadCustomers, loadLeads, loadSales, loadPayments])

  const stats = useMemo(() => {
    const sold = vehicles.filter((v) => v.status === 'sold').length
    const available = vehicles.filter((v) => v.status === 'available').length
    const reserved = vehicles.filter((v) => v.status === 'reserved').length
    const withdrawn = vehicles.filter((v) => v.status === 'withdrawn').length
    const inspectionsCompleted = inspections.filter((i) => i.status === 'completed').length
    const inspectionsDraft = inspections.filter((i) => i.status === 'draft').length
    const inspectionsInProgress = inspections.filter((i) => i.status === 'in_progress').length
    const totalCustomers = customers.length
    const openLeads = leads.filter((l) => l.status === 'new' || l.status === 'contacted' || l.status === 'viewing' || l.status === 'negotiating').length

    const totalVehicleValue = vehicles.reduce((sum, v) => sum + (v.listingPrice || 0), 0)
    const totalProfitPotential = inspections.reduce((sum, i) => sum + (i.financial.estimatedProfit || 0), 0)
    const totalRevenue = sales.filter((s) => s.status === 'completed').reduce((sum, s) => sum + (s.salePrice || 0), 0)
    const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const totalDeposits = sales.reduce((sum, s) => sum + (s.deposit || 0), 0)
    const outstanding = sales.filter((s) => s.status !== 'completed').reduce((sum, s) => sum + (s.salePrice || 0), 0) - totalPayments

    return {
      sold,
      available,
      reserved,
      withdrawn,
      inspectionsCompleted,
      inspectionsDraft,
      inspectionsInProgress,
      totalCustomers,
      openLeads,
      totalVehicleValue,
      totalProfitPotential,
      totalRevenue,
      totalPayments,
      totalDeposits,
      outstanding,
      totalVehicles: vehicles.length,
      totalInspections: inspections.length,
    }
  }, [vehicles, inspections, customers, leads, sales, payments])

  const recentVehicles = useMemo(() => {
    return [...vehicles]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)
  }, [vehicles])

  const metricCards = [
    { label: 'Total Vehicles', value: stats.totalVehicles, color: 'from-indigo-500 to-purple-600' },
    { label: 'Available', value: stats.available, color: 'from-green-500 to-emerald-600' },
    { label: 'Reserved', value: stats.reserved, color: 'from-yellow-500 to-amber-600' },
    { label: 'Sold', value: stats.sold, color: 'from-red-500 to-rose-600' },
    { label: 'Inspections', value: stats.totalInspections, color: 'from-blue-500 to-cyan-600' },
    { label: 'Customers', value: stats.totalCustomers, color: 'from-pink-500 to-fuchsia-600' },
    { label: 'Open Leads', value: stats.openLeads, color: 'from-orange-500 to-amber-600' },
    { label: 'Withdrawn', value: stats.withdrawn, color: 'from-slate-500 to-gray-600' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Link to="/inspection" className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700">
          + New Inspection
        </Link>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {metricCards.map((card) => (
          <div key={card.label} className={`card p-4 bg-gradient-to-br ${card.color} text-white border-0`}>
            <div className="text-sm font-medium opacity-90">{card.label}</div>
            <div className="text-3xl font-bold mt-2">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Finance Overview</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Revenue (Completed)</span>
              <span className="font-semibold text-green-700">R {stats.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payments Received</span>
              <span className="font-semibold text-indigo-600">R {stats.totalPayments.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Deposits</span>
              <span className="font-semibold text-amber-600">R {stats.totalDeposits.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Outstanding</span>
              <span className="font-semibold text-red-600">R {Math.max(stats.outstanding, 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Vehicle Value</span>
              <span className="font-semibold">R {stats.totalVehicleValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Profit Potential</span>
              <span className="font-semibold text-purple-600">R {stats.totalProfitPotential.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Inspection Status</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Draft</span>
              <span className="font-semibold">{stats.inspectionsDraft}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">In Progress</span>
              <span className="font-semibold text-yellow-600">{stats.inspectionsInProgress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed</span>
              <span className="font-semibold text-green-600">{stats.inspectionsCompleted}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Insights */}
      <div className="card p-5 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">AI Insight</h2>
        <InsightsPanel />
      </div>

      {/* Recent vehicles */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Inventory</h2>
        {recentVehicles.length === 0 ? (
          <p className="text-gray-500 text-sm">No vehicles yet. Start a new inspection.</p>
        ) : (
          <div className="space-y-2">
            {recentVehicles.map((vehicle) => (
              <div key={vehicle.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                {vehicle.photos && vehicle.photos.length > 0 ? (
                  <img src={vehicle.photos[0]} alt="" className="h-12 w-12 object-cover rounded-lg" />
                ) : (
                  <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-400">No img</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    Stock: {vehicle.stockNumber || '—'} • {vehicle.status}
                  </p>
                </div>
                {vehicle.listingPrice !== undefined && (
                  <span className="text-sm font-semibold text-gray-800">R {vehicle.listingPrice.toLocaleString()}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
