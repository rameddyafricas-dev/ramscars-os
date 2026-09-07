import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useInspectionStore } from '../store/useInspectionStore'
import { useDocumentStore } from '../store/useDocumentStore'
import CollapsibleCard from '../components/CollapsibleCard'
import FullscreenPhotoModal from '../components/FullscreenPhotoModal'
import DocumentPreviewModal from '../components/DocumentPreviewModal'
import type { Inspection, InspectionScore } from '../types'

export default function InspectionView() {
  const { id } = useParams()
  const { inspections, loadInspections } = useInspectionStore()
  const { documents, loadDocuments } = useDocumentStore()
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [briefHtml, setBriefHtml] = useState<string | null>(null)
  const [briefTitle, setBriefTitle] = useState('')

  useEffect(() => {
    const load = async () => {
      await loadInspections()
      await loadDocuments()
    }
    load()
  }, [loadInspections, loadDocuments])

  useEffect(() => {
    if (id && inspections.length > 0) {
      const found = inspections.find((i) => i.id === id) || null
      setInspection(found)
    }
  }, [id, inspections])

  const allAdPhotos = useMemo(() => {
    if (!inspection) return []
    const slotPhotos = inspection.advertisementSlots
      ? inspection.advertisementSlots.filter(s => s.photo && s.photo.trim() !== '').map(s => s.photo)
      : []
    const legacyPhotos = inspection.advertisementPhotos ? inspection.advertisementPhotos.filter(p => p) : []
    return Array.from(new Set([...slotPhotos, ...legacyPhotos]))
  }, [inspection])


  const generateDealBrief = () => {
    if (!inspection) return
    const vehicleDocs = documents.filter(d => d.vehicleId === inspection.vehicleId)
    const consignmentSigned = vehicleDocs.some(d => d.title.toLowerCase().includes('consignment'))
    const hpiPassed = vehicleDocs.some(d => d.title.toLowerCase().includes('hpi') && !d.title.toLowerCase().includes('failed'))
    const ownershipDone = vehicleDocs.some(d => d.title.toLowerCase().includes('change of ownership'))
    const marketingDone = !!inspection.marketing?.title && inspection.marketing?.channels?.length > 0
    const profit = inspection.financial.estimatedProfit ?? 0
    const margin = inspection.financial.expectedMargin

    const faultsSummary = inspection.faults.length > 0
      ? inspection.faults.map(f => `• ${f.description}`).join('<br/>')
      : 'None recorded'

    const scoreItems = Object.entries({
      mechanical: inspection.score.mechanical,
      interior: inspection.score.interior,
      exterior: inspection.score.exterior,
      electrical: inspection.score.electrical,
      safety: inspection.score.safety,
      body: inspection.score.body,
      engine: inspection.score.engine,
      suspension: inspection.score.suspension,
    }).map(([k, v]) => `<span><strong>${k}:</strong> ${v !== null && v !== undefined ? v + '%' : '—'}</span>`).join(' | ')

    const html = `
      <html>
        <head>
          <title>Deal Brief</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 2rem; color: #1f2937; }
            h1 { color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
            .section { margin-bottom: 1.5rem; }
            .label { font-weight: bold; color: #4b5563; }
            table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>Deal Brief</h1>
          <div class="section">
            <h2>Vehicle</h2>
            <p><span class="label">Vehicle:</span> ${inspection.vehicleInfo.year} ${inspection.vehicleInfo.make} ${inspection.vehicleInfo.model}</p>
            <p><span class="label">Stock Number:</span> ${inspection.vehicleInfo.stockNumber || '—'}</p>
            <p><span class="label">VIN:</span> ${inspection.vehicleInfo.vin || '—'}</p>
          </div>
          <div class="section">
            <h2>Owner Information</h2>
            <p><span class="label">Name:</span> ${inspection.ownerInfo.name || '—'}</p>
            <p><span class="label">Contact:</span> ${inspection.ownerInfo.contactNumber || '—'}</p>
            <p><span class="label">Email:</span> ${inspection.ownerInfo.email || '—'}</p>
          </div>
          <div class="section">
            <h2>Financial Summary</h2>
            <p><span class="label">Owner Payout / Cost Price:</span> R ${inspection.financial.purchasePrice ?? '—'}</p>
            <p><span class="label">Selling Price:</span> R ${inspection.financial.sellingPrice ?? '—'}</p>
            <p><span class="label">Estimated Profit:</span> R ${profit.toLocaleString()}</p>
            <p><span class="label">Expected Margin:</span> ${margin !== null && margin !== undefined ? margin.toFixed(2) + '%' : '—'}</p>
          </div>
          <div class="section">
            <h2>Deal Stages</h2>
            <p><span class="label">Consignment Signed:</span> ${consignmentSigned ? '✅ Yes' : '❌ No'}</p>
            <p><span class="label">HPI Passed:</span> ${hpiPassed ? '✅ Yes' : '❌ No'}</p>
            <p><span class="label">Marketing Published:</span> ${marketingDone ? '✅ Yes' : '❌ No'}</p>
            <p><span class="label">Change of Ownership Done:</span> ${ownershipDone ? '✅ Yes' : '❌ No'}</p>
          </div>
          <div class="section">
            <h2>Inspection Score</h2>
            <p>${scoreItems}</p>
          </div>
          <div class="section">
            <h2>Faults</h2>
            <p>${faultsSummary}</p>
          </div>
        </body>
      </html>
    `

    setBriefTitle('Deal Brief')
    setBriefHtml(html)
  };

  if (!inspection) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Inspection not found.</p>
        <Link to="/inventory" className="text-indigo-600 hover:underline">← Back to Inventory</Link>
      </div>
    )
  }

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

  return (
    <div className="max-w-5xl mx-auto space-y-4 p-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">View Inspection</h1>
          <p className="text-sm text-gray-500 mt-1">
            Status: <span className="capitalize font-medium">{inspection.status.replace('_', ' ')}</span>
            {inspection.progress !== undefined && ` • Progress: ${inspection.progress}%`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/inventory" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50">
            ← Inventory
          </Link>
          <Link to={`/inspection`} className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700">
            Edit Inspection
          </Link>
          <button onClick={generateDealBrief} className="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700">Deal Brief</button>
        </div>
      </div>

      {/* Owner Information */}
      <CollapsibleCard defaultOpen title="Owner Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <p><span className="font-medium">Name:</span> {inspection.ownerInfo.name || '—'}</p>
          <p><span className="font-medium">Contact:</span> {inspection.ownerInfo.contactNumber || '—'}</p>
          <p><span className="font-medium">Email:</span> {inspection.ownerInfo.email || '—'}</p>
          <p><span className="font-medium">ID Number:</span> {inspection.ownerInfo.idNumber || '—'}</p>
          <p className="col-span-full"><span className="font-medium">Address:</span> {inspection.ownerInfo.physicalAddress || '—'}</p>
        </div>
      </CollapsibleCard>

      {/* Vehicle Information */}
      <CollapsibleCard defaultOpen title="Vehicle Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <p><span className="font-medium">Vehicle Type:</span> {inspection.vehicleInfo.vehicleType}</p>
          <p><span className="font-medium">Stock Number:</span> {inspection.vehicleInfo.stockNumber || '—'}</p>
          <p><span className="font-medium">VIN:</span> {inspection.vehicleInfo.vin || '—'}</p>
          <p><span className="font-medium">Make:</span> {inspection.vehicleInfo.make || '—'}</p>
          <p><span className="font-medium">Model:</span> {inspection.vehicleInfo.model || '—'}</p>
          <p><span className="font-medium">Year:</span> {inspection.vehicleInfo.year || '—'}</p>
          <p><span className="font-medium">Color:</span> {inspection.vehicleInfo.color || '—'}</p>
          <p><span className="font-medium">Body Type:</span> {inspection.vehicleInfo.bodyType || '—'}</p>
          <p><span className="font-medium">Mileage:</span> {inspection.vehicleInfo.mileage ? `${Number(inspection.vehicleInfo.mileage).toLocaleString()} km` : '—'}</p>
          <p><span className="font-medium">Transmission:</span> {inspection.vehicleInfo.transmission}</p>
          <p><span className="font-medium">Fuel Type:</span> {inspection.vehicleInfo.fuelType}</p>
          <p><span className="font-medium">Registration Number:</span> {inspection.vehicleInfo.registrationNumber || '—'}</p>
          <p><span className="font-medium">License Expiry:</span> {inspection.vehicleInfo.licenseExpiry || '—'}</p>
          <p><span className="font-medium">Engine Number:</span> {inspection.vehicleInfo.engineNumber || '—'}</p>
          <p><span className="font-medium">Vehicle Papers:</span> {inspection.vehicleInfo.vehiclePapers.replace('_', ' ') || '—'}</p>
          <p><span className="font-medium">Vehicle Status:</span> {inspection.vehicleInfo.vehicleStatus || '—'}</p>
        </div>
      </CollapsibleCard>

      {/* Faults */}
      <CollapsibleCard defaultOpen title={`Faults (${inspection.faults.length})`}>
        {inspection.faults.length === 0 ? (
          <p className="text-gray-500 text-sm">No faults recorded.</p>
        ) : (
          <ul className="space-y-1 list-disc list-inside text-sm">
            {inspection.faults.map((fault) => (
              <li key={fault.id}>{fault.description}</li>
            ))}
          </ul>
        )}
      </CollapsibleCard>

      {/* Advertisement Photos */}
      <CollapsibleCard defaultOpen title={`Advertisement Photos (${allAdPhotos.length})`}>
        {allAdPhotos.length === 0 ? (
          <p className="text-gray-500 text-sm">No advertisement photos yet.</p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {allAdPhotos.map((photo, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <img
                  src={photo}
                  alt={`Photo ${idx + 1}`}
                  className="photo-thumb h-20 w-20"
                  onClick={() => setSelectedPhoto(photo)}
                />
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhoto(photo);
                  }}
                >
                  Preview
                </button>
              </div>
            ))}
          </div>
        )}
      </CollapsibleCard>

      {/* Checklist */}
      <CollapsibleCard defaultOpen title="Checklist">
        {(['documentation','exterior','interior','engine_bay','underbody'] as const).map((category) => {
          const items = inspection.checklist.filter((c) => c.category === category)
          if (items.length === 0) return null
          return (
            <div key={category} className="mb-3">
              <h4 className="text-sm font-semibold capitalize mb-1">{category.replace('_', ' ')}</h4>
              <div className="space-y-1">
                {items.map((item) => (
                  <div key={item.id} className="text-sm bg-gray-50 rounded-lg p-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{item.label}</span>
                      <span className="font-medium capitalize">{item.result || 'not set'}</span>
                    </div>
                    {item.note && <p className="text-xs text-gray-600 mt-1">📝 {item.note}</p>}
                    {item.mediaIds && item.mediaIds.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {item.mediaIds.filter(m => m).map((media, idx) => (
                          <img key={idx} src={media} alt={`media ${idx + 1}`} className="h-10 w-10 object-cover rounded cursor-pointer border" onClick={() => setSelectedPhoto(media)} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </CollapsibleCard>

      {/* Inspection Score */}
      <CollapsibleCard defaultOpen title="Inspection Score">
        {Object.entries(scoreLabels).map(([key, label]) => {
          const val = inspection.score[key as keyof InspectionScore]
          return (
            <div key={key} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
              <span className="text-gray-600">{label}</span>
              <span className="font-semibold">{val !== null && val !== undefined ? `${val}%` : '—'}</span>
            </div>
          )
        })}
      </CollapsibleCard>

      {/* Location */}
      <CollapsibleCard defaultOpen title="Location">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <p><span className="font-medium">DMS:</span> {inspection.location.dms || '—'}</p>
          <p><span className="font-medium">Decimal:</span> {inspection.location.decimal || '—'}</p>
          <p><span className="font-medium">Bay:</span> {inspection.location.bay || '—'}</p>
          <p><span className="font-medium">Pinned:</span> {inspection.location.gps ? `${inspection.location.gps.lat.toFixed(6)}, ${inspection.location.gps.lng.toFixed(6)}` : '—'}</p>
        </div>
      </CollapsibleCard>

      {/* Financial Information */}
      <CollapsibleCard defaultOpen title="Financial Information">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p><span className="font-medium">Owner Payout / Cost Price:</span> R {inspection.financial.purchasePrice ?? '—'}</p>
          <p><span className="font-medium">Selling Price:</span> R {inspection.financial.sellingPrice ?? '—'}</p>
          <p><span className="font-medium">Trade Value:</span> R {inspection.financial.tradeValue ?? '—'}</p>
          <p><span className="font-medium">Estimated Profit:</span> R {inspection.financial.estimatedProfit ?? '—'}</p>
          <p className="col-span-2"><span className="font-medium">Expected Margin:</span> {inspection.financial.expectedMargin !== null && inspection.financial.expectedMargin !== undefined ? `${inspection.financial.expectedMargin.toFixed(2)}%` : '—'}</p>
        </div>
        {inspection.financial.additionalCosts && inspection.financial.additionalCosts.length > 0 && (
          <div className="mt-3">
            <p className="font-medium text-sm mb-1">Additional Costs</p>
            {inspection.financial.additionalCosts.map((cost, idx) => (
              <div key={idx} className="flex justify-between text-sm py-1">
                <span>{cost.label}</span>
                <span>R {cost.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </CollapsibleCard>

      {selectedPhoto && (
        <FullscreenPhotoModal src={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
            {briefHtml && <DocumentPreviewModal type="html" html={briefHtml} title={briefTitle} onClose={() => setBriefHtml(null)} />}
    </div>
  )
}
