import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCommunicationStore } from '../store/useCommunicationStore'
import { useVehicleStore } from '../store/useVehicleStore'
import { useCustomerStore } from '../store/useCustomerStore'
import { useToastStore } from '../store/useToastStore'
import ConfirmDialog from '../components/ConfirmDialog'
import { generateId } from '../utils/id'
import type { Communication, CommunicationChannel, CommunicationDirection } from '../types'

const channelLabels: Record<CommunicationChannel, string> = {
  call: '📞 Call',
  whatsapp: '💬 WhatsApp',
  sms: '✉️ SMS',
  email: '📧 Email',
  in_person: '🤝 In Person',
  other: '• Other',
}

export default function Communications() {
  const { communications, loadCommunications, createCommunication, updateCommunication, deleteCommunication } = useCommunicationStore()
  const { vehicles, loadVehicles } = useVehicleStore()
  const { customers, loadCustomers } = useCustomerStore()
  const { show: showToast } = useToastStore()
  const [searchParams] = useSearchParams()
  const vehicleParam = searchParams.get('vehicle') || ''
  const customerParam = searchParams.get('customer') || ''

  const [vehicleId, setVehicleId] = useState(vehicleParam)
  const [customerId, setCustomerId] = useState(customerParam)
  const [channel, setChannel] = useState<CommunicationChannel>('call')
  const [direction, setDirection] = useState<CommunicationDirection>('outbound')
  const [subject, setSubject] = useState('')
  const [notes, setNotes] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')

  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState<'all' | CommunicationChannel>('all')
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCommunications()
    loadVehicles()
    loadCustomers()
  }, [loadCommunications, loadVehicles, loadCustomers])

  useEffect(() => {
    if (vehicleParam) setVehicleId(vehicleParam)
    if (customerParam) setCustomerId(customerParam)
  }, [vehicleParam, customerParam])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return communications
      .filter(c => {
        const vehicle = vehicles.find(v => v.id === c.vehicleId)
        const customer = customers.find(cu => cu.id === c.customerId)
        const haystack = `${c.subject} ${c.notes || ''} ${vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : ''} ${customer?.name || ''}`.toLowerCase()
        const matchesSearch = q === '' || haystack.includes(q)
        const matchesChannel = channelFilter === 'all' || c.channel === channelFilter
        return matchesSearch && matchesChannel
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [communications, vehicles, customers, search, channelFilter])

  const resetForm = () => {
    setVehicleId('')
    setCustomerId('')
    setChannel('call')
    setDirection('outbound')
    setSubject('')
    setNotes('')
    setFollowUpDate('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim()) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const comm: Communication = {
        id: generateId('comm'),
        vehicleId: vehicleId || undefined,
        customerId: customerId || undefined,
        channel,
        direction,
        subject: subject.trim(),
        notes: notes.trim() || undefined,
        followUpDate: followUpDate || undefined,
        followUpDone: false,
        createdAt: now,
        updatedAt: now,
      }
      await createCommunication(comm)
      showToast('Communication logged', 'success')
      resetForm()
    } catch (err) {
      showToast((err as Error).message || 'Failed to log communication', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleFollowUp = async (comm: Communication) => {
    try {
      await updateCommunication({
        ...comm,
        followUpDone: !comm.followUpDone,
        updatedAt: new Date().toISOString(),
      })
    } catch (err) {
      showToast((err as Error).message || 'Failed to update', 'error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Communication Log</h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {communications.length} entr{communications.length === 1 ? 'y' : 'ies'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add communication */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Log Communication</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              disabled={!!vehicleParam}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 disabled:bg-gray-100"
            >
              <option value="">No vehicle</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>
              ))}
            </select>

            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              disabled={!!customerParam}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 disabled:bg-gray-100"
            >
              <option value="">No customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as CommunicationChannel)}
                className="border border-gray-300 rounded-xl px-4 py-2.5"
              >
                {(Object.keys(channelLabels) as CommunicationChannel[]).map(k => (
                  <option key={k} value={k}>{channelLabels[k]}</option>
                ))}
              </select>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as CommunicationDirection)}
                className="border border-gray-300 rounded-xl px-4 py-2.5"
              >
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
            </div>

            <input
              type="text"
              placeholder="Subject (e.g. Called about pricing)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
              required
            />

            <textarea
              rows={3}
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
            />

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Follow-up Date (optional)</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Log Communication'}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-2.5 flex-1"
            />
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value as any)}
              className="border border-gray-300 rounded-xl px-4 py-2.5"
            >
              <option value="all">All channels</option>
              {(Object.keys(channelLabels) as CommunicationChannel[]).map(k => (
                <option key={k} value={k}>{channelLabels[k]}</option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <p className="text-gray-500 text-sm">No communications logged.</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filtered.map(comm => {
                const vehicle = vehicles.find(v => v.id === comm.vehicleId)
                const customer = customers.find(c => c.id === comm.customerId)
                return (
                  <div key={comm.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">
                            {channelLabels[comm.channel]}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${comm.direction === 'inbound' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                            {comm.direction}
                          </span>
                          {comm.followUpDate && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${comm.followUpDone ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              Follow-up: {comm.followUpDate} {comm.followUpDone && '✓'}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-gray-800 mt-1">{comm.subject}</p>
                        {comm.notes && <p className="text-sm text-gray-600 mt-1">{comm.notes}</p>}
                        <p className="text-xs text-gray-500 mt-2">
                          {vehicle && `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          {vehicle && customer && ' · '}
                          {customer && customer.name}
                          {!vehicle && !customer && 'General'}
                          {' · '}
                          {new Date(comm.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {comm.followUpDate && (
                          <button
                            onClick={() => toggleFollowUp(comm)}
                            className="text-xs text-indigo-600 hover:underline"
                          >
                            {comm.followUpDone ? 'Reopen' : 'Done'}
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTargetId(comm.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteTargetId !== null}
        title="Delete Communication"
        message="Are you sure you want to delete this entry?"
        confirmLabel="Delete"
        onConfirm={() => { if (deleteTargetId) deleteCommunication(deleteTargetId); setDeleteTargetId(null); }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  )
}
