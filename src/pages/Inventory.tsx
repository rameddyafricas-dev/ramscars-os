import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVehicleStore } from '../store/useVehicleStore'
import { useInspectionStore } from '../store/useInspectionStore'

export default function Inventory() {
  const { vehicles, loadVehicles, isLoading } = useVehicleStore()
  const { loadInspections, setActiveInspection } = useInspectionStore()
  const navigate = useNavigate()

  useEffect(() => {
    loadVehicles()
  }, [])

  const handleEdit = async (inspectionId?: string) => {
    if (!inspectionId) return
    await loadInspections()
    setActiveInspection(inspectionId)
    navigate('/inspection')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Inventory</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : vehicles.length === 0 ? (
        <div className="card p-4">
          <p className="text-gray-600">No vehicles in inventory yet</p>
          <p className="text-gray-600 mt-2">Vehicles from inspections will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="card overflow-hidden">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                {vehicle.photos && vehicle.photos.length > 0 ? (
                  <img
                    src={vehicle.photos[0]}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500">No photo</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h3>
                <p className="text-sm text-gray-600">VIN: {vehicle.vin || '-'}</p>
                <p className="text-sm text-gray-600">Mileage: {vehicle.mileage.toLocaleString()} km</p>
                {vehicle.listingPrice !== undefined && (
                  <p className="text-sm font-medium text-green-700">
                    Price: R {vehicle.listingPrice.toLocaleString()}
                  </p>
                )}
                <p className="text-sm text-gray-600">Stock: {vehicle.stockNumber || '-'}</p>
                <p className="text-sm text-gray-600">Status: {vehicle.status}</p>
                <button
                  onClick={() => handleEdit(vehicle.inspectionId)}
                  className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
