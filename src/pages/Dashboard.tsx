import { useEffect, useMemo } from 'react'
import { useVehicleStore } from '../store/useVehicleStore'
import { useInspectionStore } from '../store/useInspectionStore'
import { useCustomerStore } from '../store/useCustomerStore'
import { useSaleStore } from '../store/useSaleStore'
import { useReminderStore } from '../store/useReminderStore'
import InsightsPanel from '../components/InsightsPanel'
import AuditLogPanel from '../components/AuditLogPanel'

export default function Dashboard() {
  const { vehicles, loadVehicles } = useVehicleStore()
  const { inspections, loadInspections } = useInspectionStore()
  const { customers, loadCustomers } = useCustomerStore()
  const { sales, payments, loadSales, loadPayments } = useSaleStore()
  const { reminders, loadReminders } = useReminderStore()

  useEffect(() => {
    loadVehicles()
    loadInspections()
    loadCustomers()
    loadSales()
    loadPayments()
    loadReminders()
  }, [loadVehicles, loadInspections, loadCustomers, loadSales, loadPayments, loadReminders])

  const stats = useMemo(() => {
    const sold = vehicles.filter((v) => v.status === 'sold').length
    const available = vehicles.filter((v) => v.status === 'available').length
    const reserved = vehicles.filter((v) => v.status === 'reserved').length
    const withdrawn = vehicles.filter((v) => v.status === 'withdrawn').length
    const inspectionsCompleted = inspections.filter((i) => i.status === 'completed').length
    const inspectionsInProgress = inspections.filter((i) => i.status === 'in_progress').length
    const totalCustomers = customers.length
    const totalVehicleValue = vehicles.reduce((sum, v) => sum + (v.listingPrice || 0), 0)
    const totalProfitPotential = inspections.reduce((sum, i) => sum + (i.financial.estimatedProfit || 0), 0)
    const totalRevenue = sales.filter((s) => s.status === 'completed').reduce((sum, s) => sum + (s.salePrice || 0), 0)
    const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const totalDeposits = sales.reduce((sum, s) => sum + (s.deposit || 0), 0)
    const outstanding = sales.filter((s) => s.status !== 'completed').reduce((sum, s) => sum + (s.salePrice || 0), 0) - totalPayments
    return {
      sold, available, reserved, withdrawn,
      inspectionsCompleted, inspectionsInProgress,
      totalCustomers, totalVehicleValue, totalProfitPotential,
      totalRevenue, totalPayments, totalDeposits, outstanding: Math.max(outstanding, 0),
      totalVehicles: vehicles.length, totalInspections: inspections.length,
    }
  }, [vehicles, inspections, customers, sales, payments])

  const recentVehicles = useMemo(() => {
    return [...vehicles].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
  }, [vehicles])

  const recentSales = useMemo(() => {
    return [...sales].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
  }, [sales])

  const upcomingReminders = useMemo(() => {
    return reminders.filter(r => !r.completed)
      .sort((a, b) => (a.dueDate + (a.dueTime || '')).localeCompare(b.dueDate + (b.dueTime || '')))
      .slice(0, 5)
  }, [reminders])

  const statusBars = [
    { label: 'Available', count: stats.available, total: stats.totalVehicles, color: 'bg-green-500' },
    { label: 'Reserved', count: stats.reserved, total: stats.totalVehicles, color: 'bg-yellow-500' },
    { label: 'Sold', count: stats.sold, total: stats.totalVehicles, color: 'bg-red-500' },
    { label: 'Withdrawn', count: stats.withdrawn, total: stats.totalVehicles, color: 'bg-gray-500' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
          <div className="text-sm font-medium opacity-90">Total Vehicles</div>
          <div className="text-3xl font-bold mt-2">{stats.totalVehicles}</div>
        </div>
        <div className="card p-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
          <div className="text-sm font-medium opacity-90">Available</div>
          <div className="text-3xl font-bold mt-2">{stats.available}</div>
        </div>
        <div className="card p-4 bg-gradient-to-br from-yellow-500 to-amber-600 text-white border-0">
          <div className="text-sm font-medium opacity-90">Reserved</div>
          <div className="text-3xl font-bold mt-2">{stats.reserved}</div>
        </div>
        <div className="card p-4 bg-gradient-to-br from-red-500 to-rose-600 text-white border-0">
          <div className="text-sm font-medium opacity-90">Sold</div>
          <div className="text-3xl font-bold mt-2">{stats.sold}</div>
        </div>
      </div>

      {/* Vehicle status distribution */}
      <div className="card p-5 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Inventory Status</h2>
        {statusBars.map(status => (
          <div key={status.label} className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">{status.label}</span>
              <span className="font-semibold">{status.count}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`${status.color} h-2 rounded-full`}
                style={{ width: status.total > 0 ? `${(status.count / status.total) * 100}%` : '0%' }}
              ></div>
            </div>
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
              <span className="font-semibold text-red-600">R {stats.outstanding.toLocaleString()}</span>
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
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">In Progress</span>
            <span className="font-semibold text-yellow-600">{stats.inspectionsInProgress}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Completed</span>
            <span className="font-semibold text-green-600">{stats.inspectionsCompleted}</span>
          </div>
        </div>
      </div>

      {/* Smart Insights */}
      <div className="card p-5 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">AI Insight</h2>
        <InsightsPanel />
      </div>

      {/* Recent activity grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Sales</h2>
          {recentSales.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent sales.</p>
          ) : (
            <div className="space-y-2">
              {recentSales.map(sale => {
                const vehicle = vehicles.find(v => v.id === sale.vehicleId)
                const buyer = customers.find(c => c.id === sale.buyerId)
                return (
                  <div key={sale.id} className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown vehicle'}</p>
                      <p className="text-xs text-gray-500 truncate">{buyer?.name || 'Unknown buyer'} • {sale.status.replace('_', ' ')}</p>
                    </div>
                    <span className="font-semibold">R {sale.salePrice.toLocaleString()}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Reminders</h2>
          {upcomingReminders.length === 0 ? (
            <p className="text-gray-500 text-sm">No upcoming reminders.</p>
          ) : (
            <div className="space-y-2">
              {upcomingReminders.map(reminder => (
                <div key={reminder.id} className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{reminder.title}</p>
                    <p className="text-xs text-gray-500">{reminder.dueDate} {reminder.dueTime && `• ${reminder.dueTime}`}</p>
                  </div>
                  {reminder.priority && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${reminder.priority === 'high' ? 'bg-red-100 text-red-700' : reminder.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {reminder.priority}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Audit Log */}
      <div className="card p-5 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
        <AuditLogPanel />
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
