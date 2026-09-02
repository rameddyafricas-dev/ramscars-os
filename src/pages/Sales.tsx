import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useVehicleStore } from '../store/useVehicleStore'
import { useCustomerStore } from '../store/useCustomerStore'
import { useSaleStore } from '../store/useSaleStore'
import { generateId } from '../utils/id'
import type { Sale, SaleStatus, PaymentStatus, Payment } from '../types'

type SortOption = 'newest' | 'oldest' | 'amountAsc' | 'amountDesc'

export default function Sales() {
  const { vehicles, loadVehicles, updateVehicle } = useVehicleStore()
  const { customers, loadCustomers } = useCustomerStore()
  const { sales, payments, loadSales, loadPayments, createSale, createPayment, updateSale } = useSaleStore()

  const [searchParams] = useSearchParams()
  const initialVehicleId = searchParams.get('vehicle') || ''

  // create/edit form state
  const [vehicleId, setVehicleId] = useState(initialVehicleId)
  const [buyerId, setBuyerId] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [deposit, setDeposit] = useState('')
  const [status, setStatus] = useState<SaleStatus>('reserved')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending')
  const [notes, setNotes] = useState('')
  const [activeSaleId, setActiveSaleId] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [editSaleMode, setEditSaleMode] = useState(false)

  // filters and sorting
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | SaleStatus>('all')
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentStatus>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  useEffect(() => {
    loadVehicles()
    loadCustomers()
    loadSales()
    loadPayments()
  }, [loadVehicles, loadCustomers, loadSales, loadPayments])

  useEffect(() => {
    if (initialVehicleId) setVehicleId(initialVehicleId)
  }, [initialVehicleId])

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId)
  const selectedSale = sales.find((s) => s.id === activeSaleId)
  const salePayments = useMemo(() => payments.filter((p) => p.saleId === activeSaleId), [payments, activeSaleId])

  // summary stats
  const stats = useMemo(() => {
    const totalRevenue = sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + (s.salePrice || 0), 0)
    const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const totalDeposits = sales.reduce((sum, s) => sum + (s.deposit || 0), 0)
    const outstanding = sales.filter(s => s.status !== 'completed').reduce((sum, s) => sum + (s.salePrice || 0), 0) - totalPayments
    return { totalRevenue, totalPayments, totalDeposits, outstanding: Math.max(outstanding, 0) }
  }, [sales, payments])

  // filtered and sorted sales list
  const filteredSales = useMemo(() => {
    let result = sales.filter(sale => {
      const vehicle = vehicles.find(v => v.id === sale.vehicleId)
      const buyer = customers.find(c => c.id === sale.buyerId)
      const searchLower = search.toLowerCase().trim()
      const matchesSearch = searchLower === '' ||
        `${vehicle?.year || ''} ${vehicle?.make || ''} ${vehicle?.model || ''} ${vehicle?.stockNumber || ''} ${buyer?.name || ''}`.toLowerCase().includes(searchLower)
      const matchesStatus = statusFilter === 'all' || sale.status === statusFilter
      const matchesPayment = paymentFilter === 'all' || sale.paymentStatus === paymentFilter
      return matchesSearch && matchesStatus && matchesPayment
    })
    const sorted = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'newest': return b.createdAt.localeCompare(a.createdAt)
        case 'oldest': return a.createdAt.localeCompare(b.createdAt)
        case 'amountAsc': return (a.salePrice || 0) - (b.salePrice || 0)
        case 'amountDesc': return (b.salePrice || 0) - (a.salePrice || 0)
        default: return 0
      }
    })
    return sorted
  }, [sales, vehicles, customers, search, statusFilter, paymentFilter, sortBy])

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
    if (selectedVehicle && selectedVehicle.status !== 'sold') {
      await updateVehicle({ ...selectedVehicle, status: 'reserved', updatedAt: now })
    }
    setActiveSaleId(sale.id)
    resetForm()
  }

  const resetForm = () => {
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
    const updatedSale: Sale = { ...selectedSale, status: 'completed', paymentStatus: 'paid', dateCompleted: new Date().toISOString(), updatedAt: new Date().toISOString() }
    await updateSale(updatedSale)
    const vehicle = vehicles.find(v => v.id === selectedSale.vehicleId)
    if (vehicle) await updateVehicle({ ...vehicle, status: 'sold', updatedAt: new Date().toISOString() })
  }

  const handleUpdateSale = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSale) return
    const updatedSale: Sale = { ...selectedSale, buyerId, salePrice: Number(salePrice), deposit: deposit ? Number(deposit) : undefined, status, paymentStatus, notes, updatedAt: new Date().toISOString() }
    await updateSale(updatedSale)
    setEditSaleMode(false)
  }

  const startEdit = () => {
    if (!selectedSale) return
    setBuyerId(selectedSale.buyerId)
    setSalePrice(selectedSale.salePrice.toString())
    setDeposit(selectedSale.deposit?.toString() || '')
    setStatus(selectedSale.status)
    setPaymentStatus(selectedSale.paymentStatus)
    setNotes(selectedSale.notes || '')
    setEditSaleMode(true)
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{sales.length} total sales</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4"><p className="text-xs text-gray-500">Revenue (Completed)</p><p className="text-lg font-bold text-green-600">R {stats.totalRevenue.toLocaleString()}</p></div>
        <div className="card p-4"><p className="text-xs text-gray-500">Payments Received</p><p className="text-lg font-bold text-indigo-600">R {stats.totalPayments.toLocaleString()}</p></div>
        <div className="card p-4"><p className="text-xs text-gray-500">Deposits</p><p className="text-lg font-bold text-amber-600">R {stats.totalDeposits.toLocaleString()}</p></div>
        <div className="card p-4"><p className="text-xs text-gray-500">Outstanding</p><p className="text-lg font-bold text-red-600">R {stats.outstanding.toLocaleString()}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: create / edit form */}
        <div className="card p-5">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{editSaleMode ? 'Edit Sale' : 'Create Sale'}</h2>
          <form onSubmit={editSaleMode ? handleUpdateSale : handleCreateSale} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
              <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" required>
                <option value="">Select vehicle</option>
                {vehicles.filter(v => v.status !== 'sold').map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>{vehicle.year} {vehicle.make} {vehicle.model} — {vehicle.stockNumber || vehicle.vin}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buyer</label>
              <select value={buyerId} onChange={(e) => setBuyerId(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" required>
                <option value="">Select buyer</option>
                {customers.filter(c => c.role === 'buyer' || c.role === 'other').map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price</label>
                <input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deposit</label>
                <input type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as SaleStatus)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5">
                  <option value="reserved">Reserved</option>
                  <option value="in_progress">In Progress</option>
                  <option value="agreed">Agreed</option>
                  {editSaleMode && <option value="completed">Completed</option>}
                  {editSaleMode && <option value="cancelled">Cancelled</option>}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5">
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                  {editSaleMode && <option value="refunded">Refunded</option>}
                </select>
              </div>
            </div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="w-full border border-gray-300 rounded-xl px-4 py-2.5" rows={2} />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700">
                {editSaleMode ? 'Update Sale' : 'Create Sale'}
              </button>
              {editSaleMode && <button type="button" onClick={() => setEditSaleMode(false)} className="flex-1 bg-gray-200 text-gray-800 px-5 py-3 rounded-xl hover:bg-gray-300">Cancel</button>}
            </div>
          </form>
        </div>

        {/* Right column: sales list */}
        <div className="card p-5">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Sales List</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
            <input type="text" placeholder="Search buyer/vehicle" value={search} onChange={(e) => setSearch(e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2 text-sm" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="border border-gray-300 rounded-xl px-3 py-2 text-sm">
              <option value="all">All statuses</option>
              <option value="reserved">Reserved</option>
              <option value="in_progress">In Progress</option>
              <option value="agreed">Agreed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as any)} className="border border-gray-300 rounded-xl px-3 py-2 text-sm">
              <option value="all">All payments</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div className="mb-3">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="border border-gray-300 rounded-xl px-3 py-2 text-sm">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="amountAsc">Amount (low to high)</option>
              <option value="amountDesc">Amount (high to low)</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredSales.length === 0 ? (
              <p className="text-gray-500 text-sm">No sales found.</p>
            ) : (
              filteredSales.map(sale => {
                const vehicle = vehicles.find(v => v.id === sale.vehicleId)
                const buyer = customers.find(c => c.id === sale.buyerId)
                return (
                  <button
                    key={sale.id}
                    onClick={() => { setActiveSaleId(sale.id); setEditSaleMode(false) }}
                    className={`w-full text-left p-3 rounded-xl border ${activeSaleId === sale.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown vehicle'}</span>
                      <span className="text-xs capitalize">{sale.status.replace('_', ' ')}</span>
                    </div>
                    <p className="text-sm text-gray-600">{buyer?.name || 'Unknown buyer'} • R {sale.salePrice.toLocaleString()}</p>
                  </button>
                )
              })
            )}
          </div>

          {/* Selected sale details */}
          {selectedSale && !editSaleMode && (
            <div className="mt-4 border-t pt-4 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between"><span className="font-medium">Vehicle</span><span>{vehicles.find(v => v.id === selectedSale.vehicleId)?.model || '—'}</span></div>
                <div className="flex justify-between mt-1"><span className="font-medium">Buyer</span><span>{customers.find(c => c.id === selectedSale.buyerId)?.name || '—'}</span></div>
                <div className="flex justify-between mt-1"><span className="font-medium">Price</span><span>R {selectedSale.salePrice.toLocaleString()}</span></div>
                <div className="flex justify-between mt-1"><span className="font-medium">Status</span><span className="capitalize">{selectedSale.status.replace('_', ' ')}</span></div>
                <div className="flex justify-between mt-1"><span className="font-medium">Payment</span><span className="capitalize">{selectedSale.paymentStatus.replace('_', ' ')}</span></div>
                {selectedSale.deposit && <div className="flex justify-between mt-1"><span className="font-medium">Deposit</span><span>R {selectedSale.deposit.toLocaleString()}</span></div>}
                {selectedSale.notes && <p className="text-sm text-gray-600 mt-2"><span className="font-medium">Notes:</span> {selectedSale.notes}</p>}
              </div>

              <form onSubmit={handleAddPayment} className="flex gap-2">
                <input type="number" placeholder="Payment amount" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5" required />
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2.5">
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="eft">EFT</option>
                </select>
                <button type="submit" className="bg-green-600 text-white px-4 py-2.5 rounded-xl">Add</button>
              </form>

              {salePayments.length > 0 && (
                <div className="space-y-1">
                  <p className="font-medium text-sm">Payments ({salePayments.length})</p>
                  {salePayments.map(p => (
                    <div key={p.id} className="flex justify-between bg-gray-50 rounded-lg px-3 py-1 text-sm">
                      <span className="capitalize">{p.method}</span>
                      <span>R {p.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                {selectedSale.status !== 'completed' && (
                  <button onClick={completeSale} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-xl">Complete Sale</button>
                )}
                <button onClick={startEdit} className="flex-1 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl">Edit</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
