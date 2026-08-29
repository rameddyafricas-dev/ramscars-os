import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function Settings() {
  const [defaultStatus, setDefaultStatus] = useState<'draft' | 'in_progress'>('draft')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const savedStatus = localStorage.getItem('ramscars_default_inspection_status')
    if (savedStatus === 'draft' || savedStatus === 'in_progress') {
      setDefaultStatus(savedStatus)
    }
  }, [])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('ramscars_default_inspection_status', defaultStatus)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

      <form onSubmit={handleSave} className="card p-6 space-y-5 mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Preferences</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Inspection Status
          </label>
          <select
            value={defaultStatus}
            onChange={(e) => setDefaultStatus(e.target.value as 'draft' | 'in_progress')}
            className="border border-gray-300 rounded-xl px-4 py-2.5 bg-white"
          >
            <option value="draft">Draft</option>
            <option value="in_progress">In Progress</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            New inspections will start with this status.
          </p>
        </div>

        <button
          type="submit"
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700"
        >
          {saved ? '✓ Saved' : 'Save Settings'}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/profile" className="card p-5 hover:bg-gray-50">
          <h3 className="font-semibold text-gray-800">Dealer Profile</h3>
          <p className="text-sm text-gray-600 mt-1">Manage dealership details used across inspections and reports.</p>
        </Link>
        <Link to="/data" className="card p-5 hover:bg-gray-50">
          <h3 className="font-semibold text-gray-800">Data Management</h3>
          <p className="text-sm text-gray-600 mt-1">Export, restore, or clear all business data.</p>
        </Link>
      </div>

      <div className="card p-5 mt-6">
        <h3 className="font-semibold text-gray-800">About</h3>
        <p className="text-sm text-gray-600 mt-1">RamsCars Operating System 2.0</p>
        <p className="text-xs text-gray-500 mt-1">Local-first, offline-capable vehicle dealership OS.</p>
      </div>
    </div>
  )
}
