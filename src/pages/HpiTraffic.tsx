import { useEffect, useMemo, useState } from 'react'
import { useVehicleStore } from '../store/useVehicleStore'
import { useInspectionStore } from '../store/useInspectionStore'
import { useSaleStore } from '../store/useSaleStore'
import { useToastStore } from '../store/useToastStore'
import type { Vehicle } from '../types'

type HpiStatus = NonNullable<Vehicle['hpiStatus']>
type TrafficStatus = NonNullable<Vehicle['trafficStatus']>

const hpiLabels: Record<HpiStatus, string> = {
  not_requested: 'Not Requested',
  requested: 'Requested',
  cleared: 'Cleared',
  flagged: 'Flagged',
}

const trafficLabels: Record<TrafficStatus, string> = {
  not_started: 'Not Started',
  docs_submitted: 'Docs Submitted',
  processing: 'Processing',
  transferred: 'Transferred',
}

const hpiColor = (status: HpiStatus) =>
  status === 'cleared' ? 'bg-green-100 text-green-700' :
  status === 'flagged' ? 'bg-red-100 text-red-700' :
  status === 'requested' ? 'bg-yellow-100 text-yellow-700' :
  'bg-gray-100 text-gray-700'

const trafficColor = (status: TrafficStatus) =>
  status === 'transferred' ? 'bg-green-100 text-green-700' :
  status === 'processing' ? 'bg-blue-100 text-blue-700' :
  status === 'docs_submitted' ? 'bg-yellow-100 text-yellow-700' :
  'bg-gray-100 text-gray-700'

