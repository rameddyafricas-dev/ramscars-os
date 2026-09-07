import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useVehicleStore } from '../store/useVehicleStore'
import { useInspectionStore } from '../store/useInspectionStore'
import { useDealershipStore } from '../store/useDealershipStore'
import { useDocumentStore } from '../store/useDocumentStore'
import { useSaleStore } from '../store/useSaleStore'
import { useCustomerStore } from '../store/useCustomerStore'
import DocumentPreviewModal from '../components/DocumentPreviewModal'
import type { InspectionScore } from '../types'

export default function Reports() {
  const { vehicles, loadVehicles } = useVehicleStore()
  const { inspections, loadInspections } = useInspectionStore()
  const { loadProfile } = useDealershipStore()
  const { documents, loadDocuments } = useDocumentStore()
  const { sales, payments, loadSales, loadPayments } = useSaleStore()
  const { customers, loadCustomers } = useCustomerStore()

  const [searchParams] = useSearchParams()
  const initialVehicleId = searchParams.get('vehicle') || ''
  const [selectedVehicleId, setSelectedVehicleId] = useState(initialVehicleId)
  const [reportHtml, setReportHtml] = useState<string | null>(null)
  const [reportTitle, setReportTitle] = useState('')

  useEffect(() => {
    loadVehicles()
    loadInspections()
    loadProfile()
    loadDocuments()
    loadSales()
    loadPayments()
    loadCustomers()
  }, [loadVehicles, loadInspections, loadProfile, loadDocuments, loadSales, loadPayments, loadCustomers])

  useEffect(() => {
    if (initialVehicleId) setSelectedVehicleId(initialVehicleId)
  }, [initialVehicleId])

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId)
  const selectedInspection = inspections.find(
    (i) => i.id === selectedVehicle?.inspectionId
  )

  const getAdvertisementPhotos = (inspection: NonNullable<typeof selectedInspection>): string[] => {
    const slotPhotos = inspection.advertisementSlots
      ? inspection.advertisementSlots.filter(s => s.photo && s.photo.trim() !== '').map(s => s.photo)
      : []
    const legacyPhotos = inspection.advertisementPhotos ? inspection.advertisementPhotos.filter(p => p) : []
    return Array.from(new Set([...slotPhotos, ...legacyPhotos]))
  }

  const getAdvertisementVideos = (inspection: NonNullable<typeof selectedInspection>): string[] => {
    if (!inspection.advertisementSlots) return []
    return inspection.advertisementSlots
      .filter(s => s.id === 'adv_video' || s.label === 'Video')
      .map(s => s.photo)
      .filter(p => p && p.trim() !== '')
  }

  const getVehicleDocuments = (vehicleId: string): typeof documents => {
    return documents.filter(d => d.vehicleId === vehicleId)
  }

  const openPrintWindow = (html: string, title: string) => {
    const win = window.open('', '_blank')
    if (win) {
      win.document.title = title
      win.document.write(html)
      win.document.close()
      win.print()
    }
  }

  const generateVehicleReport = (type: 'internal' | 'customer') => {
    if (!selectedVehicle || !selectedInspection) return

    const isInternal = type === 'internal'
    const vehicleInfo = selectedInspection.vehicleInfo

    const vehicleHtml = `
      <div class="section">
        <h2>Vehicle Information</h2>
        <p><span class="label">Vehicle:</span> ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}</p>
        <p><span class="label">Stock Number:</span> ${vehicleInfo.stockNumber || '—'}</p>
        <p><span class="label">VIN:</span> ${vehicleInfo.vin || '—'}</p>
        <p><span class="label">Vehicle Type:</span> ${vehicleInfo.vehicleType}</p>
        <p><span class="label">Body Type:</span> ${vehicleInfo.bodyType || '—'}</p>
        <p><span class="label">Year:</span> ${vehicleInfo.year}</p>
        <p><span class="label">Colour:</span> ${vehicleInfo.color || '—'}</p>
        <p><span class="label">Mileage:</span> ${vehicleInfo.mileage ? `${Number(vehicleInfo.mileage).toLocaleString()} km` : '—'}</p>
        <p><span class="label">Transmission:</span> ${vehicleInfo.transmission}</p>
        <p><span class="label">Fuel Type:</span> ${vehicleInfo.fuelType}</p>
        <p><span class="label">Registration Number:</span> ${vehicleInfo.registrationNumber || '—'}</p>
        <p><span class="label">License Expiry:</span> ${vehicleInfo.licenseExpiry || '—'}</p>
        <p><span class="label">Engine Number:</span> ${vehicleInfo.engineNumber || '—'}</p>
        <p><span class="label">Vehicle Papers:</span> ${vehicleInfo.vehiclePapers.replace('_', ' ')}</p>
        <p><span class="label">Vehicle Status:</span> ${vehicleInfo.vehicleStatus || '—'}</p>
      </div>
    `

    const ownerHtml = isInternal ? `
      <div class="section">
        <h2>Owner Information</h2>
        <p><span class="label">Name:</span> ${selectedInspection.ownerInfo.name || '—'}</p>
        <p><span class="label">Contact:</span> ${selectedInspection.ownerInfo.contactNumber || '—'}</p>
        <p><span class="label">Email:</span> ${selectedInspection.ownerInfo.email || '—'}</p>
        <p><span class="label">ID Number:</span> ${selectedInspection.ownerInfo.idNumber || '—'}</p>
        <p><span class="label">Address:</span> ${selectedInspection.ownerInfo.physicalAddress || '—'}</p>
      </div>
    ` : ''

    const locationHtml = isInternal ? `
      <div class="section">
        <h2>Location</h2>
        <p><span class="label">DMS:</span> ${selectedInspection.location.dms || '—'}</p>
        <p><span class="label">Decimal:</span> ${selectedInspection.location.decimal || '—'}</p>
        <p><span class="label">Bay:</span> ${selectedInspection.location.bay || '—'}</p>
        <p><span class="label">Pinned:</span> ${selectedInspection.location.gps ? `${selectedInspection.location.gps.lat.toFixed(6)}, ${selectedInspection.location.gps.lng.toFixed(6)}` : '—'}</p>
      </div>
    ` : ''

    const faultsHtml = selectedInspection.faults.length > 0
      ? selectedInspection.faults.map((f) => `<p>• ${f.description}</p>`).join('')
      : '<p>No faults recorded</p>'

    const checklistHtml = selectedInspection.checklist.map((c) => {
      const mediaHtml = (c.mediaIds || []).filter(m => m).map((m) => {
        if (m.startsWith('data:image')) {
          return `<img src="${m}" style="max-width:120px; margin:4px;" />`
        }
        return `<a href="${m}" target="_blank">Media</a>`
      }).join('')
      return `
        <tr>
          <td>${c.category}</td>
          <td>${c.label}</td>
          <td>${c.result || 'Not set'}</td>
          <td>${c.note ? `📝 ${c.note}` : '—'} ${mediaHtml ? `<br/>${mediaHtml}` : ''}</td>
        </tr>
      `
    }).join('')

    const scoreLabels: Record<keyof InspectionScore, string> = {
      mechanical: 'Mechanical',
      interior: 'Interior',
      exterior: 'Exterior',
      electrical: 'Electrical',
      safety: 'Safety',
      body: 'Body',
      engine: 'Engine',
      suspension: 'Suspension',
    }
    const scoreHtml = Object.entries(scoreLabels).map(([key, label]) => {
      const val = selectedInspection.score[key as keyof InspectionScore]
      return `<p><span class="label">${label}:</span> ${val !== null && val !== undefined ? `${val}%` : '—'}</p>`
    }).join('')

    const photos = getAdvertisementPhotos(selectedInspection)
    const videos = getAdvertisementVideos(selectedInspection)
    const vehicleDocuments = getVehicleDocuments(selectedVehicle.id)

    const photosHtml = photos.length > 0
      ? photos.map(photo => `<img src="${photo}" />`).join('')
      : '<p>No photos</p>'

    const videosHtml = videos.length > 0
      ? videos.map(video => `<video controls style="max-width:300px; margin:4px;" src="${video}"></video>`).join('')
      : '<p>No videos</p>'

    const documentsHtml = vehicleDocuments.length > 0
      ? vehicleDocuments.map(doc => `
          <div style="margin-bottom:8px;">
            <p><span class="label">${doc.title}</span> (${doc.type})</p>
            ${doc.fileUrl ? `<a href="${doc.fileUrl}" target="_blank">Open Document</a>` : ''}
          </div>
        `).join('')
      : '<p>No documents</p>'

    const financialHtml = `
      <div class="section">
        <h2>Financial Information</h2>
        <p><span class="label">Owner Payout / Cost Price:</span> R ${selectedInspection.financial.purchasePrice ?? '—'}</p>
        <p><span class="label">Selling Price:</span> R ${selectedInspection.financial.sellingPrice ?? '—'}</p>
        <p><span class="label">Trade Value:</span> R ${selectedInspection.financial.tradeValue ?? '—'}</p>
        <p><span class="label">Estimated Profit:</span> R ${selectedInspection.financial.estimatedProfit ?? '—'}</p>
        <p><span class="label">Expected Margin:</span> ${selectedInspection.financial.expectedMargin !== null && selectedInspection.financial.expectedMargin !== undefined ? `${selectedInspection.financial.expectedMargin.toFixed(2)}%` : '—'}</p>
        ${selectedInspection.financial.additionalCosts && selectedInspection.financial.additionalCosts.length > 0 ? `
          <p><span class="label">Additional Costs:</span></p>
          ${selectedInspection.financial.additionalCosts.map(cost => `<p>${cost.label}: R ${cost.amount.toLocaleString()}</p>`).join('')}
        ` : ''}
      </div>
    `

    const html = `
      <html>
        <head>
          <title>${isInternal ? 'Internal' : 'Customer'} Vehicle Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 2rem; color: #1f2937; }
            h1 { color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
            .section { margin-bottom: 1.5rem; }
            .label { font-weight: bold; color: #4b5563; }
            table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
            th { background: #f3f4f6; }
            img { max-width: 180px; height: auto; margin: 4px; border-radius: 8px; }
            video { max-width: 300px; margin: 4px; }
            a { color: #4f46e5; }
          </style>
        </head>
        <body>
          <h1>${isInternal ? 'Internal' : 'Customer'} Vehicle Report</h1>
          ${vehicleHtml}
          ${ownerHtml}
          ${locationHtml}
          ${isInternal ? financialHtml : ''}
          <div class="section"><h2>Faults</h2>${faultsHtml}</div>
          <div class="section"><h2>Checklist</h2><table><thead><tr><th>Category</th><th>Item</th><th>Result</th><th>Notes & Media</th></tr></thead><tbody>${checklistHtml}</tbody></table></div>
          <div class="section"><h2>Inspection Score</h2>${scoreHtml}</div>
          <div class="section"><h2>Photos</h2>${photosHtml}</div>
          <div class="section"><h2>Videos</h2>${videosHtml}</div>
          <div class="section"><h2>Documents</h2>${documentsHtml}</div>
        </body>
      </html>
    `

    setReportTitle(`${isInternal ? 'Internal' : 'Customer'} Vehicle Report`)
    setReportHtml(html)
  }

  const generateInventorySummaryReport = () => {
    const vehicleRows = vehicles.map(v => {
      const insp = inspections.find(i => i.id === v.inspectionId)
      return `<tr><td>${v.stockNumber || '—'}</td><td>${v.year} ${v.make} ${v.model}</td><td>${v.status}</td><td>${v.mileage.toLocaleString()}</td><td>${v.listingPrice !== undefined ? 'R ' + v.listingPrice.toLocaleString() : '—'}</td><td>${insp ? insp.progress + '%' : '—'}</td></tr>`
    }).join('')

    const html = `
      <html>
        <head><title>Inventory Summary Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 2rem; color: #1f2937; }
          h1 { color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
          table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
          th { background: #f3f4f6; }
        </style></head>
        <body>
          <h1>Inventory Summary Report</h1>
          <p><strong>Total Vehicles:</strong> ${vehicles.length} | <strong>Available:</strong> ${vehicles.filter(v=>v.status==='available').length} | <strong>Reserved:</strong> ${vehicles.filter(v=>v.status==='reserved').length} | <strong>Sold:</strong> ${vehicles.filter(v=>v.status==='sold').length}</p>
          <table><thead><tr><th>Stock</th><th>Vehicle</th><th>Status</th><th>Mileage</th><th>Price</th><th>Inspection</th></tr></thead><tbody>${vehicleRows}</tbody></table>
        </body>
      </html>
    `
    setReportTitle('Inventory Summary Report')
    setReportHtml(html)
  }

  const generateSalesReport = () => {
    const salesRows = sales.map(sale => {
      const vehicle = vehicles.find(v => v.id === sale.vehicleId)
      const buyer = customers.find(c => c.id === sale.buyerId)
      const paid = payments.filter(p => p.saleId === sale.id).reduce((sum,p)=>sum+p.amount,0)
      return `<tr><td>${sale.dateReserved || sale.createdAt || ''}</td><td>${vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : '—'}</td><td>${buyer?.name || '—'}</td><td>${sale.status}</td><td>${sale.paymentStatus}</td><td>R ${sale.salePrice.toLocaleString()}</td><td>R ${(sale.deposit||0).toLocaleString()}</td><td>R ${paid.toLocaleString()}</td></tr>`
    }).join('')

    const html = `
      <html>
        <head><title>Sales Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 2rem; color: #1f2937; }
          h1 { color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
          table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
          th { background: #f3f4f6; }
        </style></head>
        <body>
          <h1>Sales Report</h1>
          <p><strong>Total Sales:</strong> ${sales.length} | <strong>Revenue (Completed):</strong> R ${sales.filter(s=>s.status==='completed').reduce((sum,s)=>sum+s.salePrice,0).toLocaleString()}</p>
          <table><thead><tr><th>Date</th><th>Vehicle</th><th>Buyer</th><th>Status</th><th>Payment</th><th>Sale Price</th><th>Deposit</th><th>Paid</th></tr></thead><tbody>${salesRows}</tbody></table>
        </body>
      </html>
    `
    setReportTitle('Sales Report')
    setReportHtml(html)
  }

  const handlePrintCurrentReport = () => {
    if (reportHtml && reportTitle) {
      openPrintWindow(reportHtml, reportTitle)
    }
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
            <p className="text-gray-500">Select a vehicle to generate a vehicle report.</p>
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
                <button onClick={() => generateVehicleReport('internal')} className="flex-1 bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700">Internal Report</button>
                <button onClick={() => generateVehicleReport('customer')} className="flex-1 bg-green-600 text-white px-5 py-3 rounded-xl hover:bg-green-700">Customer Report</button>
              </div>
            </div>
          )}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button onClick={generateInventorySummaryReport} className="flex-1 bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700">Inventory Summary</button>
            <button onClick={generateSalesReport} className="flex-1 bg-purple-600 text-white px-5 py-3 rounded-xl hover:bg-purple-700">Sales Report</button>
          </div>
          {reportHtml && (
            <div className="mt-4 flex justify-end">
              <button onClick={handlePrintCurrentReport} className="bg-gray-800 text-white px-4 py-2 rounded-xl hover:bg-gray-900">Print / PDF</button>
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
