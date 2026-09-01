import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVehicleStore } from '../store/useVehicleStore'
import { useInspectionStore } from '../store/useInspectionStore'
import { useSaleStore } from '../store/useSaleStore'
import { useCustomerStore } from '../store/useCustomerStore'
import { useReminderStore } from '../store/useReminderStore'
import type { Vehicle } from '../types'

type SortOption = 'newest' | 'oldest' | 'priceAsc' | 'priceDesc' | 'mileageAsc' | 'mileageDesc' | 'make'

export default function Inventory() {
  const navigate = useNavigate()
  const { vehicles, loadVehicles, updateVehicle, isLoading, error } = useVehicleStore()
  const { inspections, loadInspections } = useInspectionStore()
  const { sales, loadSales } = useSaleStore()
  const { customers, loadCustomers } = useCustomerStore()
  const { reminders, loadReminders } = useReminderStore()

  // UI state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Vehicle['status']>('all')
  const [makeFilter, setMakeFilter] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minYear, setMinYear] = useState('')
  const [maxYear, setMaxYear] = useState('')
  const [minMileage, setMinMileage] = useState('')
  const [maxMileage, setMaxMileage] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [quickViewVehicleId, setQuickViewVehicleId] = useState<string | null>(null)

  // Load all required data
  useEffect(() => {
    loadVehicles()
    loadInspections()
    loadSales()
    loadCustomers()
    loadReminders()
  }, [loadVehicles, loadInspections, loadSales, loadCustomers, loadReminders])

  // Derived data
  const makes = useMemo(() => {
    const set = new Set<string>()
    vehicles.forEach(v => { if (v.make) set.add(v.make) })
    return Array.from(set).sort()
  }, [vehicles])

  const stats = useMemo(() => {
    const total = vehicles.length
    const available = vehicles.filter(v => v.status === 'available').length
    const reserved = vehicles.filter(v => v.status === 'reserved').length
    const sold = vehicles.filter(v => v.status === 'sold').length
    const withdrawn = vehicles.filter(v => v.status === 'withdrawn').length
    const totalValue = vehicles.reduce((sum, v) => sum + (v.listingPrice || 0), 0)
    return { total, available, reserved, sold, withdrawn, totalValue }
  }, [vehicles])

  const filteredVehicles = useMemo(() => {
    let result = vehicles.filter(v => {
      const searchLower = search.toLowerCase().trim()
      const matchesSearch = searchLower === '' ||
        `${v.year} ${v.make} ${v.model} ${v.vin} ${v.stockNumber}`.toLowerCase().includes(searchLower)
      const matchesStatus = statusFilter === 'all' || v.status === statusFilter
      const matchesMake = makeFilter === 'all' || v.make === makeFilter
      const matchesPriceMin = minPrice === '' || (v.listingPrice || 0) >= Number(minPrice)
      const matchesPriceMax = maxPrice === '' || (v.listingPrice || 0) <= Number(maxPrice)
      const matchesYearMin = minYear === '' || v.year >= Number(minYear)
      const matchesYearMax = maxYear === '' || v.year <= Number(maxYear)
      const matchesMileageMin = minMileage === '' || v.mileage >= Number(minMileage)
      const matchesMileageMax = maxMileage === '' || v.mileage <= Number(maxMileage)
      return matchesSearch && matchesStatus && matchesMake &&
             matchesPriceMin && matchesPriceMax &&
             matchesYearMin && matchesYearMax &&
             matchesMileageMin && matchesMileageMax
    })

    const sorted = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'newest': return b.createdAt.localeCompare(a.createdAt)
        case 'oldest': return a.createdAt.localeCompare(b.createdAt)
        case 'priceAsc': return (a.listingPrice || 0) - (b.listingPrice || 0)
        case 'priceDesc': return (b.listingPrice || 0) - (a.listingPrice || 0)
        case 'mileageAsc': return a.mileage - b.mileage
        case 'mileageDesc': return b.mileage - a.mileage
        case 'make': return a.make.localeCompare(b.make) || a.model.localeCompare(b.model)
        default: return 0
      }
    })
    return sorted
  }, [vehicles, search, statusFilter, makeFilter, minPrice, maxPrice, minYear, maxYear, minMileage, maxMileage, sortBy])

  const getVehicleDetails = (vehicle: Vehicle) => {
    const inspection = inspections.find(i => i.id === vehicle.inspectionId)
    const sale = sales
      .filter(s => s.vehicleId === vehicle.id && s.status !== 'cancelled')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    const buyer = sale ? customers.find(c => c.id === sale.buyerId) : null
    const upcomingReminders = reminders
      .filter(r => r.vehicleId === vehicle.id && !r.completed)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    const nextReminder = upcomingReminders[0]
    const profit = inspection?.financial.estimatedProfit
    const margin = inspection?.financial.expectedMargin
    const progress = inspection?.progress || 0
    return { inspection, sale, buyer, nextReminder, profit, margin, progress }
  }


  const toggleSelected = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedIds(newSet)
  }

  const clearSelection = () => setSelectedIds(new Set())

  const bulkStatusUpdate = async (newStatus: Vehicle['status']) => {
    if (selectedIds.size === 0) return
    const updates = vehicles.filter(v => selectedIds.has(v.id)).map(v => ({
      ...v,
      status: newStatus,
      updatedAt: new Date().toISOString()
    }))
    for (const vehicle of updates) {
      await updateVehicle(vehicle)
    }
    clearSelection()
  }

  const navigateTo = (path: string) => navigate(path)

  const renderVehicleCard = (vehicle: Vehicle) => {
    const details = getVehicleDetails(vehicle)
    const isSelected = selectedIds.has(vehicle.id)
    const isSold = vehicle.status === 'sold'
    return (
      <div key={vehicle.id} className={`card overflow-hidden ${isSold ? 'opacity-70' : ''} ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}>
        <div className="relative h-48 bg-gray-100">
          {vehicle.photos && vehicle.photos.length > 0 ? (
            <img src={vehicle.photos[0]} alt={`${vehicle.make} ${vehicle.model}`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">No photo</div>
          )}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelected(vehicle.id)}
            className="absolute top-2 left-2 z-10 w-5 h-5 rounded border-gray-300"
          />
          <span className={`absolute top-2 right-2 z-10 px-3 py-1 rounded-full text-xs font-semibold ${
            vehicle.status === 'available' ? 'bg-green-100 text-green-800' :
            vehicle.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
            vehicle.status === 'sold' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {vehicle.status}
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
          <div className="mt-2 space-y-1 text-sm text-gray-600">
            <p><span className="font-medium">Stock:</span> {vehicle.stockNumber || '—'}</p>
            <p><span className="font-medium">Mileage:</span> {vehicle.mileage.toLocaleString()} km</p>
            {vehicle.listingPrice !== undefined && (
              <p className="text-green-700 font-medium">R {vehicle.listingPrice.toLocaleString()}</p>
            )}
            {details.progress > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs">Progress:</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${details.progress}%` }}></div>
                </div>
                <span className="text-xs font-semibold">{details.progress}%</span>
              </div>
            )}
            <div className="flex flex-wrap gap-1 mt-2">
              {details.sale && (
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                  Sale: {details.sale.status.replace('_', ' ')} {details.buyer ? `· ${details.buyer.name}` : ''}
                </span>
              )}
              {details.nextReminder && (
                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">
                  Reminder: {details.nextReminder.dueDate}
                </span>
              )}
              {details.profit !== null && details.profit !== undefined && (
                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs">
                  Profit: R {details.profit.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={() => setQuickViewVehicleId(vehicle.id)} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200">Quick View</button>
            <button onClick={() => navigateTo(`/inspection/view/${vehicle.inspectionId}`)} className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-100">View</button>
            <button onClick={() => navigateTo(`/inspection`)} className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-100">Edit</button>
            <button onClick={() => navigateTo(`/sales?vehicle=${vehicle.id}`)} className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-100">Sales</button>
            <button onClick={() => navigateTo(`/customers?vehicle=${vehicle.id}`)} className="bg-pink-50 text-pink-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-pink-100">Customers</button>
            <button onClick={() => navigateTo(`/reminders?vehicle=${vehicle.id}`)} className="bg-cyan-50 text-cyan-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-cyan-100">Reminders</button>
            <button onClick={() => navigateTo(`/marketing?vehicle=${vehicle.id}`)} className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-100">Listing</button>
            <button onClick={() => navigateTo(`/reports?vehicle=${vehicle.id}`)} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-100">Reports</button>
          </div>
        </div>
      </div>
    )
  }

  const renderVehicleRow = (vehicle: Vehicle) => {
    const details = getVehicleDetails(vehicle)
    const isSelected = selectedIds.has(vehicle.id)
    return (
      <div key={vehicle.id} className={`flex items-center p-3 bg-white border-b ${isSelected ? 'bg-indigo-50' : ''}`}>
        <input type="checkbox" checked={isSelected} onChange={() => toggleSelected(vehicle.id)} className="mr-3" />
        <div className="flex-1 min-w-0">
          <p className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</p>
          <p className="text-xs text-gray-500">Stock: {vehicle.stockNumber || '—'} · Mileage: {vehicle.mileage.toLocaleString()} km</p>
          {details.sale && <p className="text-xs text-blue-600">Sale: {details.sale.status.replace('_', ' ')} {details.buyer ? `· ${details.buyer.name}` : ''}</p>}
        </div>
        <div className="text-right">
          <p className="font-semibold">{vehicle.listingPrice !== undefined ? `R ${vehicle.listingPrice.toLocaleString()}` : ''}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full ${vehicle.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{vehicle.status}</span>
        </div>
        <div className="flex gap-1 ml-3">
          <button onClick={() => setQuickViewVehicleId(vehicle.id)} className="p-1 text-gray-500 hover:text-indigo-600" title="Quick View">👁️</button>
          <button onClick={() => navigateTo(`/inspection/view/${vehicle.inspectionId}`)} className="p-1 text-gray-500 hover:text-amber-600" title="View">📋</button>
          <button onClick={() => navigateTo(`/inspection`)} className="p-1 text-gray-500 hover:text-indigo-600" title="Edit">✏️</button>
          <button onClick={() => navigateTo(`/sales?vehicle=${vehicle.id}`)} className="p-1 text-gray-500 hover:text-green-600" title="Sales">💰</button>
          <button onClick={() => navigateTo(`/reminders?vehicle=${vehicle.id}`)} className="p-1 text-gray-500 hover:text-cyan-600" title="Reminders">⏰</button>
        </div>
      </div>
    )
  }

  const quickViewVehicle = quickViewVehicleId ? vehicles.find(v => v.id === quickViewVehicleId) : null
  const quickViewDetails = quickViewVehicle ? getVehicleDetails(quickViewVehicle) : null

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
        <div className="flex gap-2">
          <button onClick={() => loadVehicles()} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50">Refresh</button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card p-4 text-center"><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold">{stats.total}</p></div>
        <div className="card p-4 text-center"><p className="text-xs text-gray-500">Available</p><p className="text-xl font-bold text-green-600">{stats.available}</p></div>
        <div className="card p-4 text-center"><p className="text-xs text-gray-500">Reserved</p><p className="text-xl font-bold text-yellow-600">{stats.reserved}</p></div>
        <div className="card p-4 text-center"><p className="text-xs text-gray-500">Sold</p><p className="text-xl font-bold text-red-600">{stats.sold}</p></div>
        <div className="card p-4 text-center"><p className="text-xs text-gray-500">Total Value</p><p className="text-xl font-bold text-indigo-600">R {stats.totalValue.toLocaleString()}</p></div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Search make, model, VIN, stock..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2.5"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="border border-gray-300 rounded-xl px-4 py-2.5">
            <option value="all">All statuses</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
          <select value={makeFilter} onChange={(e) => setMakeFilter(e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5">
            <option value="all">All makes</option>
            {makes.map(make => <option key={make} value={make}>{make}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="border border-gray-300 rounded-xl px-4 py-2.5">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="priceAsc">Price (low to high)</option>
            <option value="priceDesc">Price (high to low)</option>
            <option value="mileageAsc">Mileage (low to high)</option>
            <option value="mileageDesc">Mileage (high to low)</option>
            <option value="make">Make (A-Z)</option>
          </select>
        </div>
        <div className="flex items-center justify-between mt-3">
          <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm text-indigo-600 hover:underline">
            {showAdvanced ? '− Hide advanced filters' : '+ Advanced filters'}
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode('grid')} className={`px-3 py-1 rounded-lg ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'}`}>Grid</button>
            <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-lg ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'}`}>List</button>
          </div>
        </div>
        {showAdvanced && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            <div className="flex gap-2">
              <input type="number" placeholder="Min price" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2 w-full" />
              <input type="number" placeholder="Max price" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2 w-full" />
            </div>
            <div className="flex gap-2">
              <input type="number" placeholder="Min year" value={minYear} onChange={e => setMinYear(e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2 w-full" />
              <input type="number" placeholder="Max year" value={maxYear} onChange={e => setMaxYear(e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2 w-full" />
            </div>
            <div className="flex gap-2">
              <input type="number" placeholder="Min mileage" value={minMileage} onChange={e => setMinMileage(e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2 w-full" />
              <input type="number" placeholder="Max mileage" value={maxMileage} onChange={e => setMaxMileage(e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2 w-full" />
            </div>
          </div>
        )}
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-2xl rounded-xl px-4 py-3 flex items-center gap-3 z-50 border">
          <span className="font-medium">{selectedIds.size} selected</span>
          <button onClick={() => bulkStatusUpdate('available')} className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm">Available</button>
          <button onClick={() => bulkStatusUpdate('reserved')} className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg text-sm">Reserved</button>
          <button onClick={() => bulkStatusUpdate('sold')} className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-sm">Sold</button>
          <button onClick={() => bulkStatusUpdate('withdrawn')} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm">Withdrawn</button>
          <button onClick={clearSelection} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
      )}

      {/* Vehicle display */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading inventory...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">{error}</div>
      ) : filteredVehicles.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <p className="text-lg font-medium mb-2">No vehicles found</p>
          <p className="text-sm">Adjust your search or filters, or add a new inspection.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVehicles.map(renderVehicleCard)}
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {filteredVehicles.map(renderVehicleRow)}
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewVehicle && quickViewDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setQuickViewVehicleId(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">{quickViewVehicle.year} {quickViewVehicle.make} {quickViewVehicle.model}</h2>
              <button onClick={() => setQuickViewVehicleId(null)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <p><span className="font-medium">Stock:</span> {quickViewVehicle.stockNumber || '—'}</p>
              <p><span className="font-medium">VIN:</span> {quickViewVehicle.vin || '—'}</p>
              <p><span className="font-medium">Mileage:</span> {quickViewVehicle.mileage.toLocaleString()} km</p>
              <p><span className="font-medium">Colour:</span> {quickViewVehicle.colour || '—'}</p>
              <p><span className="font-medium">Fuel:</span> {quickViewVehicle.fuelType}</p>
              <p><span className="font-medium">Transmission:</span> {quickViewVehicle.transmission}</p>
              <p><span className="font-medium">Status:</span> {quickViewVehicle.status}</p>
              <p><span className="font-medium">Price:</span> {quickViewVehicle.listingPrice !== undefined ? `R ${quickViewVehicle.listingPrice.toLocaleString()}` : '—'}</p>
            </div>
            {quickViewDetails.inspection && (
              <div className="mt-4 bg-gray-50 rounded-xl p-4">
                <h3 className="font-medium mb-2">Inspection Progress</h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${quickViewDetails.progress}%` }}></div>
                  </div>
                  <span className="font-semibold">{quickViewDetails.progress}%</span>
                </div>
                {quickViewDetails.profit !== null && quickViewDetails.profit !== undefined && (
                  <p className="mt-2">Estimated Profit: <strong>R {quickViewDetails.profit.toLocaleString()}</strong></p>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-6">
              <button onClick={() => { setQuickViewVehicleId(null); navigateTo(`/inspection/view/${quickViewVehicle.inspectionId}`) }} className="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-sm">Full View</button>
              <button onClick={() => { setQuickViewVehicleId(null); navigateTo(`/inspection`) }} className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-sm">Edit</button>
              <button onClick={() => { setQuickViewVehicleId(null); navigateTo(`/sales?vehicle=${quickViewVehicle.id}`) }} className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-sm">Sales</button>
              <button onClick={() => { setQuickViewVehicleId(null); navigateTo(`/customers?vehicle=${quickViewVehicle.id}`) }} className="bg-pink-100 text-pink-700 px-4 py-2 rounded-xl text-sm">Customers</button>
              <button onClick={() => { setQuickViewVehicleId(null); navigateTo(`/reminders?vehicle=${quickViewVehicle.id}`) }} className="bg-cyan-100 text-cyan-700 px-4 py-2 rounded-xl text-sm">Reminders</button>
              <button onClick={() => { setQuickViewVehicleId(null); navigateTo(`/marketing?vehicle=${quickViewVehicle.id}`) }} className="bg-purple-100 text-purple-700 px-4 py-2 rounded-xl text-sm">Listing</button>
              <button onClick={() => { setQuickViewVehicleId(null); navigateTo(`/reports?vehicle=${quickViewVehicle.id}`) }} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm">Reports</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
