import { useEffect, useState, useMemo } from 'react'
import { useVehicleStore } from '../store/useVehicleStore'
import { useCustomerStore } from '../store/useCustomerStore'
import { useConsignmentStore } from '../store/useConsignmentStore'
import { generateId } from '../utils/id'
import type { Consignment, ConsignmentPeriod, ConsignmentStatus } from '../types'

export default function Consignment() {
  const { vehicles, loadVehicles } = useVehicleStore()
  const { customers, loadCustomers } = useCustomerStore()
  const { consignments, loadConsignments, createConsignment, updateConsignment } = useConsignmentStore()

  const [vehicleId, setVehicleId] = useState('')
  const [ownerId, setOwnerId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [period, setPeriod] = useState<ConsignmentPeriod>('30')
  const [targetPrice, setTargetPrice] = useState('')
  const [listingPrice, setListingPrice] = useState('')
  const [status, setStatus] = useState<ConsignmentStatus>('active')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadVehicles()
    loadCustomers()
    loadConsignments()
  }, [loadVehicles, loadCustomers, loadConsignments])

  const expiryDate = useMemo(() => {
    if (!startDate) return ''
    const start = new Date(startDate)
    start.setDate(start.getDate() + Number(period))
    return start.toISOString().slice(0, 10)
  }, [startDate, period])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicleId || !ownerId || !targetPrice || !listingPrice) return
    const now = new Date().toISOString()
    const consignment: Consignment = {
      id: generateId('cons'),
      vehicleId,
      ownerId,
      startDate,
      expiryDate,
      period,
      targetPrice: Number(targetPrice),
      listingPrice: Number(listingPrice),
      status,
      notes,
      createdAt: now,
      updatedAt: now,
    }
    await createConsignment(consignment)
    setVehicleId('')
    setOwnerId('')
    setStartDate('')
    setPeriod('30')
    setTargetPrice('')
    setListingPrice('')
    setNotes('')
    setStatus('active')
  }

  const handleStatusChange = async (consignmentId: string, newStatus: ConsignmentStatus) => {
    const consignment = consignments.find((c) => c.id === consignmentId)
    if (!consignment) return
    await updateConsignment({ ...consignment, status: newStatus, updatedAt: new Date().toISOString() })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Consignment</h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {consignments.length} agreement(s)
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">New Consignment Agreement</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" required>
              <option value="">Select vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.year} {vehicle.make} {vehicle.model} — {vehicle.stockNumber || vehicle.vin}
                </option>
              ))}
            </select>

            <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" required>
              <option value="">Select owner</option>
              {customers.filter((c) => c.role === 'owner' || c.role === 'other').map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                <select value={period} onChange={(e) => setPeriod(e.target.value as ConsignmentPeriod)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5">
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Price</label>
                <input type="number" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Listing Price</label>
                <input type="number" value={listingPrice} onChange={(e) => setListingPrice(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select value={status} onChange={(e) => setStatus(e.target.value as ConsignmentStatus)} className="border border-gray-300 rounded-xl px-4 py-2.5">
                <option value="active">Active</option>
                <option value="expiring">Expiring</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input type="date" value={expiryDate} readOnly className="w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-gray-50" />
              </div>
            </div>

            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="w-full border border-gray-300 rounded-xl px-4 py-2.5" rows={2} />

            <button type="submit" className="w-full bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700">
              Create Consignment
            </button>
          </form>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Consignment Agreements</h2>
          {consignments.length === 0 ? (
            <p className="text-gray-500 text-sm">No consignment agreements yet.</p>
          ) : (
            <div className="space-y-3">
              {consignments.map((consignment) => {
                const vehicle = vehicles.find((v) => v.id === consignment.vehicleId)
                const owner = customers.find((c) => c.id === consignment.ownerId)
                return (
                  <div key={consignment.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-800">
                          {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown vehicle'}
                        </p>
                        <p className="text-sm text-gray-600">Owner: {owner?.name || 'Unknown'}</p>
                      </div>
                      <select
                        value={consignment.status}
                        onChange={(e) => handleStatusChange(consignment.id, e.target.value as ConsignmentStatus)}
                        className="text-xs border border-gray-300 rounded-lg px-2 py-1"
                      >
                        <option value="active">Active</option>
                        <option value="expiring">Expiring</option>
                        <option value="expired">Expired</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Target: R {consignment.targetPrice.toLocaleString()} • Listing: R {consignment.listingPrice.toLocaleString()}</p>
                      <p>Expiry: {consignment.expiryDate || '—'}</p>
                      {consignment.notes && <p className="italic text-xs mt-1">{consignment.notes}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
