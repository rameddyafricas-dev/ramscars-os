import { useEffect, useMemo, useState } from 'react'
import { useAuditStore } from '../store/useAuditStore'

export default function AuditLogPanel() {
  const { logs, loadLogs, isLoading } = useAuditStore()
  const [filter, setFilter] = useState('')

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const filtered = useMemo(() => {
    if (!filter.trim()) return [...logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10)
    return logs
      .filter((log) => `${log.entityType} ${log.action} ${log.message}`.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20)
  }, [logs, filter])

  return (
    <div>
      <input
        type="text"
        placeholder="Filter audit log..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm mb-3"
      />
      {isLoading ? (
        <p className="text-gray-500 text-sm">Loading audit log...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">No audit events found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((log) => (
            <div key={log.id} className="bg-gray-50 rounded-xl p-3">
              <p className="font-medium text-gray-800">{log.message}</p>
              <p className="text-xs text-gray-500">
                {log.entityType} • {log.action} • {new Date(log.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
