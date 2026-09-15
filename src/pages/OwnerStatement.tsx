import { useEffect, useMemo, useState } from 'react'
import { useVehicleStore } from '../store/useVehicleStore'
import { useInspectionStore } from '../store/useInspectionStore'
import { useSaleStore } from '../store/useSaleStore'
import { useDealershipStore } from '../store/useDealershipStore'
import DocumentPreviewModal from '../components/DocumentPreviewModal'

interface OwnerVehicleRow {
  vehicleId: string
  label: string
  stockNumber: string
  sellingPrice: number
  ownerTarget: number
  additionalCosts: number
  markup: number
  paid: boolean
  payoutDate?: string
  saleStatus?: string
}

interface OwnerGroup {
  ownerKey: string
  name: string
  contact: string
  email: string
  idNumber: string
  address: string
  vehicles: OwnerVehicleRow[]
  totalSales: number
  totalPayout: number
  totalMarkup: number
  totalCosts: number
}

export default function OwnerStatement() {
  const { vehicles, loadVehicles } = useVehicleStore()
  const { inspections, loadInspections } = useInspectionStore()
  const { sales, loadSales } = useSaleStore()
  const { profile, loadProfile } = useDealershipStore()

  const [search, setSearch] = useState('')
  const [selectedOwnerKey, setSelectedOwnerKey] = useState<string | null>(null)
  const [statementHtml, setStatementHtml] = useState<string | null>(null)
  const [statementTitle, setStatementTitle] = useState('')

  useEffect(() => {
    loadVehicles()
    loadInspections()
    loadSales()
    loadProfile()
  }, [loadVehicles, loadInspections, loadSales, loadProfile])

  const owners = useMemo<OwnerGroup[]>(() => {
    const map = new Map<string, OwnerGroup>()

    for (const vehicle of vehicles) {
      const inspection = inspections.find(i => i.id === vehicle.inspectionId)
      const owner = inspection?.ownerInfo
      if (!owner || !owner.name) continue

      const key = (owner.idNumber && owner.idNumber.trim()) || owner.name.trim().toLowerCase()
      const sale = sales
        .filter(s => s.vehicleId === vehicle.id && s.status !== 'cancelled')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

      const ownerTarget = inspection?.financial.purchasePrice ?? vehicle.ownerPayoutAmount ?? 0
      const sellingPrice = sale?.salePrice ?? vehicle.listingPrice ?? inspection?.financial.sellingPrice ?? 0
      const additionalCosts = (inspection?.financial.additionalCosts || [])
        .reduce((sum, c) => sum + (c.amount || 0), 0)
      const markup = sellingPrice - ownerTarget - additionalCosts

      const row: OwnerVehicleRow = {
        vehicleId: vehicle.id,
        label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        stockNumber: vehicle.stockNumber || '—',
        sellingPrice,
        ownerTarget,
        additionalCosts,
        markup,
        paid: !!vehicle.ownerPayoutPaid,
        payoutDate: vehicle.ownerPayoutDate,
        saleStatus: sale?.status,
      }

      if (!map.has(key)) {
        map.set(key, {
          ownerKey: key,
          name: owner.name,
          contact: owner.contactNumber || '',
          email: owner.email || '',
          idNumber: owner.idNumber || '',
          address: owner.physicalAddress || '',
          vehicles: [],
          totalSales: 0,
          totalPayout: 0,
          totalMarkup: 0,
          totalCosts: 0,
        })
      }

      const group = map.get(key)!
      group.vehicles.push(row)
      group.totalSales += sellingPrice
      group.totalCosts += additionalCosts
      group.totalMarkup += markup
      if (row.paid) group.totalPayout += row.ownerTarget
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [vehicles, inspections, sales])

  const filteredOwners = useMemo(() => {
    if (!search.trim()) return owners
    const q = search.toLowerCase()
    return owners.filter(o =>
      `${o.name} ${o.contact} ${o.email} ${o.idNumber}`.toLowerCase().includes(q)
    )
  }, [owners, search])

  const selectedOwner = selectedOwnerKey
    ? owners.find(o => o.ownerKey === selectedOwnerKey) || null
    : null

  const generateStatement = (owner: OwnerGroup) => {
    const today = new Date().toISOString().slice(0, 10)

    const rows = owner.vehicles.map(v => `
      <tr>
        <td>${v.stockNumber}</td>
        <td>${v.label}</td>
        <td>R ${v.sellingPrice.toLocaleString()}</td>
        <td>R ${v.ownerTarget.toLocaleString()}</td>
        <td>R ${v.additionalCosts.toLocaleString()}</td>
        <td>${v.paid ? `✅ Paid ${v.payoutDate || ''}` : '⏳ Pending'}</td>
      </tr>
    `).join('')

    const html = `
      <html>
        <head>
          <title>Owner Statement</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 2rem; color: #1f2937; }
            h1 { color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
            h2 { color: #4b5563; font-size: 1rem; margin-top: 1.5rem; }
            .section { margin-bottom: 1rem; }
            .label { font-weight: bold; color: #4b5563; }
            table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; font-size: 0.9rem; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background: #f3f4f6; }
            .summary { background: #eef2ff; padding: 12px; border-radius: 8px; margin-top: 1rem; }
            .summary p { margin: 4px 0; }
          </style>
        </head>
        <body>
          <h1>${profile?.name || 'RAMSCARS DEALERSHIP'}</h1>
          <h2 style="color:#4f46e5;">OWNER STATEMENT</h2>
          <p style="font-size:0.85rem;color:#6b7280;">Statement Date: ${today}</p>

          <div class="section">
            <h2>Owner Details</h2>
            <p><span class="label">Name:</span> ${owner.name}</p>
            <p><span class="label">ID Number:</span> ${owner.idNumber || '—'}</p>
            <p><span class="label">Contact:</span> ${owner.contact || '—'}</p>
            <p><span class="label">Email:</span> ${owner.email || '—'}</p>
            <p><span class="label">Address:</span> ${owner.address || '—'}</p>
          </div>

          <div class="section">
            <h2>Consigned Vehicles</h2>
            <table>
              <thead>
                <tr>
                  <th>Stock</th>
                  <th>Vehicle</th>
                  <th>Sale Price</th>
                  <th>Owner Payout</th>
                  <th>Costs</th>
                  <th>Payout Status</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>

          <div class="summary">
            <p><span class="label">Total Sale Value:</span> R ${owner.totalSales.toLocaleString()}</p>
            <p><span class="label">Total Paid to Owner:</span> R ${owner.totalPayout.toLocaleString()}</p>
            <p><span class="label">Total Additional Costs:</span> R ${owner.totalCosts.toLocaleString()}</p>
          </div>

          <p style="margin-top:2rem;font-size:0.85rem;color:#6b7280;">
            This statement reflects transactions recorded in the RamsCars Operating System as of ${today}.
            For any queries, contact ${profile?.name || 'RamsCars Dealership'}${profile?.phone ? ' at ' + profile.phone : ''}.
          </p>
        </body>
      </html>
    `

    setStatementTitle(`Owner Statement — ${owner.name}`)
    setStatementHtml(html)
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Owner Statements</h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {owners.length} owner(s)
        </span>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search owners by name, ID, phone, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2.5 md:w-96"
        />
      </div>

      {filteredOwners.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <p className="text-lg font-medium mb-2">No owners found</p>
          <p className="text-sm">Owners appear here once you have inspections with owner details.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOwners.map(owner => (
            <div key={owner.ownerKey} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{owner.name}</p>
                  <p className="text-xs text-gray-500 truncate">{owner.contact || owner.email || '—'}</p>
                </div>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  {owner.vehicles.length} vehicle(s)
                </span>
              </div>

              <div className="mt-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Sale Value</span>
                  <span className="font-medium">R {owner.totalSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid to Owner</span>
                  <span className="font-medium text-green-700">R {owner.totalPayout.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">RamsCars Markup</span>
                  <span className="font-medium text-purple-700">R {owner.totalMarkup.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setSelectedOwnerKey(owner.ownerKey)}
                  className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-xl text-xs font-medium hover:bg-gray-200"
                >
                  View Details
                </button>
                <button
                  onClick={() => generateStatement(owner)}
                  className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-xl text-xs font-medium hover:bg-indigo-700"
                >
                  Generate Statement
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Owner Details Modal */}
      {selectedOwner && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4" onClick={() => setSelectedOwnerKey(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedOwner.name}</h2>
                <p className="text-sm text-gray-500">
                  {selectedOwner.contact} {selectedOwner.email && `· ${selectedOwner.email}`}
                </p>
                {selectedOwner.idNumber && <p className="text-xs text-gray-500">ID: {selectedOwner.idNumber}</p>}
              </div>
              <button onClick={() => setSelectedOwnerKey(null)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left">Stock</th>
                    <th className="border border-gray-200 px-3 py-2 text-left">Vehicle</th>
                    <th className="border border-gray-200 px-3 py-2 text-right">Sale</th>
                    <th className="border border-gray-200 px-3 py-2 text-right">Owner</th>
                    <th className="border border-gray-200 px-3 py-2 text-right">Costs</th>
                    <th className="border border-gray-200 px-3 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOwner.vehicles.map(v => (
                    <tr key={v.vehicleId}>
                      <td className="border border-gray-200 px-3 py-2">{v.stockNumber}</td>
                      <td className="border border-gray-200 px-3 py-2">{v.label}</td>
                      <td className="border border-gray-200 px-3 py-2 text-right">R {v.sellingPrice.toLocaleString()}</td>
                      <td className="border border-gray-200 px-3 py-2 text-right">R {v.ownerTarget.toLocaleString()}</td>
                      <td className="border border-gray-200 px-3 py-2 text-right">R {v.additionalCosts.toLocaleString()}</td>
                      <td className="border border-gray-200 px-3 py-2 text-center">
                        {v.paid ? <span className="text-green-700">Paid</span> : <span className="text-amber-700">Pending</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 bg-indigo-50 rounded-xl p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Sales</span>
                <span className="font-semibold">R {selectedOwner.totalSales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Paid to Owner</span>
                <span className="font-semibold text-green-700">R {selectedOwner.totalPayout.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">RamsCars Markup</span>
                <span className="font-semibold text-purple-700">R {selectedOwner.totalMarkup.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => generateStatement(selectedOwner)}
                className="flex-1 bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700"
              >
                Generate Statement
              </button>
              <button
                onClick={() => setSelectedOwnerKey(null)}
                className="flex-1 bg-gray-200 text-gray-800 px-5 py-3 rounded-xl hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {statementHtml && (
        <DocumentPreviewModal
          type="html"
          html={statementHtml}
          title={statementTitle}
          onClose={() => setStatementHtml(null)}
        />
      )}
    </div>
  )
}
