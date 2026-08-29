import { useEffect, useMemo, useState } from 'react'
import { useVehicleStore } from '../store/useVehicleStore'
import { useCustomerStore } from '../store/useCustomerStore'
import { useSaleStore } from '../store/useSaleStore'
import { generateId } from '../utils/id'
import type { Sale, SaleStatus, PaymentStatus, Payment, Vehicle } from '../types'

export default function Sales() {
  const { vehicles, loadVehicles, updateVehicle } = useVehicleStore()
  const { customers, loadCustomers } = useCustomerStore()
  const { sales, payments, loadSales, loadPayments, createSale, createPayment, updateSale } = useSaleStore()

  const [vehicleId, setVehicleId] = useState('')
  const [buyerId, setBuyerId] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [deposit, setDeposit] = useState('')
  const [status, setStatus] = useState<SaleStatus>('reserved')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending')
  const [notes, setNotes] = useState('')
  const [activeSaleId, setActiveSaleId] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')

  useEffect(() => {
    loadVehicles()
    loadCustomers()
    loadSales()
    loadPayments()
  }, [loadVehicles, loadCustomers, loadSales, loadPayments])

  const availableVehicles = useMemo(() => vehicles.filter((v) => v.status !== 'sold'), [vehicles])

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId)
  const selectedSale = sales.find((s) => s.id === activeSaleId)
  const salePayments = useMemo(() => payments.filter((p) => p.saleId === activeSaleId), [payments, activeSaleId])

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicleId || !buyerId || !salePrice) return

    const now = new Date().toISOString()
    const sale: Sale = {
      id: generateId('sale'),
      vehicleId,
      buyerId,
      status,
      salePrice: Number(salePrice),
      deposit: deposit ? Number(deposit) : undefined,
      paymentStatus,
      dateReserved: now,
      notes,
      createdAt: now,
      updatedAt: now,
    }

    await createSale(sale)

    // Update vehicle status to reserved
    if (selectedVehicle) {
      const updatedVehicle: Vehicle = {
        ...selectedVehicle,
        status: 'reserved',
        updatedAt: now,
      }
      await updateVehicle(updatedVehicle)
    }

    setActiveSaleId(sale.id)
    setVehicleId('')
    setBuyerId('')
    setSalePrice('')
    setDeposit('')
    setNotes('')
    setStatus('reserved')
    setPaymentStatus('pending')
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeSaleId || !paymentAmount) return

    const payment: Payment = {
      id: generateId('pay'),
      saleId: activeSaleId,
      amount: Number(paymentAmount),
      method: paymentMethod,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await createPayment(payment)
    setPaymentAmount('')
  }

  const completeSale = async () => {
    if (!selectedSale) return
    const updatedSale: Sale = {
      ...selectedSale,
      status: 'completed',
      paymentStatus: 'paid',
      dateCompleted: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await updateSale(updatedSale)

    const vehicle = vehicles.find((v) => v.id === selectedSale.vehicleId)
    if (vehicle) {
      const updatedVehicle: Vehicle = {
        ...vehicle,
        status: 'sold',
        updatedAt: new Date().toISOString(),
      }
      await updateVehicle(updatedVehicle)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {sales.length} sale(s)
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Sale */}
        <div className="card p-5">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Create Sale</h2>
          <form onSubmit={handleCreateSale} className="space-y-4">
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
              required
            >
              <option value="">Select vehicle</option>
              {availableVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.year} {vehicle.make} {vehicle.model} — {vehicle.stockNumber || vehicle.vin}
                </option>
              ))}
            </select>

            <select
              value={buyerId}
              onChange={(e) => setBuyerId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
              required
            >
              <option value="">Select buyer</option>
              {customers.filter((c) => c.role === 'buyer' || c.role === 'other').map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price</label>
                <input
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deposit</label>
                <input
                  type="number"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select value={status} onChange={(e) => setStatus(e.target.value as SaleStatus)} className="border border-gray-300 rounded-xl px-4 py-2.5">
                <option value="reserved">Reserved</option>
                <option value="in_progress">In Progress</option>
                <option value="agreed">Agreed</option>
              </select>
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)} className="border border-gray-300 rounded-xl px-4 py-2.5">
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
              rows={2}
            />

            <button type="submit" className="w-full bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700">
              Create Sale
            </button>
          </form>
        </div>

        {/* Sale details + payments */}
        <div className="card p-5">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Sale Details</h2>
          {!selectedSale ? (
            <p className="text-gray-500 text-sm">Select or create a sale to manage payments.</p>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-800">Vehicle</span>
                  <span className="text-gray-600 text-sm truncate">
                    {vehicles.find((v) => v.id === selectedSale.vehicleId)?.model || '—'}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="font-medium text-gray-800">Buyer</span>
                  <span className="text-gray-600 text-sm">
                    {customers.find((c) => c.id === selectedSale.buyerId)?.name || '—'}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="font-medium text-gray-800">Sale Price</span>
                  <span className="text-gray-600 text-sm">R {selectedSale.salePrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="font-medium text-gray-800">Status</span>
                  <span className="text-gray-600 text-sm capitalize">{selectedSale.status.replace('_', ' ')}</span>
                </div>
              </div>

              <form onSubmit={handleAddPayment} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Payment Amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="border border-gray-300 rounded-xl px-4 py-2.5"
                    required
                  />
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5">
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="eft">EFT</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700">
                  Add Payment
                </button>
              </form>

              <div className="space-y-2">
                <p className="font-medium text-gray-700">Payments ({salePayments.length})</p>
                {salePayments.length === 0 ? (
                  <p className="text-gray-500 text-sm">No payments recorded.</p>
                ) : (
                  salePayments.map((payment) => (
                    <div key={payment.id} className="flex justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                      <span className="capitalize">{payment.method}</span>
                      <span className="font-semibold">R {payment.amount.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>

              {selectedSale.status !== 'completed' && (
                <button onClick={completeSale} className="w-full bg-red-600 text-white px-5 py-3 rounded-xl hover:bg-red-700">
                  Complete Sale
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
