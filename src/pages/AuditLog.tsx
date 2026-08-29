import { useEffect, useState, useMemo } from 'react'
import { useAuditStore } from '../store/useAuditStore'

export default function AuditLog() {
  const { logs, loadLogs, isLoading } = useAuditStore()
  const [filter, setFilter] = useState('')

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const filtered = useMemo(() => {
    if (!filter.trim()) return [...logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return logs
      .filter((log) =>
        `${log.entityType} ${log.action} ${log.message}`.toLowerCase().includes(filter.toLowerCase())
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [logs, filter])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    logs.forEach((log) => {
      c[log.action] = (c[log.action] || 0) + 1
    })
    return c
  }, [logs])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {logs.length} event(s)
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Created</p>
          <p className="text-xl font-bold text-gray-900">{counts.created || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Updated</p>
          <p className="text-xl font-bold text-gray-900">{counts.updated || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Deleted</p>
          <p className="text-xl font-bold text-gray-900">{counts.deleted || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Payments</p>
          <p className="text-xl font-bold text-gray-900">{counts.payment_received || 0}</p>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Event History</h2>
          <input
            type="text"
            placeholder="Filter events..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm w-64"
          />
        </div>

        {isLoading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 text-sm">No audit events found.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((log) => (
              <div key={log.id} className="flex items-start justify-between bg-gray-50 rounded-xl p-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800">{log.message}</p>
                  <p className="text-xs text-gray-500">
                    {log.entityType} • {log.action} • {new Date(log.createdAt).toLocaleString()}
                  </p>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <pre className="text-xs text-gray-500 mt-1 overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
