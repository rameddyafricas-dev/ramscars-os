import { useEffect, useMemo } from 'react'
import { useAuditStore } from '../store/useAuditStore'
import { useInspectionStore } from '../store/useInspectionStore'
import { useSaleStore } from '../store/useSaleStore'
import { useDocumentStore } from '../store/useDocumentStore'
import { useReminderStore } from '../store/useReminderStore'
import type { Vehicle } from '../types'

interface VehicleTimelineProps {
  vehicle: Vehicle
}

const actionIcon: Record<string, string> = {
  created: '➕',
  updated: '✏️',
  deleted: '🗑️',
  completed: '✅',
  cancelled: '❌',
  payment_received: '💰',
}

export default function VehicleTimeline({ vehicle }: VehicleTimelineProps) {
  const { logs, loadLogs } = useAuditStore()
  const { inspections, loadInspections } = useInspectionStore()
  const { sales, loadSales } = useSaleStore()
  const { documents, loadDocuments } = useDocumentStore()
  const { reminders, loadReminders } = useReminderStore()

  useEffect(() => {
    loadLogs()
    loadInspections()
    loadSales()
    loadDocuments()
    loadReminders()
  }, [loadLogs, loadInspections, loadSales, loadDocuments, loadReminders])

  const relevantIds = useMemo(() => {
    const ids = new Set<string>()
    ids.add(vehicle.id)

    const inspection = inspections.find(i => i.id === vehicle.inspectionId)
    if (inspection) ids.add(inspection.id)

    const vehicleSales = sales.filter(s => s.vehicleId === vehicle.id)
    vehicleSales.forEach(s => ids.add(s.id))

    const vehicleDocs = documents.filter(d => d.vehicleId === vehicle.id)
    vehicleDocs.forEach(d => ids.add(d.id))

    const vehicleReminders = reminders.filter(r => r.vehicleId === vehicle.id)
    vehicleReminders.forEach(r => ids.add(r.id))

    // Also add inspectionId from vehicle
    if (vehicle.inspectionId) ids.add(vehicle.inspectionId)

    return ids
  }, [vehicle, inspections, sales, documents, reminders])

  const timeline = useMemo(() => {
    return logs
      .filter(log => relevantIds.has(log.entityId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 30)
  }, [logs, relevantIds])

  if (timeline.length === 0) {
    return (
      <p className="text-gray-500 text-sm py-4">
        No activity recorded yet. Actions like inspections, documents, sales, and payments will appear here.
      </p>
    )
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {timeline.map(log => (
        <div key={log.id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
          <span className="text-lg">{actionIcon[log.action] || '•'}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-800">{log.message}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {log.entityType} · {log.action.replace('_', ' ')} · {new Date(log.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
