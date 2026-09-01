import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useVehicleStore } from '../store/useVehicleStore'
import { useInspectionStore } from '../store/useInspectionStore'
import { useDealershipStore } from '../store/useDealershipStore'
import DocumentPreviewModal from '../components/DocumentPreviewModal'

export default function Reports() {
  const { vehicles, loadVehicles } = useVehicleStore()
  const { inspections, loadInspections } = useInspectionStore()
  const { profile, loadProfile } = useDealershipStore()

  const [searchParams] = useSearchParams()
  const initialVehicleId = searchParams.get('vehicle') || ''
  const [selectedVehicleId, setSelectedVehicleId] = useState(initialVehicleId)
  const [reportHtml, setReportHtml] = useState<string | null>(null)
  const [reportTitle, setReportTitle] = useState('')

  useEffect(() => {
    loadVehicles()
    loadInspections()
    loadProfile()
  }, [loadVehicles, loadInspections, loadProfile])

  useEffect(() => {
    if (initialVehicleId) setSelectedVehicleId(initialVehicleId)
  }, [initialVehicleId])

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId)
  const selectedInspection = inspections.find(
    (i) => i.id === selectedVehicle?.inspectionId
  )

  const dealershipLocation = profile?.address || 'Dealership address not set'

  const generateReport = (type: 'internal' | 'customer') => {
    if (!selectedVehicle || !selectedInspection) return

    const location = type === 'internal'
      ? selectedInspection.location.decimal || selectedInspection.location.dms || dealershipLocation
      : dealershipLocation

    const faultsHtml = selectedInspection.faults.length > 0
      ? selectedInspection.faults.map((f) => `<p>• ${f.description}</p>`).join('')
      : '<p>No faults recorded</p>'

    const checklistHtml = selectedInspection.checklist.map((c) => `
      <tr>
        <td>${c.category}</td>
        <td>${c.label}</td>
        <td>${c.result || 'Not set'}</td>
        <td>${c.note ? `📝 ${c.note}` : '—'}</td>
      </tr>
    `).join('')

    const html = `
      <html>
        <head>
          <title>${type === 'internal' ? 'Internal' : 'Customer'} Vehicle Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 2rem; color: #1f2937; }
            h1 { color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
            .section { margin-bottom: 1.5rem; }
            .label { font-weight: bold; color: #4b5563; }
            table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background: #f3f4f6; }
            img { max-width: 180px; height: auto; margin: 0 10px 10px 0; border-radius: 8px; }
          </style>
        </head>
        <body>
          <h1>${type === 'internal' ? 'Internal' : 'Customer'} Vehicle Report</h1>
          <div class="section">
            <p><span class="label">Stock Number:</span> ${selectedInspection.vehicleInfo.stockNumber || '—'}</p>
            <p><span class="label">Vehicle:</span> ${selectedInspection.vehicleInfo.year} ${selectedInspection.vehicleInfo.make} ${selectedInspection.vehicleInfo.model}</p>
            <p><span class="label">VIN:</span> ${selectedInspection.vehicleInfo.vin || '—'}</p>
            <p><span class="label">Mileage:</span> ${selectedInspection.vehicleInfo.mileage || '—'} km</p>
            <p><span class="label">Transmission:</span> ${selectedInspection.vehicleInfo.transmission}</p>
            <p><span class="label">Fuel Type:</span> ${selectedInspection.vehicleInfo.fuelType}</p>
            <p><span class="label">Colour:</span> ${selectedInspection.vehicleInfo.color || '—'}</p>
            <p><span class="label">Location:</span> ${location}</p>
          </div>
          ${type === 'internal' ? `
            <div class="section">
              <h2>Owner Information</h2>
              <p><span class="label">Name:</span> ${selectedInspection.ownerInfo.name || '—'}</p>
              <p><span class="label">Contact:</span> ${selectedInspection.ownerInfo.contactNumber || '—'}</p>
              <p><span class="label">Email:</span> ${selectedInspection.ownerInfo.email || '—'}</p>
            </div>
            <div class="section">
              <h2>Financial Information</h2>
              <p><span class="label">Purchase Price:</span> R ${selectedInspection.financial.purchasePrice ?? 0}</p>
              <p><span class="label">Selling Price:</span> R ${selectedInspection.financial.sellingPrice ?? 0}</p>
            </div>
          ` : ''}
          <div class="section">
            <h2>Faults</h2>
            ${faultsHtml}
          </div>
          <div class="section">
            <h2>Checklist</h2>
            <table>
              <thead>
                <tr><th>Category</th><th>Item</th><th>Result</th><th>Notes</th></tr>
              </thead>
              <tbody>
                ${checklistHtml}
              </tbody>
            </table>
          </div>
          <div class="section">
            <h2>Photos</h2>
            ${selectedInspection.advertisementPhotos.map((photo) => `<img src="${photo}" />`).join('') || '<p>No photos</p>'}
          </div>
        </body>
      </html>
    `

    setReportTitle(`${type === 'internal' ? 'Internal' : 'Customer'} Vehicle Report`)
    setReportHtml(html)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Reports</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Vehicle</h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {vehicles.length === 0 ? (
              <p className="text-gray-500 text-sm">No vehicles available.</p>
            ) : (
              vehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  onClick={() => setSelectedVehicleId(vehicle.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${
                    selectedVehicleId === vehicle.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-medium text-gray-800">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                  <p className="text-xs text-gray-500">
                    Stock: {vehicle.stockNumber || '—'} • {vehicle.status}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 card p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Report Actions</h2>
          {!selectedVehicle || !selectedInspection ? (
            <p className="text-gray-500">Select a vehicle to generate a report.</p>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-medium text-gray-800">
                  {selectedInspection.vehicleInfo.year} {selectedInspection.vehicleInfo.make} {selectedInspection.vehicleInfo.model}
                </p>
                <p className="text-sm text-gray-600">
                  Stock: {selectedInspection.vehicleInfo.stockNumber || '—'}
                </p>
                {selectedInspection.notes && (
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Notes:</span> {selectedInspection.notes}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => generateReport('internal')}
                  className="flex-1 bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700"
                >
                  Generate Internal Report
                </button>
                <button
                  onClick={() => generateReport('customer')}
                  className="flex-1 bg-green-600 text-white px-5 py-3 rounded-xl hover:bg-green-700"
                >
                  Generate Customer Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {reportHtml && (
        <DocumentPreviewModal
          type="html"
          html={reportHtml}
          title={reportTitle}
          onClose={() => setReportHtml(null)}
        />
      )}
    </div>
  )
}
