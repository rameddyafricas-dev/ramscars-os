import { useEffect, useMemo, useState } from 'react'
import { useVehicleStore } from '../store/useVehicleStore'
import { useInspectionStore } from '../store/useInspectionStore'
import { useSaleStore } from '../store/useSaleStore'
import { useToastStore } from '../store/useToastStore'
import ConfirmDialog from '../components/ConfirmDialog'
import DocumentPreviewModal from '../components/DocumentPreviewModal'
import { useDealershipStore } from '../store/useDealershipStore'
import type { Vehicle, Inspection, Sale } from '../types'

interface LedgerRow {
  vehicle: Vehicle
  inspection?: Inspection
  sale?: Sale
  ownerTarget: number
  sellingPrice: number
  additionalCosts: number
  markup: number
  paid: boolean
}

export default function OwnerPayouts() {
  const { vehicles, loadVehicles, updateVehicle } = useVehicleStore()
  const { inspections, loadInspections } = useInspectionStore()
  const { sales, loadSales } = useSaleStore()
  const { show: showToast } = useToastStore()
  const { profile, loadProfile } = useDealershipStore()

  const [filter, setFilter] = useState<'all' | 'due' | 'paid'>('due')
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutDate, setPayoutDate] = useState('')
  const [payoutRef, setPayoutRef] = useState('')
  const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null)
  const [receiptHtml, setReceiptHtml] = useState<string | null>(null)
  const [receiptTitle, setReceiptTitle] = useState('')

  useEffect(() => {
    loadVehicles()
    loadInspections()
    loadSales()
    loadProfile()
  }, [loadVehicles, loadInspections, loadSales, loadProfile])

  const ledger = useMemo<LedgerRow[]>(() => {
    return vehicles.map(vehicle => {
      const inspection = inspections.find(i => i.id === vehicle.inspectionId)
      const sale = sales
        .filter(s => s.vehicleId === vehicle.id && s.status !== 'cancelled')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

      const ownerTarget = inspection?.financial.purchasePrice ?? vehicle.ownerPayoutAmount ?? 0
      const sellingPrice = sale?.salePrice ?? vehicle.listingPrice ?? inspection?.financial.sellingPrice ?? 0
      const additionalCosts = (inspection?.financial.additionalCosts || [])
        .reduce((sum, c) => sum + (c.amount || 0), 0)
      const markup = sellingPrice - ownerTarget - additionalCosts
      const paid = !!vehicle.ownerPayoutPaid

      return { vehicle, inspection, sale, ownerTarget, sellingPrice, additionalCosts, markup, paid }
    })
  }, [vehicles, inspections, sales])

  const filtered = useMemo(() => {
    if (filter === 'all') return ledger
    if (filter === 'paid') return ledger.filter(r => r.paid)
    return ledger.filter(r => !r.paid && r.sellingPrice > 0)
  }, [ledger, filter])

  const totals = useMemo(() => {
    const unpaid = ledger.filter(r => !r.paid)
    const totalOwed = unpaid.reduce((sum, r) => sum + r.ownerTarget, 0)
    const totalMarkup = ledger.filter(r => r.paid).reduce((sum, r) => sum + r.markup, 0)
    const totalPendingMarkup = unpaid.reduce((sum, r) => sum + r.markup, 0)
    return { totalOwed, totalMarkup, totalPendingMarkup }
  }, [ledger])

  const generateReceipt = (row: LedgerRow) => {
    const owner = row.inspection?.ownerInfo
    const vehicleInfo = row.inspection?.vehicleInfo
    const paidDate = row.vehicle.ownerPayoutDate || new Date().toISOString().slice(0, 10)
    const paidAmount = row.vehicle.ownerPayoutAmount ?? row.ownerTarget
    const reference = row.vehicle.ownerPayoutReference || '—'

    const html = `
      <html>
        <head>
          <title>Owner Payout Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 2rem; color: #1f2937; }
            h1 { color: #4f46e5; text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
            h2 { color: #4b5563; font-size: 1rem; margin-top: 1.5rem; }
            .section { margin-bottom: 1rem; }
            .label { font-weight: bold; color: #4b5563; }
            .receipt-box { background: #f3f4f6; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
            .amount { font-size: 1.5rem; font-weight: bold; color: #10b981; text-align: center; }
            .footer { margin-top: 2rem; text-align: center; font-size: 0.85rem; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 1rem; }
            .sig { display: flex; justify-content: space-between; margin-top: 3rem; }
            .sig-line { border-top: 1px solid #4b5563; width: 45%; padding-top: 0.25rem; text-align: center; font-size: 0.85rem; }
          </style>
        </head>
        <body>
          <h1>${profile?.name || 'RAMSCARS DEALERSHIP'}</h1>
          <h2 style="text-align:center;color:#4f46e5;">OWNER PAYOUT RECEIPT</h2>

          <div class="receipt-box">
            <p style="text-align:center;margin:0;font-size:0.9rem;color:#6b7280;">Amount Paid to Owner</p>
            <p class="amount">R ${paidAmount.toLocaleString()}</p>
            <p style="text-align:center;margin:0;font-size:0.85rem;color:#6b7280;">Paid on ${paidDate}</p>
          </div>

          <div class="section">
            <h2>Owner Details</h2>
            <p><span class="label">Name:</span> ${owner?.name || '—'}</p>
            <p><span class="label">ID Number:</span> ${owner?.idNumber || '—'}</p>
            <p><span class="label">Contact:</span> ${owner?.contactNumber || '—'}</p>
            <p><span class="label">Address:</span> ${owner?.physicalAddress || '—'}</p>
          </div>

          <div class="section">
            <h2>Vehicle Details</h2>
            <p><span class="label">Vehicle:</span> ${row.vehicle.year} ${row.vehicle.make} ${row.vehicle.model}</p>
            <p><span class="label">VIN:</span> ${row.vehicle.vin || vehicleInfo?.vin || '—'}</p>
            <p><span class="label">Stock Number:</span> ${row.vehicle.stockNumber || '—'}</p>
            <p><span class="label">Sale Price:</span> R ${row.sellingPrice.toLocaleString()}</p>
            <p><span class="label">Additional Costs:</span> R ${row.additionalCosts.toLocaleString()}</p>
            <p><span class="label">Agreed Owner Payout:</span> R ${row.ownerTarget.toLocaleString()}</p>
          </div>

          <div class="section">
            <h2>Payment Details</h2>
            <p><span class="label">Reference:</span> ${reference}</p>
            <p><span class="label">Date:</span> ${paidDate}</p>
          </div>

          <div class="section">
            <p>I, the undersigned owner, confirm receipt of the above amount as full and final payment from ${profile?.name || 'RamsCars Dealership'} for the sale of the vehicle described above. This receipt releases the dealership from any further claim regarding this transaction.</p>
          </div>

          <div class="sig">
            <div class="sig-line">Owner Signature</div>
            <div class="sig-line">Dealer Signature</div>
          </div>

          <div class="footer">
            ${profile?.name || 'RamsCars Dealership'} ${profile?.phone ? '| ' + profile.phone : ''} ${profile?.email ? '| ' + profile.email : ''}
          </div>
        </body>
      </html>
    `

    setReceiptTitle(`Owner Payout Receipt — ${row.vehicle.make} ${row.vehicle.model}`)
    setReceiptHtml(html)
  }

  const openPayoutModal = (row: LedgerRow) => {
    setEditingVehicle(row.vehicle)
    setPayoutAmount(String(row.ownerTarget || ''))
    setPayoutDate(new Date().toISOString().slice(0, 10))
    setPayoutRef('')
  }

  const handleConfirmPayout = async () => {
    if (!editingVehicle) return
    const amount = Number(payoutAmount)
    if (isNaN(amount) || amount <= 0) {
      showToast('Enter a valid payout amount', 'error')
      return
    }
    try {
      await updateVehicle({
        ...editingVehicle,
        ownerPayoutPaid: true,
        ownerPayoutDate: payoutDate || new Date().toISOString().slice(0, 10),
        ownerPayoutReference: payoutRef || undefined,
        ownerPayoutAmount: amount,
        updatedAt: new Date().toISOString(),
      })
      showToast('Owner payout recorded', 'success')
      setEditingVehicle(null)
    } catch (err) {
      showToast((err as Error).message || 'Failed to record payout', 'error')
    }
  }

  const handleUnmark = (row: LedgerRow) => {
    setConfirmState({
      message: 'Mark this payout as not paid?',
      onConfirm: async () => {
        await updateVehicle({
          ...row.vehicle,
          ownerPayoutPaid: false,
          ownerPayoutDate: undefined,
          ownerPayoutReference: undefined,
          updatedAt: new Date().toISOString(),
        })
        showToast('Payout status reset')
      },
    })
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Owner Payout Ledger</h1>
        <div className="flex gap-2">
          <button onClick={() => setFilter('due')} className={`px-3 py-1.5 rounded-lg text-sm ${filter === 'due' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'}`}>Due</button>
          <button onClick={() => setFilter('paid')} className={`px-3 py-1.5 rounded-lg text-sm ${filter === 'paid' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'}`}>Paid</button>
          <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm ${filter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'}`}>All</button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-gray-500">Total Owed to Owners</p>
          <p className="text-xl font-bold text-red-600">R {totals.totalOwed.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">RamsCars Markup (Paid Deals)</p>
          <p className="text-xl font-bold text-green-600">R {totals.totalMarkup.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Pending Markup (Open Deals)</p>
          <p className="text-xl font-bold text-amber-600">R {totals.totalPendingMarkup.toLocaleString()}</p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <p className="text-lg font-medium mb-2">No payouts {filter === 'paid' ? 'recorded' : 'due'}</p>
          <p className="text-sm">Deals will appear here once a sale price is set.</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {filtered.map(row => (
            <div key={row.vehicle.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-800">
                  {row.vehicle.year} {row.vehicle.make} {row.vehicle.model}
                </p>
                <p className="text-xs text-gray-500">
                  Stock: {row.vehicle.stockNumber || '—'}
                  {row.sale && ` · Sale: R ${row.sale.salePrice.toLocaleString()} (${row.sale.status.replace('_', ' ')})`}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                    Owner: R {row.ownerTarget.toLocaleString()}
                  </span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                    Costs: R {row.additionalCosts.toLocaleString()}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full ${row.markup >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    Markup: R {row.markup.toLocaleString()}
                  </span>
                  {row.paid && row.vehicle.ownerPayoutDate && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      Paid {row.vehicle.ownerPayoutDate}
                      {row.vehicle.ownerPayoutReference ? ` · ${row.vehicle.ownerPayoutReference}` : ''}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {!row.paid ? (
                  <button
                    onClick={() => openPayoutModal(row)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-indigo-700"
                  >
                    Record Payout
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => generateReceipt(row)}
                      className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-sm hover:bg-indigo-200"
                    >
                      Print Receipt
                    </button>
                    <button
                      onClick={() => handleUnmark(row)}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm hover:bg-gray-200"
                    >
                      Mark Unpaid
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payout modal */}
      {editingVehicle && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4" onClick={() => setEditingVehicle(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Record Owner Payout</h2>
            <p className="text-sm text-gray-600 mb-4">
              {editingVehicle.year} {editingVehicle.make} {editingVehicle.model}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payout Amount (R)</label>
                <input
                  type="number"
                  min="0"
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payout Date</label>
                <input
                  type="date"
                  value={payoutDate}
                  onChange={e => setPayoutDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. EFT ref, receipt number"
                  value={payoutRef}
                  onChange={e => setPayoutRef(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={handleConfirmPayout} className="flex-1 bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700">Confirm Payout</button>
              <button onClick={() => setEditingVehicle(null)} className="flex-1 bg-gray-200 text-gray-800 px-5 py-3 rounded-xl hover:bg-gray-300">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {confirmState && (
        <ConfirmDialog
          open={confirmState !== null}
          title="Confirm"
          message={confirmState.message}
          onConfirm={() => { confirmState.onConfirm(); setConfirmState(null) }}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {receiptHtml && (
        <DocumentPreviewModal
          type="html"
          html={receiptHtml}
          title={receiptTitle}
          onClose={() => setReceiptHtml(null)}
        />
      )}
    </div>
  )
}