export default function HpiTraffic() {
  const { vehicles, loadVehicles, updateVehicle } = useVehicleStore()
  const { loadInspections } = useInspectionStore()
  const { loadSales } = useSaleStore()
  const { show: showToast } = useToastStore()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'hpi_pending' | 'traffic_pending'>('hpi_pending')
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [form, setForm] = useState({
    hpiStatus: 'not_requested' as HpiStatus,
    hpiRequestedDate: '',
    hpiClearedDate: '',
    hpiReference: '',
    hpiNotes: '',
    trafficStatus: 'not_started' as TrafficStatus,
    trafficSubmittedDate: '',
    trafficTransferredDate: '',
    trafficReference: '',
    trafficNotes: '',
  })

  useEffect(() => {
    loadVehicles()
    loadInspections()
    loadSales()
  }, [loadVehicles, loadInspections, loadSales])

  const rows = useMemo(() => {
    return vehicles.map(v => ({
      vehicle: v,
      hpiStatus: (v.hpiStatus || 'not_requested') as HpiStatus,
      trafficStatus: (v.trafficStatus || 'not_started') as TrafficStatus,
    }))
  }, [vehicles])

  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim()
    return rows.filter(r => {
      const matchesSearch = q === '' ||
        `${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model} ${r.vehicle.stockNumber || ''} ${r.vehicle.vin || ''}`
          .toLowerCase().includes(q)
      const matchesFilter =
        filter === 'all' ||
        (filter === 'hpi_pending' && r.hpiStatus !== 'cleared') ||
        (filter === 'traffic_pending' && r.trafficStatus !== 'transferred')
      return matchesSearch && matchesFilter
    })
  }, [rows, search, filter])

  const summary = useMemo(() => {
    const hpiCleared = rows.filter(r => r.hpiStatus === 'cleared').length
    const hpiFlagged = rows.filter(r => r.hpiStatus === 'flagged').length
    const hpiPending = rows.filter(r => r.hpiStatus === 'requested' || r.hpiStatus === 'not_requested').length
    const trafficDone = rows.filter(r => r.trafficStatus === 'transferred').length
    const trafficPending = rows.filter(r => r.trafficStatus !== 'transferred').length
    return { hpiCleared, hpiFlagged, hpiPending, trafficDone, trafficPending }
  }, [rows])

  const openEditor = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setForm({
      hpiStatus: (vehicle.hpiStatus || 'not_requested') as HpiStatus,
      hpiRequestedDate: vehicle.hpiRequestedDate || '',
      hpiClearedDate: vehicle.hpiClearedDate || '',
      hpiReference: vehicle.hpiReference || '',
      hpiNotes: vehicle.hpiNotes || '',
      trafficStatus: (vehicle.trafficStatus || 'not_started') as TrafficStatus,
      trafficSubmittedDate: vehicle.trafficSubmittedDate || '',
      trafficTransferredDate: vehicle.trafficTransferredDate || '',
      trafficReference: vehicle.trafficReference || '',
      trafficNotes: vehicle.trafficNotes || '',
    })
  }

  const handleSave = async () => {
    if (!editingVehicle) return
    try {
      const isHpiCleared = form.hpiStatus === 'cleared'
      const isOwnershipDone = form.trafficStatus === 'transferred'
      await updateVehicle({
        ...editingVehicle,
        hpiStatus: form.hpiStatus,
        hpiRequestedDate: form.hpiRequestedDate || undefined,
        hpiClearedDate: form.hpiClearedDate || undefined,
        hpiReference: form.hpiReference || undefined,
        hpiNotes: form.hpiNotes || undefined,
        hpiPassed: isHpiCleared || editingVehicle.hpiPassed,
        trafficStatus: form.trafficStatus,
        trafficSubmittedDate: form.trafficSubmittedDate || undefined,
        trafficTransferredDate: form.trafficTransferredDate || undefined,
        trafficReference: form.trafficReference || undefined,
        trafficNotes: form.trafficNotes || undefined,
        ownershipDone: isOwnershipDone || editingVehicle.ownershipDone,
        updatedAt: new Date().toISOString(),
      })
      showToast('Workflow updated', 'success')
      setEditingVehicle(null)
    } catch (err) {
      showToast((err as Error).message || 'Failed to update workflow', 'error')
    }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">HPI & Traffic Workflow</h1>
        <div className="flex gap-2">
          <button onClick={() => setFilter('hpi_pending')} className={`px-3 py-1.5 rounded-lg text-sm ${filter === 'hpi_pending' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'}`}>HPI Pending</button>
          <button onClick={() => setFilter('traffic_pending')} className={`px-3 py-1.5 rounded-lg text-sm ${filter === 'traffic_pending' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'}`}>Traffic Pending</button>
          <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm ${filter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'}`}>All</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500">HPI Cleared</p>
          <p className="text-xl font-bold text-green-600">{summary.hpiCleared}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500">HPI Pending</p>
          <p className="text-xl font-bold text-yellow-600">{summary.hpiPending}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500">HPI Flagged</p>
          <p className="text-xl font-bold text-red-600">{summary.hpiFlagged}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500">Ownership Done</p>
          <p className="text-xl font-bold text-green-600">{summary.trafficDone}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500">Traffic Pending</p>
          <p className="text-xl font-bold text-blue-600">{summary.trafficPending}</p>
        </div>
      </div>

      <div className="card p-4 mb-6">
        <input
          type="text"
          placeholder="Search by make, model, VIN, or stock number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2.5 w-full md:w-96"
        />
      </div>

      {filteredRows.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <p className="text-lg font-medium mb-2">No vehicles match the filter</p>
          <p className="text-sm">Adjust the search or switch filter.</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {filteredRows.map(({ vehicle, hpiStatus, trafficStatus }) => (
            <div key={vehicle.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-800">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </p>
                <p className="text-xs text-gray-500">
                  Stock: {vehicle.stockNumber || '—'} · VIN: {vehicle.vin || '—'}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full ${hpiColor(hpiStatus)}`}>
                    HPI: {hpiLabels[hpiStatus]}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full ${trafficColor(trafficStatus)}`}>
                    Traffic: {trafficLabels[trafficStatus]}
                  </span>
                  {vehicle.hpiReference && (
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                      Ref: {vehicle.hpiReference}
                    </span>
                  )}
                  {vehicle.trafficReference && (
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                      Traffic Ref: {vehicle.trafficReference}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => openEditor(vehicle)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-indigo-700"
              >
                Update Status
              </button>
            </div>
          ))}
        </div>
      )}

      {editingVehicle && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4" onClick={() => setEditingVehicle(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Update HPI & Traffic</h2>
                <p className="text-sm text-gray-500">
                  {editingVehicle.year} {editingVehicle.make} {editingVehicle.model}
                </p>
              </div>
              <button onClick={() => setEditingVehicle(null)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">HPI / Police Check</h3>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={form.hpiStatus}
                  onChange={e => setForm({ ...form, hpiStatus: e.target.value as HpiStatus })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 mb-3"
                >
                  {(Object.keys(hpiLabels) as HpiStatus[]).map(k => (
                    <option key={k} value={k}>{hpiLabels[k]}</option>
                  ))}
                </select>

                <label className="block text-xs font-medium text-gray-600 mb-1">Requested Date</label>
                <input
                  type="date"
                  value={form.hpiRequestedDate}
                  onChange={e => setForm({ ...form, hpiRequestedDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 mb-3"
                />

                <label className="block text-xs font-medium text-gray-600 mb-1">Cleared Date</label>
                <input
                  type="date"
                  value={form.hpiClearedDate}
                  onChange={e => setForm({ ...form, hpiClearedDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 mb-3"
                />

                <label className="block text-xs font-medium text-gray-600 mb-1">Reference</label>
                <input
                  type="text"
                  placeholder="HPI report number"
                  value={form.hpiReference}
                  onChange={e => setForm({ ...form, hpiReference: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 mb-3"
                />

                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={form.hpiNotes}
                  onChange={e => setForm({ ...form, hpiNotes: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Traffic Department</h3>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={form.trafficStatus}
                  onChange={e => setForm({ ...form, trafficStatus: e.target.value as TrafficStatus })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 mb-3"
                >
                  {(Object.keys(trafficLabels) as TrafficStatus[]).map(k => (
                    <option key={k} value={k}>{trafficLabels[k]}</option>
                  ))}
                </select>

                <label className="block text-xs font-medium text-gray-600 mb-1">Docs Submitted Date</label>
                <input
                  type="date"
                  value={form.trafficSubmittedDate}
                  onChange={e => setForm({ ...form, trafficSubmittedDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 mb-3"
                />

                <label className="block text-xs font-medium text-gray-600 mb-1">Transferred Date</label>
                <input
                  type="date"
                  value={form.trafficTransferredDate}
                  onChange={e => setForm({ ...form, trafficTransferredDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 mb-3"
                />

                <label className="block text-xs font-medium text-gray-600 mb-1">Reference</label>
                <input
                  type="text"
                  placeholder="Traffic / NCO reference"
                  value={form.trafficReference}
                  onChange={e => setForm({ ...form, trafficReference: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 mb-3"
                />

                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={form.trafficNotes}
                  onChange={e => setForm({ ...form, trafficNotes: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={handleSave} className="flex-1 bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700">
                Save Workflow
              </button>
              <button onClick={() => setEditingVehicle(null)} className="flex-1 bg-gray-200 text-gray-800 px-5 py-3 rounded-xl hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
