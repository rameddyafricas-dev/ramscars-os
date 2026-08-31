import { useEffect, useState } from 'react'
import { exportAllData, clearAllData, getStoreCounts, type BackupFile } from '../services/backup'
import { addRecord, type DBStores } from '../services/db'

export default function DataManagement() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const loadCounts = async () => {
    try {
      const c = await getStoreCounts()
      setCounts(c)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  useEffect(() => {
    loadCounts()
  }, [])

  const handleExport = async () => {
    try {
      const backup = await exportAllData()
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ramscars-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setStatus('Backup exported successfully')
      setError('')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const backup = JSON.parse(text) as BackupFile
      if (!backup.data) throw new Error('Invalid backup file')

      // Clear existing data
      await clearAllData()

      // Import each store
      const stores = Object.keys(backup.data) as (keyof DBStores)[]
      for (const store of stores) {
        const records = backup.data[store]
        if (!Array.isArray(records)) continue
        for (const record of records) {
          if (!record || !record.id) continue
          await addRecord(store, record)
        }
      }

      setStatus('Restore completed successfully')
      setError('')
      loadCounts()
    } catch (err) {
      setError(`Restore failed: ${(err as Error).message}`)
    }
    e.target.value = ''
  }

  const handleClear = async () => {
    const confirmed = window.confirm('Are you sure? This deletes ALL local data and cannot be undone.')
    if (!confirmed) return
    try {
      await clearAllData()
      setStatus('All data cleared')
      setError('')
      loadCounts()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Data Management</h1>

      {status && <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-4">{status}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Export Backup</h2>
          <p className="text-gray-600 text-sm mb-4">
            Download a JSON file with all vehicles, inspections, customers, sales, payments, documents, reminders, photos, and dealership profile.
          </p>
          <button onClick={handleExport} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700">
            Export Backup
          </button>
        </div>

        {/* Restore */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Restore Backup</h2>
          <p className="text-gray-600 text-sm mb-4">
            Import a previously exported backup file. This will replace current local data.
          </p>
          <label className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl hover:bg-gray-50 cursor-pointer inline-block">
            Choose File
            <input type="file" accept="application/json" onChange={handleRestore} className="hidden" />
          </label>
        </div>

        {/* Storage info */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Storage Diagnostics</h2>
          <div className="space-y-2 text-sm">
            {Object.entries(counts).map(([store, count]) => (
              <div key={store} className="flex justify-between border-b border-gray-100 py-1">
                <span className="text-gray-600 capitalize">{store}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="card p-6 border-red-200">
          <h2 className="text-xl font-semibold text-red-700 mb-3">Danger Zone</h2>
          <p className="text-gray-600 text-sm mb-4">
            Permanently delete all local data. This cannot be undone.
          </p>
          <button onClick={handleClear} className="bg-red-600 text-white px-5 py-2.5 rounded-xl hover:bg-red-700">
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  )
}
