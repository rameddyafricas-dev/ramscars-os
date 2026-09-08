import { useEffect, useRef, useState, useMemo } from 'react'
import { useDocumentStore } from '../store/useDocumentStore'
import { useDealershipStore } from '../store/useDealershipStore'
import { useInspectionStore } from '../store/useInspectionStore'
import { useSaleStore } from '../store/useSaleStore'
import { useCustomerStore } from '../store/useCustomerStore'
import { useVehicleStore } from '../store/useVehicleStore'
import { generateId } from '../utils/id'
import { compressImage } from '../utils/image'
import type { Document } from '../types'
import DocumentPreviewModal from '../components/DocumentPreviewModal'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Documents() {
  const { documents, loadDocuments, createDocument, deleteDocument } = useDocumentStore()
  const { vehicles, loadVehicles, updateVehicle } = useVehicleStore()
  const { profile, loadProfile } = useDealershipStore()
  const { inspections, loadInspections } = useInspectionStore()
  const { sales, loadSales } = useSaleStore()
  const { customers, loadCustomers } = useCustomerStore()
  const [vehicleId, setVehicleId] = useState('')
  const [title, setTitle] = useState('')
  const [type, setType] = useState('legal')
  const [fileData, setFileData] = useState('')
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dragActive, setDragActive] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('Custom')
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null)
  const [generatedTitle, setGeneratedTitle] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const generateTemplateHtml = (templateLabel: string, vehicleId: string): string => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return '<p>No vehicle selected</p>';
    const inspection = inspections.find(i => i.id === vehicle.inspectionId);
    const sale = sales
      .filter(s => s.vehicleId === vehicleId && s.status !== 'cancelled')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const buyer = sale ? customers.find(c => c.id === sale.buyerId) : null;
    const dealer = profile;
    const owner = inspection?.ownerInfo;
    const vi = inspection?.vehicleInfo;
    const price = vehicle.listingPrice !== undefined ? vehicle.listingPrice : inspection?.financial.sellingPrice;
    const ownerPayout = inspection?.financial.purchasePrice;
    const additionalCosts = inspection?.financial.additionalCosts || [];

    const formatCurrency = (amount?: number | null) => amount !== undefined && amount !== null ? `R ${amount.toLocaleString()}` : '—';
    const htmlHead = '<html><head><style>body{font-family:Arial,sans-serif;padding:2rem;color:#1f2937;} h1{color:#4f46e5;border-bottom:2px solid #e5e7eb;padding-bottom:0.5rem;} .section{margin-bottom:1.5rem;} .label{font-weight:bold;color:#4b5563;} table{width:100%;border-collapse:collapse;margin-top:0.5rem;} th,td{border:1px solid #d1d5db;padding:8px;text-align:left;} th{background:#f3f4f6;}</style></head><body>';

    let body = '';
    switch (templateLabel) {
      case 'Consignment Agreement':
        body = `
          <h1>Consignment Agreement</h1>
          <div class="section"><h2>Parties</h2>
            <p><span class="label">Dealer:</span> ${dealer?.name || 'RamsCars Dealership'} | ${dealer?.phone || ''} | ${dealer?.email || ''}</p>
            <p><span class="label">Owner:</span> ${owner?.name || '—'}</p>
            <p><span class="label">Owner Contact:</span> ${owner?.contactNumber || '—'}</p>
            <p><span class="label">Owner Address:</span> ${owner?.physicalAddress || '—'}</p>
          </div>
          <div class="section"><h2>Vehicle Details</h2>
            <p><span class="label">Vehicle:</span> ${vehicle.year} ${vehicle.make} ${vehicle.model}</p>
            <p><span class="label">VIN:</span> ${vehicle.vin || '—'}</p>
            <p><span class="label">Stock Number:</span> ${vehicle.stockNumber || '—'}</p>
            <p><span class="label">Mileage:</span> ${vehicle.mileage.toLocaleString()} km</p>
          </div>
          <div class="section"><h2>Agreement</h2>
            <p>The owner consigns the above vehicle to the dealer for sale. The dealer will inspect, market, and sell the vehicle on behalf of the owner. The owner will receive the agreed net amount upon sale.</p>
            <p><span class="label">Owner Payout / Cost Price:</span> ${formatCurrency(ownerPayout)}</p>
            <p><span class="label">Additional Costs:</span> ${additionalCosts.map(c => `${c.label} ${formatCurrency(c.amount)}`).join('; ') || 'None'}</p>
          </div>
        `;
        break;

      case 'Sales Agreement':
        body = `
          <h1>Sales Agreement</h1>
          <div class="section"><h2>Seller</h2><p>${dealer?.name || 'RamsCars Dealership'} | ${dealer?.phone || ''}</p></div>
          <div class="section"><h2>Buyer</h2><p>${buyer?.name || '—'} | ${buyer?.phone || ''} | ${buyer?.email || ''}</p></div>
          <div class="section"><h2>Vehicle</h2><p>${vehicle.year} ${vehicle.make} ${vehicle.model} (Stock: ${vehicle.stockNumber || '—'})</p></div>
          <div class="section"><h2>Sale Price</h2><p>${formatCurrency(price)}</p></div>
          <div class="section"><h2>Terms</h2><p>Vehicle sold as inspected. No warranties unless stated.</p></div>
        `;
        break;

      case 'Bill of Sale':
        body = `
          <h1>Bill of Sale</h1>
          <p>Sold by ${dealer?.name || 'RamsCars Dealership'} to ${buyer?.name || '—'} the following vehicle:</p>
          <p>${vehicle.year} ${vehicle.make} ${vehicle.model}, VIN: ${vehicle.vin || '—'}, Mileage: ${vehicle.mileage.toLocaleString()} km</p>
          <p>Sale Price: ${formatCurrency(price)}</p>
        `;
        break;

      case 'Sales Invoice':
        body = `
          <h1>Sales Invoice</h1>
          <p><span class="label">Dealer:</span> ${dealer?.name || 'RamsCars Dealership'}</p>
          <p><span class="label">Buyer:</span> ${buyer?.name || '—'}</p>
          <table><tr><th>Description</th><th>Amount</th></tr><tr><td>${vehicle.year} ${vehicle.make} ${vehicle.model}</td><td>${formatCurrency(price)}</td></tr></table>
        `;
        break;

      case 'Change of Ownership':
        body = `
          <h1>Change of Ownership</h1>
          <p><span class="label">Vehicle:</span> ${vehicle.year} ${vehicle.make} ${vehicle.model}</p>
          <p><span class="label">VIN:</span> ${vehicle.vin || '—'}</p>
          <p><span class="label">Registration:</span> ${vi?.registrationNumber || '—'}</p>
          <p><span class="label">New Owner:</span> ${buyer?.name || '—'}</p>
          <p><span class="label">Previous Owner:</span> ${owner?.name || '—'}</p>
        `;
        break;

      case 'Roadworthy Certificate':
        body = `
          <h1>Roadworthy Certificate</h1>
          <p>This certifies that the vehicle ${vehicle.year} ${vehicle.make} ${vehicle.model} (Stock: ${vehicle.stockNumber || '—'}) has passed a roadworthy inspection.</p>
          <p>Issued by ${dealer?.name || 'RamsCars Dealership'}</p>
        `;
        break;

      case 'Service History':
        body = `
          <h1>Service History</h1>
          <p>Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}</p>
          <p>Service records are maintained by RamsCars Dealership.</p>
        `;
        break;

      case 'Warranty Document':
        body = `
          <h1>Warranty Document</h1>
          <p>Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}</p>
          <p>Warranty terms as per agreement.</p>
        `;
        break;

      case 'Insurance Document':
        body = `
          <h1>Insurance Document</h1>
          <p>Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}</p>
          <p>Insurance details as provided by owner/buyer.</p>
        `;
        break;

      case 'Accident Report':
        body = `
          <h1>Accident Report</h1>
          <p>Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}</p>
          <p>Reported faults: ${inspection?.faults.map(f => f.description).join(', ') || 'None'}</p>
        `;
        break;

      case 'Purchase Agreement':
        body = `
          <h1>Purchase Agreement</h1>
          <p>Buyer: ${buyer?.name || '—'}</p>
          <p>Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}</p>
          <p>Price: ${formatCurrency(price)}</p>
        `;
        break;

      case 'Trade-In Agreement':
        body = `
          <h1>Trade-In Agreement</h1>
          <p>Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}</p>
          <p>Trade-in value: ${formatCurrency(inspection?.financial.tradeValue)}</p>
        `;
        break;

      case 'Finance Agreement':
        body = `
          <h1>Finance Agreement</h1>
          <p>Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}</p>
          <p>Financing terms to be provided.</p>
        `;
        break;

      default:
        body = '<p>No template content.</p>';
    }

    return htmlHead + body + '</body></html>';
  };

  const handleGenerateTemplate = () => {
    if (!vehicleId || selectedTemplate === 'Custom') {
      alert('Select a vehicle and a template');
      return;
    }
    const html = generateTemplateHtml(selectedTemplate, vehicleId);
    setGeneratedHtml(html);
    setGeneratedTitle(selectedTemplate);
    // Also set fileData to data URL for saving
    setFileData('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    setTitle(selectedTemplate);
    setType(documentTemplates.find(t => t.label === selectedTemplate)?.type || 'legal');
  };



  const documentTemplates = [
    { label: 'Custom', title: '', type: 'legal' },
    { label: 'Sales Agreement', title: 'Sales Agreement', type: 'legal' },
    { label: 'Bill of Sale', title: 'Bill of Sale', type: 'legal' },
    { label: 'Sales Invoice', title: 'Sales Invoice', type: 'invoice' },
    { label: 'Change of Ownership', title: 'Change of Ownership', type: 'legal' },
    { label: 'Consignment Agreement', title: 'Consignment Agreement', type: 'legal' },
    { label: 'Roadworthy Certificate', title: 'Roadworthy Certificate', type: 'legal' },
    { label: 'Service History', title: 'Service History', type: 'service' },
    { label: 'Warranty Document', title: 'Warranty Document', type: 'other' },
    { label: 'Insurance Document', title: 'Insurance Document', type: 'other' },
    { label: 'Accident Report', title: 'Accident Report', type: 'other' },
    { label: 'Purchase Agreement', title: 'Purchase Agreement', type: 'legal' },
    { label: 'Trade-In Agreement', title: 'Trade-In Agreement', type: 'legal' },
    { label: 'Finance Agreement', title: 'Finance Agreement', type: 'legal' },
  ];

  useEffect(() => {
    loadDocuments()
    loadVehicles()
    loadProfile()
    loadInspections()
    loadSales()
    loadCustomers()
  }, [loadDocuments, loadVehicles, loadProfile, loadInspections, loadSales, loadCustomers])

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const vehicle = vehicles.find(v => v.id === doc.vehicleId)
      const matchesSearch = `${doc.title} ${doc.type} ${vehicle?.make || ''} ${vehicle?.model || ''}`.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === 'all' || doc.type === typeFilter
      return matchesSearch && matchesType
    })
  }, [documents, vehicles, search, typeFilter])

  const handleFile = async (file: File) => {
    if (file.type.startsWith('image/')) {
      const data = await compressImage(file, 1600, 1600, 0.8)
      setFileData(data)
    } else {
      const reader = new FileReader()
      reader.onload = () => setFileData(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await handleFile(file)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await handleFile(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !fileData) return
    const now = new Date().toISOString()
    const doc: Document = {
      id: generateId('doc'),
      vehicleId: vehicleId || undefined,
      type,
      title,
      fileUrl: fileData,
      createdAt: now,
      updatedAt: now,
    }
    await createDocument(doc)

    // Auto-link document to deal stages
    if (vehicleId) {
      const vehicle = vehicles.find(v => v.id === vehicleId)
      if (vehicle) {
        const updatedVehicle = { ...vehicle, updatedAt: new Date().toISOString() }
        if (title.toLowerCase().includes('consignment')) {
          updatedVehicle.consignmentSigned = true
        }
        if (title.toLowerCase().includes('hpi') && !title.toLowerCase().includes('failed')) {
          updatedVehicle.hpiPassed = true
        }
        if (title.toLowerCase().includes('change of ownership')) {
          updatedVehicle.ownershipDone = true
        }
        await updateVehicle(updatedVehicle)
      }
    }

    setTitle('')
    setType('legal')
    setVehicleId('')
    setFileData('')
    setSelectedTemplate('Custom')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <>
      <ConfirmDialog
        open={deleteTargetId !== null}
        title="Delete Document"
        message="Are you sure you want to delete this document?"
        confirmLabel="Delete"
        onConfirm={() => { if (deleteTargetId) deleteDocument(deleteTargetId); setDeleteTargetId(null); }}
        onCancel={() => setDeleteTargetId(null)}
      />
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{documents.length} document(s)</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add document form */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Document</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <select
              value={selectedTemplate}
              onChange={(e) => {
                const template = documentTemplates.find(t => t.label === e.target.value);
                if (template) {
                  setSelectedTemplate(template.label);
                  setTitle(template.title);
                  setType(template.type);
                }
              }}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
            >
              {documentTemplates.map(t => (
                <option key={t.label} value={t.label}>{t.label}</option>
              ))}
            </select>
            <input placeholder="Document title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" required />
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5">
              <option value="legal">Legal</option>
              <option value="service">Service</option>
              <option value="invoice">Invoice</option>
              <option value="other">Other</option>
            </select>
            <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5">
              <option value="">No vehicle</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>{vehicle.year} {vehicle.make} {vehicle.model}</option>
              ))}
            </select>

            {/* Drag and drop area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
            >
              <p className="text-sm text-gray-500">Drag & drop file here or click to select</p>
              <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" onChange={handleInputChange} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="mt-2 inline-block bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl cursor-pointer hover:bg-indigo-200">Browse</label>
              {fileData && <p className="mt-2 text-xs text-green-600">File loaded</p>}
            </div>

            <button type="button" onClick={handleGenerateTemplate} className="w-full bg-purple-600 text-white px-5 py-3 rounded-xl hover:bg-purple-700">Generate Document</button>
            <button type="submit" className="w-full bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700">Add Document</button>
          </form>
        </div>

        {/* Documents list */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <input type="text" placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5 flex-1" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5">
              <option value="all">All types</option>
              <option value="legal">Legal</option>
              <option value="service">Service</option>
              <option value="invoice">Invoice</option>
              <option value="other">Other</option>
            </select>
          </div>

          {filteredDocuments.length === 0 ? (
            <p className="text-gray-500 text-sm">No documents found.</p>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map(doc => {
                const vehicle = vehicles.find(v => v.id === doc.vehicleId)
                return (
                  <div key={doc.id} className="bg-gray-50 rounded-xl p-4 flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate">{doc.title}</p>
                      <p className="text-xs text-gray-500 capitalize">{doc.type}</p>
                      {vehicle && <p className="text-sm text-gray-600">{vehicle.year} {vehicle.make} {vehicle.model}</p>}
                    </div>
                    <div className="flex gap-2 ml-3">
                      {doc.fileUrl && (
                        <button onClick={() => setPreviewDoc(doc)} className="text-indigo-600 text-sm hover:underline">View</button>
                      )}
                      <button onClick={() => setDeleteTargetId(doc.id)} className="text-red-600 text-sm hover:underline">Delete</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {generatedHtml && (
        <DocumentPreviewModal type="html" html={generatedHtml} title={generatedTitle} onClose={() => setGeneratedHtml(null)} />
      )}
            {previewDoc && previewDoc.fileUrl && (
        <DocumentPreviewModal
          type={previewDoc.fileUrl.startsWith('data:image') ? 'image' : 'pdf'}
          src={previewDoc.fileUrl}
          title={previewDoc.title}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
    </>
  )
}
