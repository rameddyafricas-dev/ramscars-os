import { useEffect, useState } from 'react'
import { useVehicleStore } from '../store/useVehicleStore'
import { useInspectionStore } from '../store/useInspectionStore'

export default function Reports() {
  const { vehicles, loadVehicles } = useVehicleStore()
  const { inspections, loadInspections } = useInspectionStore()
  const [selectedVehicleId, setSelectedVehicleId] = useState('')

  useEffect(() => {
    loadVehicles()
    loadInspections()
  }, [])

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId)
  const selectedInspection = inspections.find(
    (i) => i.id === selectedVehicle?.inspectionId
  )

  const generateReport = (type: 'internal' | 'customer') => {
    if (!selectedVehicle || !selectedInspection) return

    const dealershipAddress = '123 Dealer Street, Johannesburg'
    const location = type === 'internal' ? selectedInspection.location : dealershipAddress

    const html = `
      <html>
        <head>
          <title>${type === 'internal' ? 'Internal' : 'Customer'} Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 2rem; }
            h1 { color: #333; }
            .section { margin-bottom: 1.5rem; }
            .label { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            img { max-width: 200px; height: auto; margin-right: 10px; }
          </style>
        </head>
        <body>
          <h1>${type === 'internal' ? 'Internal' : 'Customer'} Vehicle Report</h1>
          <div class="section">
            <p><span class="label">Stock Number:</span> ${selectedInspection.vehicleInfo.stockNumber || '-'}</p>
            <p><span class="label">Vehicle:</span> ${selectedInspection.vehicleInfo.year} ${selectedInspection.vehicleInfo.make} ${selectedInspection.vehicleInfo.model}</p>
            <p><span class="label">VIN:</span> ${selectedInspection.vehicleInfo.vin || '-'}</p>
            <p><span class="label">Mileage:</span> ${selectedInspection.vehicleInfo.mileage || '-'} km</p>
            <p><span class="label">Transmission:</span> ${selectedInspection.vehicleInfo.transmission}</p>
            <p><span class="label">Fuel Type:</span> ${selectedInspection.vehicleInfo.fuelType}</p>
            <p><span class="label">Colour:</span> ${selectedInspection.vehicleInfo.color || '-'}</p>
            <p><span class="label">Location:</span> ${typeof location === 'string' ? location : `${location.decimal || location.dms}`}</p>
          </div>
          ${
            type === 'internal'
              ? `
                <div class="section">
                  <h2>Owner Information</h2>
                  <p><span class="label">Name:</span> ${selectedInspection.ownerInfo.name || '-'}</p>
                  <p><span class="label">Contact:</span> ${selectedInspection.ownerInfo.contactNumber || '-'}</p>
                  <p><span class="label">Email:</span> ${selectedInspection.ownerInfo.email || '-'}</p>
                </div>
                <div class="section">
                  <h2>Financial Information</h2>
                  <p><span class="label">Purchase Price:</span> R ${selectedInspection.financial.purchasePrice ?? '-'}</p>
                  <p><span class="label">Selling Price:</span> R ${selectedInspection.financial.sellingPrice ?? '-'}</p>
                  <p><span class="label">Repair Cost:</span> R ${selectedInspection.financial.repairCost ?? '-'}</p>
                  <p><span class="label">Transport Cost:</span> R ${selectedInspection.financial.transportCost ?? '-'}</p>
                </div>
              `
              : ''
          }
          <div class="section">
            <h2>Faults</h2>
            ${selectedInspection.faults.length > 0 ? selectedInspection.faults.map(f => `<p>${f.description}</p>`).join('') : '<p>No faults recorded</p>'}
          </div>
          <div class="section">
            <h2>Checklist</h2>
            <table>
              <tr><th>Category</th><th>Item</th><th>Status</th></tr>
              ${selectedInspection.checklist.map(c => `<tr><td>${c.category}</td><td>${c.label}</td><td>${c.checked ? '✅' : '❌'}</td></tr>`).join('')}
            </table>
          </div>
          <div class="section">
            <h2>Photos</h2>
            ${selectedInspection.advertisementPhotos.map(photo => `<img src="${photo}" />`).join('') || '<p>No photos</p>'}
          </div>
        </body>
      </html>
    `

    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      win.print()
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Reports</h1>
      <div className="bg-white p-4 rounded shadow space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Select Vehicle</label>
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="border rounded px-3 py-2 w-full md:w-96"
          >
            <option value="">Choose vehicle...</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.year} {vehicle.make} {vehicle.model} - {vehicle.stockNumber || vehicle.vin || vehicle.id}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => generateReport('internal')}
            disabled={!selectedVehicleId}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Generate Internal Report
          </button>
          <button
            onClick={() => generateReport('customer')}
            disabled={!selectedVehicleId}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            Generate Customer Report
          </button>
        </div>
      </div>
    </div>
  )
}
