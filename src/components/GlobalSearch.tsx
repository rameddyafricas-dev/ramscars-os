import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVehicleStore } from '../store/useVehicleStore'
import { useCustomerStore } from '../store/useCustomerStore'
import { useSaleStore } from '../store/useSaleStore'
import { useReminderStore } from '../store/useReminderStore'
import { useDocumentStore } from '../store/useDocumentStore'

interface SearchResult {
  type: string
  label: string
  sub?: string
  path: string
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const { vehicles, loadVehicles } = useVehicleStore()
  const { customers, loadCustomers } = useCustomerStore()
  const { sales, loadSales } = useSaleStore()
  const { reminders, loadReminders } = useReminderStore()
  const { documents, loadDocuments } = useDocumentStore()

  useEffect(() => {
    if (!open) return
    loadVehicles()
    loadCustomers()
    loadSales()
    loadReminders()
    loadDocuments()
  }, [open, loadVehicles, loadCustomers, loadSales, loadReminders, loadDocuments])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []

    const all: SearchResult[] = []

    vehicles.forEach(v => {
      const searchStr = `${v.year} ${v.make} ${v.model} ${v.vin} ${v.stockNumber}`.toLowerCase()
      if (searchStr.includes(q)) {
        all.push({
          type: 'Vehicle',
          label: `${v.year} ${v.make} ${v.model}`,
          sub: v.stockNumber || v.vin,
          path: v.inspectionId ? `/inspection/view/${v.inspectionId}` : '/inventory',
        })
      }
    })

    customers.forEach(c => {
      const searchStr = `${c.name} ${c.phone} ${c.email}`.toLowerCase()
      if (searchStr.includes(q)) {
        all.push({
          type: 'Customer',
          label: c.name,
          sub: c.phone || c.email,
          path: '/customers',
        })
      }
    })

    documents.forEach(d => {
      const searchStr = `${d.title} ${d.type}`.toLowerCase()
      if (searchStr.includes(q)) {
        all.push({
          type: 'Document',
          label: d.title,
          sub: d.type,
          path: '/documents',
        })
      }
    })

    reminders.forEach(r => {
      const searchStr = `${r.title} ${r.notes || ''}`.toLowerCase()
      if (searchStr.includes(q)) {
        all.push({
          type: 'Reminder',
          label: r.title,
          sub: r.dueDate,
          path: '/reminders',
        })
      }
    })

    sales.forEach(s => {
      const vehicle = vehicles.find(v => v.id === s.vehicleId)
      const buyer = customers.find(c => c.id === s.buyerId)
      const searchStr = `${vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : ''} ${buyer?.name || ''}`.toLowerCase()
      if (searchStr.includes(q)) {
        all.push({
          type: 'Sale',
          label: `${vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Sale'} - ${buyer?.name || 'Unknown buyer'}`,
          sub: `R ${s.salePrice.toLocaleString()}`,
          path: '/sales',
        })
      }
    })

    return all.slice(0, 20)
  }, [query, vehicles, customers, sales, reminders, documents])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-xl hover:bg-[var(--hover-bg)] transition-colors"
        style={{ color: 'var(--text-muted)' }}
        aria-label="Search"
        title="Search"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-[80] flex items-start justify-center pt-20 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <input
                autoFocus
                type="text"
                placeholder="Search vehicles, customers, sales, documents, reminders..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {query.trim() === '' ? (
                <p className="text-center text-gray-500 text-sm py-8">Start typing to search...</p>
              ) : results.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-8">No results found.</p>
              ) : (
                results.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      navigate(result.path)
                      setOpen(false)
                      setQuery('')
                    }}
                    className="w-full text-left p-3 rounded-xl hover:bg-gray-50 flex items-center gap-3"
                  >
                    <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full min-w-[70px] text-center">
                      {result.type}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate">{result.label}</p>
                      {result.sub && <p className="text-xs text-gray-500 truncate">{result.sub}</p>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
