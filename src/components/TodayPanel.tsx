import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVehicleStore } from '../store/useVehicleStore'
import { useSaleStore } from '../store/useSaleStore'
import { useReminderStore } from '../store/useReminderStore'

interface ActionItem {
  label: string
  count: number
  path: string
  color: string
}

export default function TodayPanel() {
  const navigate = useNavigate()
  const { vehicles, loadVehicles } = useVehicleStore()
  const { sales, loadSales } = useSaleStore()
  const { reminders, loadReminders } = useReminderStore()

  useEffect(() => {
    loadVehicles()
    loadSales()
    loadReminders()
  }, [loadVehicles, loadSales, loadReminders])

  const items = useMemo<ActionItem[]>(() => {
    const hpiPending = vehicles.filter(v => {
      const status = v.hpiStatus || 'not_requested'
      return status !== 'cleared' && status !== 'flagged'
    }).length

    const payoutsDue = vehicles.filter(v => {
      const sale = sales
        .filter(s => s.vehicleId === v.id && s.status === 'completed')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      return !!sale && !v.ownerPayoutPaid
    }).length

    const ownershipPending = vehicles.filter(v => {
      const sale = sales
        .filter(s => s.vehicleId === v.id && s.status === 'completed')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      const status = v.trafficStatus || 'not_started'
      return !!sale && status !== 'transferred'
    }).length

    const todayStr = new Date().toISOString().slice(0, 10)
    const remindersDue = reminders.filter(r => {
      if (r.completed) return false
      if (!r.dueDate) return false
      return r.dueDate <= todayStr
    }).length

    return [
      { label: 'HPI Pending', count: hpiPending, path: '/hpi-traffic', color: 'bg-yellow-100 text-yellow-800' },
      { label: 'Payouts Due', count: payoutsDue, path: '/payouts', color: 'bg-red-100 text-red-800' },
      { label: 'Ownership Pending', count: ownershipPending, path: '/hpi-traffic', color: 'bg-blue-100 text-blue-800' },
      { label: 'Reminders Due', count: remindersDue, path: '/reminders', color: 'bg-purple-100 text-purple-800' },
    ]
  }, [vehicles, sales, reminders])

  const totalActions = items.reduce((sum, i) => sum + i.count, 0)

  return (
    <div className="card p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Today</h2>
        {totalActions > 0 ? (
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
            {totalActions} action{totalActions === 1 ? '' : 's'} needed
          </span>
        ) : (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
            All clear
          </span>
        )}
      </div>

      {totalActions === 0 ? (
        <p className="text-sm text-gray-500">
          Nothing urgent right now. Keep going.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {items.map(item => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`rounded-xl p-4 text-left ${item.color} hover:opacity-90 transition-opacity`}
            >
              <p className="text-xs font-medium opacity-80">{item.label}</p>
              <p className="text-2xl font-bold mt-1">{item.count}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
