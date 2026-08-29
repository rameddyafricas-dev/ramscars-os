import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVehicleStore } from '../store/useVehicleStore'
import { useInspectionStore } from '../store/useInspectionStore'
import type { Vehicle } from '../types'

export default function Inventory() {
  const { vehicles, loadVehicles, isLoading, error } = useVehicleStore()
  const { loadInspections, setActiveInspection } = useInspectionStore()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Vehicle['status']>('all')
  const [makeFilter, setMakeFilter] = useState('all')

  useEffect(() => {
    loadVehicles()
  }, [loadVehicles])

  const makes = useMemo(() => {
    const set = new Set<string>()
    vehicles.forEach((v) => {
      if (v.make) set.add(v.make)
    })
    return Array.from(set).sort()
  }, [vehicles])

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesSearch = search.trim() === '' ||
        `${v.year} ${v.make} ${v.model} ${v.vin} ${v.stockNumber}`.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || v.status === statusFilter
      const matchesMake = makeFilter === 'all' || v.make === makeFilter
      return matchesSearch && matchesStatus && matchesMake
    })
  }, [vehicles, search, statusFilter, makeFilter])

  const handleEdit = async (inspectionId?: string) => {
    if (!inspectionId) return
    await loadInspections()
    setActiveInspection(inspectionId)
    navigate('/inspection')
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
        <button
          onClick={() => loadVehicles()}
          className="self-start md:self-auto bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by make, model, VIN, stock..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-100"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="all">All statuses</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="sold">Sold</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
        <select
          value={makeFilter}
          onChange={(e) => setMakeFilter(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="all">All makes</option>
          {makes.map((make) => (
            <option key={make} value={make}>{make}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading inventory...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <p className="text-lg font-medium mb-2">No vehicles found</p>
          <p className="text-sm">Adjust your search or filters, or add a new inspection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((vehicle) => (
            <div key={vehicle.id} className="card overflow-hidden">
              <div className="h-48 bg-gray-100 flex items-center justify-center relative">
                {vehicle.photos && vehicle.photos.length > 0 ? (
                  <img
                    src={vehicle.photos[0]}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400">No photo</span>
                )}
                <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${
                  vehicle.status === 'available' ? 'bg-green-100 text-green-800' :
                  vehicle.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                  vehicle.status === 'sold' ? 'bg-red-100 text-red-800' :
                  'bg-gray-200 text-gray-800'
                }`}>
                  {vehicle.status}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h3>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">VIN:</span> {vehicle.vin || '-'}</p>
                  <p><span className="font-medium">Mileage:</span> {vehicle.mileage.toLocaleString()} km</p>
                  {vehicle.listingPrice !== undefined && (
                    <p className="text-green-700 font-medium">R {vehicle.listingPrice.toLocaleString()}</p>
                  )}
                  <p><span className="font-medium">Stock:</span> {vehicle.stockNumber || '-'}</p>
                </div>
                <button
                  onClick={() => handleEdit(vehicle.inspectionId)}
                  className="mt-4 w-full bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700"
                >
                  Edit Inspection
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
