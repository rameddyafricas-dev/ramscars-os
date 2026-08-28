import { useEffect, useState } from 'react'
import { useInspectionStore } from '../store/useInspectionStore'
import { useVehicleStore } from '../store/useVehicleStore'
import { generateStockNumber, decodeVIN } from '../utils/vinDecoder'
import { compressImage } from '../utils/image'
import CameraModal from '../components/CameraModal'
import FullscreenPhotoModal from '../components/FullscreenPhotoModal'
import type { Inspection, Fault, InspectionScore, FinancialInfo, Vehicle } from '../types'
import type { DecodedVIN } from '../utils/vinDecoder'

const initialScore: InspectionScore = {
  mechanical: null,
  interior: null,
  exterior: null,
  electrical: null,
  safety: null,
  body: null,
  engine: null,
  suspension: null,
}

export default function InspectionPage() {
  const { activeInspection, newInspection, updateInspection } = useInspectionStore()
  const { vehicles, createVehicle, updateVehicle } = useVehicleStore()
  const [form, setForm] = useState<Inspection | null>(activeInspection)
  const [decodedVIN, setDecodedVIN] = useState<DecodedVIN | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  useEffect(() => {
    setForm(activeInspection)
  }, [activeInspection])

  useEffect(() => {
    if (!form || !activeInspection || form.id !== activeInspection.id) return

    const calculateProgress = (inspection: Inspection): number => {
      let completed = 0
      const sections = [
        inspection.ownerInfo.name && inspection.ownerInfo.contactNumber,
        inspection.vehicleInfo.make && inspection.vehicleInfo.model && inspection.vehicleInfo.vin,
        inspection.checklist.some((c) => c.checked),
        inspection.faults.length > 0 || inspection.advertisementPhotos.length > 0,
        inspection.location.decimal || inspection.location.dms,
        inspection.financial.purchasePrice && inspection.financial.sellingPrice,
        inspection.marketing.title,
      ]
      sections.forEach((s) => { if (s) completed++ })
      return Math.round((completed / sections.length) * 100)
    }

    const newProgress = calculateProgress(form)
    if (form.progress !== newProgress) {
      setForm((prev) => (prev ? { ...prev, progress: newProgress } : prev))
      return
    }

    const timer = setTimeout(() => {
      updateInspection(form)
    }, 500)

    return () => clearTimeout(timer)
  }, [form, activeInspection, updateInspection])

  const handleNewInspection = async () => {
    if (form) {
      await updateInspection(form)
      const existingVehicle = vehicles.find((v) => v.inspectionId === form.id)
      const vehicleData: Vehicle = {
        id: existingVehicle?.id || `veh_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        vin: form.vehicleInfo.vin,
        registration: form.vehicleInfo.registrationNumber,
        make: form.vehicleInfo.make,
        model: form.vehicleInfo.model,
        year: Number(form.vehicleInfo.year) || 0,
        mileage: Number(form.vehicleInfo.mileage) || 0,
        colour: form.vehicleInfo.color,
        fuelType: form.vehicleInfo.fuelType,
        transmission: form.vehicleInfo.transmission,
        classification: form.vehicleInfo.bodyType,
        status: 'available',
        notes: '',
        stockNumber: form.vehicleInfo.stockNumber,
        photos: form.advertisementPhotos,
        inspectionId: form.id,
        listingPrice: form.financial.sellingPrice ?? undefined,
        createdAt: existingVehicle?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      if (existingVehicle) {
        await updateVehicle(vehicleData)
      } else {
        await createVehicle(vehicleData)
      }
    }
    await newInspection()
  }

  if (!form) {
    return (
      <div className="p-6">
        <button
          onClick={handleNewInspection}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          New Inspection
        </button>
      </div>
    )
  }

  const handleOwnerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, ownerInfo: { ...form.ownerInfo, [e.target.name]: e.target.value } })
  }

  const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, vehicleInfo: { ...form.vehicleInfo, [e.target.name]: e.target.value } })
  }

  const handleVINChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vin = e.target.value.toUpperCase()
    setForm({ ...form, vehicleInfo: { ...form.vehicleInfo, vin } })
    if (vin.length === 17 || (vin.length < 17 && vin.length > 0)) {
      const decoded = decodeVIN(vin)
      setDecodedVIN(decoded)
      if (decoded.make !== 'Unknown') {
        setForm((prev) => prev ? ({
          ...prev,
          vehicleInfo: {
            ...prev.vehicleInfo,
            make: decoded.make,
            model: decoded.model,
            year: decoded.year || prev.vehicleInfo.year,
          },
        }) : prev)
      }
    } else {
      setDecodedVIN(null)
    }
  }

  const handleDecodeVIN = () => {
    const vin = form.vehicleInfo.vin.trim().toUpperCase()
    if (!vin) return
    const decoded = decodeVIN(vin)
    setDecodedVIN(decoded)
    if (decoded.make !== 'Unknown') {
      setForm({
        ...form,
        vehicleInfo: {
          ...form.vehicleInfo,
          make: decoded.make,
          model: decoded.model,
          year: decoded.year || form.vehicleInfo.year,
        },
      })
    }
  }

  const handleStockGenerate = () => {
    const stock = generateStockNumber()
    setForm({ ...form, vehicleInfo: { ...form.vehicleInfo, stockNumber: stock } })
  }

  const handleFaultAdd = () => {
    const newFault: Fault = { id: `fault_${Date.now()}`, description: '' }
    setForm({ ...form, faults: [...form.faults, newFault] })
  }

  const handleFaultChange = (id: string, value: string) => {
    setForm({
      ...form,
      faults: form.faults.map((f) => (f.id === id ? { ...f, description: value } : f)),
    })
  }

  const handleFaultDelete = (id: string) => {
    setForm({ ...form, faults: form.faults.filter((f) => f.id !== id) })
  }

  const handleChecklistToggle = (id: string) => {
    setForm({
      ...form,
      checklist: form.checklist.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c)),
    })
  }

  const handleScoreChange = (category: keyof InspectionScore, value: string) => {
    const numeric = value === '' ? null : Number(value)
    setForm({ ...form, score: { ...form.score, [category]: numeric } })
  }

  const handleLocationChange = (field: 'dms' | 'decimal' | 'bay', value: string) => {
    setForm({ ...form, location: { ...form.location, [field]: value } })
  }

  const clearLocation = () => {
    setForm({ ...form, location: { dms: '', decimal: '', gps: undefined, bay: '' } })
  }

  const getGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          setForm({
            ...form,
            location: {
              ...form.location,
              decimal: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
              gps: { lat, lng },
            },
          })
        },
        (err) => console.error('Geolocation error:', err)
      )
    }
  }

  const showMap = () => {
    if (form.location.gps) {
      const { lat, lng } = form.location.gps
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
    } else if (form.location.decimal) {
      const [lat, lng] = form.location.decimal.split(',').map((s) => s.trim())
      if (lat && lng) window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
    }
  }

  const handleFinancialChange = (field: keyof FinancialInfo, value: string) => {
    const numeric = value === '' ? null : Number(value)
    const updatedFinancial = { ...form.financial, [field]: numeric }
    const purchase = updatedFinancial.purchasePrice || 0
    const selling = updatedFinancial.sellingPrice || 0
    const repair = updatedFinancial.repairCost || 0
    const transport = updatedFinancial.transportCost || 0
    if (purchase > 0 && selling > 0) {
      const profit = selling - purchase - repair - transport
      updatedFinancial.estimatedProfit = profit
      updatedFinancial.expectedMargin = (profit / purchase) * 100
    }
    setForm({ ...form, financial: updatedFinancial })
  }

  const handleMarketingChange = (field: 'title' | 'description', value: string) => {
    setForm({ ...form, marketing: { ...form.marketing, [field]: value } })
  }

  const handleHashtagsChange = (value: string) => {
    const hashtags = value.split(',').map((s) => s.trim()).filter(Boolean)
    setForm({ ...form, marketing: { ...form.marketing, hashtags } })
  }

  const handleChannelsToggle = (channel: string) => {
    const channels = form.marketing.channels.includes(channel)
      ? form.marketing.channels.filter((c) => c !== channel)
      : [...form.marketing.channels, channel]
    setForm({ ...form, marketing: { ...form.marketing, channels } })
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    for (const file of files) {
      try {
        const compressed = await compressImage(file)
        setForm((prev) =>
          prev
            ? { ...prev, advertisementPhotos: [...prev.advertisementPhotos, compressed] }
            : prev
        )
      } catch (error) {
        console.error('Image compression failed:', error)
      }
    }
    // reset input value so same file can be selected again
    e.target.value = ''
  }

  const handlePhotoDelete = (index: number) => {
    setForm((prev) => prev ? {
      ...prev,
      advertisementPhotos: prev.advertisementPhotos.filter((_, i) => i !== index),
    } : prev)
  }

  const openCamera = () => {
    setShowCamera(true)
  }

  const handleCameraCapture = (dataUrl: string) => {
    setForm((prev) => prev ? { ...prev, advertisementPhotos: [...prev.advertisementPhotos, dataUrl] } : prev)
  }

  const progress = form.progress

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inspection</h1>
        <div className="flex items-center gap-4">
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as Inspection['status'] })}
            className="border rounded px-3 py-2"
          >
            <option value="draft">Draft</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <button
            onClick={handleNewInspection}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            New Inspection
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-4 rounded shadow">
        <div className="flex justify-between text-sm mb-1">
          <span>Inspection Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-green-500 h-3 rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Owner Information */}
      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-3">Owner Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="name" placeholder="Owner Name" value={form.ownerInfo.name} onChange={handleOwnerChange} className="border rounded px-3 py-2" />
          <input name="contactNumber" placeholder="Contact Number" value={form.ownerInfo.contactNumber} onChange={handleOwnerChange} className="border rounded px-3 py-2" />
          <input name="email" placeholder="Email" value={form.ownerInfo.email} onChange={handleOwnerChange} className="border rounded px-3 py-2" />
          <input name="idNumber" placeholder="ID Number" value={form.ownerInfo.idNumber} onChange={handleOwnerChange} className="border rounded px-3 py-2" />
          <input name="physicalAddress" placeholder="Physical Address" value={form.ownerInfo.physicalAddress} onChange={handleOwnerChange} className="border rounded px-3 py-2 col-span-full" />
        </div>
      </section>

      {/* Vehicle Information */}
      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-3">Vehicle Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select name="vehicleType" value={form.vehicleInfo.vehicleType} onChange={handleVehicleChange} className="border rounded px-3 py-2">
            <option value="runner">Runner</option>
            <option value="non-runner">Non-Runner</option>
          </select>
          <div className="flex gap-2">
            <input name="vin" placeholder="VIN" value={form.vehicleInfo.vin} onChange={handleVINChange} className="border rounded px-3 py-2 flex-1" />
            <button type="button" onClick={handleDecodeVIN} className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700">Decode</button>
          </div>
          {decodedVIN && (
            <div className="col-span-full text-sm text-gray-700 bg-gray-50 p-2 rounded">
              <p>Make: <strong>{decodedVIN.make}</strong></p>
              <p>Country: <strong>{decodedVIN.country}</strong></p>
              <p>Year: <strong>{decodedVIN.year || 'Unknown'}</strong></p>
              <p>Production Year: <strong>{decodedVIN.productionYear || 'Unknown'}</strong></p>
              <p>Type: <strong>{decodedVIN.isModern ? 'Modern (17-char)' : 'Legacy'}</strong></p>
            </div>
          )}
          <input name="make" placeholder="Make" value={form.vehicleInfo.make} onChange={handleVehicleChange} className="border rounded px-3 py-2" />
          <input name="model" placeholder="Model" value={form.vehicleInfo.model} onChange={handleVehicleChange} className="border rounded px-3 py-2" />
          <input name="year" placeholder="Year" value={form.vehicleInfo.year} onChange={handleVehicleChange} className="border rounded px-3 py-2" />
          <input name="color" placeholder="Color" value={form.vehicleInfo.color} onChange={handleVehicleChange} className="border rounded px-3 py-2" />
          <input name="bodyType" placeholder="Body Type" value={form.vehicleInfo.bodyType} onChange={handleVehicleChange} className="border rounded px-3 py-2" />
          <input name="mileage" placeholder="Mileage" value={form.vehicleInfo.mileage} onChange={handleVehicleChange} className="border rounded px-3 py-2" />
          <select name="transmission" value={form.vehicleInfo.transmission} onChange={handleVehicleChange} className="border rounded px-3 py-2">
            <option value="manual">Manual</option>
            <option value="automatic">Automatic</option>
            <option value="cvt">CVT</option>
            <option value="other">Other</option>
          </select>
          <select name="fuelType" value={form.vehicleInfo.fuelType} onChange={handleVehicleChange} className="border rounded px-3 py-2">
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Electric</option>
            <option value="hybrid">Hybrid</option>
            <option value="lpg">LPG</option>
            <option value="other">Other</option>
          </select>
          <input name="registrationNumber" placeholder="Registration Number" value={form.vehicleInfo.registrationNumber} onChange={handleVehicleChange} className="border rounded px-3 py-2" />
          <input name="licenseExpiry" type="date" value={form.vehicleInfo.licenseExpiry} onChange={handleVehicleChange} className="border rounded px-3 py-2" />
          {form.vehicleInfo.licenseExpiry && new Date(form.vehicleInfo.licenseExpiry) < new Date() && (
            <span className="text-red-600 text-sm self-center">Expired</span>
          )}
          <input name="engineNumber" placeholder="Engine Number" value={form.vehicleInfo.engineNumber} onChange={handleVehicleChange} className="border rounded px-3 py-2" />
          <select name="vehiclePapers" value={form.vehicleInfo.vehiclePapers} onChange={handleVehicleChange} className="border rounded px-3 py-2">
            <option value="available">Papers Available</option>
            <option value="pending">Papers Pending</option>
            <option value="missing">Papers Missing</option>
          </select>
          <input name="vehicleStatus" placeholder="Vehicle Status" value={form.vehicleInfo.vehicleStatus} onChange={handleVehicleChange} className="border rounded px-3 py-2" />
          <div className="flex gap-2 items-center">
            <input name="stockNumber" placeholder="Stock Number" value={form.vehicleInfo.stockNumber} onChange={handleVehicleChange} className="border rounded px-3 py-2 flex-1" />
            <button onClick={handleStockGenerate} className="bg-gray-200 px-3 py-2 rounded hover:bg-gray-300">Generate</button>
          </div>
        </div>
      </section>

      {/* Inspection Sheet */}
      <section className="bg-white p-4 rounded shadow space-y-6">
        <h2 className="text-lg font-semibold">Inspection Sheet</h2>

        <div>
          <h3 className="font-medium mb-2">Advertisement Photos</h3>
          <div className="flex gap-2 mb-2">
            <button onClick={openCamera} className="bg-gray-200 px-3 py-2 rounded hover:bg-gray-300">Take Photo (Camera)</button>
            <label className="bg-gray-200 px-3 py-2 rounded hover:bg-gray-300 cursor-pointer">
              Upload from Gallery
              <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>

          </div>
          <div className="flex gap-2 flex-wrap mt-2">
            {form.advertisementPhotos.map((photo, idx) => (
              <div key={idx} className="relative">
                <img
                  src={photo}
                  alt={`Photo ${idx + 1}`}
                  className="h-20 w-20 object-cover rounded cursor-pointer"
                  onClick={() => setSelectedPhoto(photo)}
                />
                <button
                  onClick={() => handlePhotoDelete(idx)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Faults</h3>
          {form.faults.map((fault) => (
            <div key={fault.id} className="flex gap-2 mb-2">
              <input value={fault.description} onChange={(e) => handleFaultChange(fault.id, e.target.value)} className="border rounded px-3 py-2 flex-1" placeholder="Describe fault" />
              <button onClick={() => handleFaultDelete(fault.id)} className="bg-red-100 text-red-600 px-2 rounded hover:bg-red-200">✕</button>
            </div>
          ))}
          <button onClick={handleFaultAdd} className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">+ Add Fault</button>
        </div>

        <div>
          <h3 className="font-medium mb-2">Checklist</h3>
          {(['documentation', 'exterior', 'interior', 'engine_bay'] as const).map((category) => (
            <div key={category} className="mb-3">
              <h4 className="text-sm font-medium capitalize mb-1">{category.replace('_', ' ')}</h4>
              {form.checklist.filter((c) => c.category === category).map((item) => (
                <label key={item.id} className="flex items-center gap-2 py-1">
                  <input type="checkbox" checked={item.checked} onChange={() => handleChecklistToggle(item.id)} />
                  <span className="text-sm">{item.label}</span>
                </label>
              ))}
            </div>
          ))}
        </div>

        <div>
          <h3 className="font-medium mb-2">Inspection Score</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.keys(initialScore).map((category) => (
              <div key={category}>
                <label className="block text-sm capitalize">{category}</label>
                <input type="number" min="0" max="100" value={form.score[category as keyof InspectionScore] ?? ''} onChange={(e) => handleScoreChange(category as keyof InspectionScore, e.target.value)} className="border rounded px-3 py-2 w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-3">Location</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input placeholder="DMS coordinates" value={form.location.dms} onChange={(e) => handleLocationChange('dms', e.target.value)} className="border rounded px-3 py-2" />
          <input placeholder="Decimal (e.g., -25.7495, 28.1881)" value={form.location.decimal} onChange={(e) => handleLocationChange('decimal', e.target.value)} className="border rounded px-3 py-2" />
          <input placeholder="Bay (optional)" value={form.location.bay || ''} onChange={(e) => handleLocationChange('bay', e.target.value)} className="border rounded px-3 py-2" />
          <div className="flex gap-2">
            <button onClick={getGPS} className="bg-gray-200 px-3 py-2 rounded hover:bg-gray-300">Get GPS</button>
            <button onClick={showMap} className="bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200">Show Map</button>
            <button onClick={clearLocation} className="bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200">Clear</button>
          </div>
        </div>
      </section>

      {/* Financial Information */}
      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-3">Financial Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="number" placeholder="Purchase Price" value={form.financial.purchasePrice ?? ''} onChange={(e) => handleFinancialChange('purchasePrice', e.target.value)} className="border rounded px-3 py-2" />
          <input type="number" placeholder="Selling Price" value={form.financial.sellingPrice ?? ''} onChange={(e) => handleFinancialChange('sellingPrice', e.target.value)} className="border rounded px-3 py-2" />
          <input type="number" placeholder="Repair Cost" value={form.financial.repairCost ?? ''} onChange={(e) => handleFinancialChange('repairCost', e.target.value)} className="border rounded px-3 py-2" />
          <input type="number" placeholder="Transport Cost" value={form.financial.transportCost ?? ''} onChange={(e) => handleFinancialChange('transportCost', e.target.value)} className="border rounded px-3 py-2" />
          <div className="border rounded px-3 py-2 bg-gray-50">Estimated Profit: <strong>{form.financial.estimatedProfit ?? '—'}</strong></div>
          <div className="border rounded px-3 py-2 bg-gray-50">Expected Margin: <strong>{form.financial.expectedMargin ? `${form.financial.expectedMargin.toFixed(2)}%` : '—'}</strong></div>
          <input type="number" placeholder="Trade Value" value={form.financial.tradeValue ?? ''} onChange={(e) => handleFinancialChange('tradeValue', e.target.value)} className="border rounded px-3 py-2 col-span-full" />
        </div>
      </section>

      {/* Marketing & Advertisement */}
      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-3">Marketing & Advertisement</h2>
        <div className="space-y-4">
          <input placeholder="Listing Title" value={form.marketing.title} onChange={(e) => handleMarketingChange('title', e.target.value)} className="border rounded px-3 py-2 w-full" />
          <textarea placeholder="Description" value={form.marketing.description} onChange={(e) => handleMarketingChange('description', e.target.value)} className="border rounded px-3 py-2 w-full" rows={3} />
          <input placeholder="SEO Keywords (comma separated)" value={form.marketing.seoKeywords.join(', ')} onChange={(e) => setForm({ ...form, marketing: { ...form.marketing, seoKeywords: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) } })} className="border rounded px-3 py-2 w-full" />
          <input placeholder="Hashtags (comma separated)" value={form.marketing.hashtags.join(', ')} onChange={(e) => handleHashtagsChange(e.target.value)} className="border rounded px-3 py-2 w-full" />
          <div>
            <span className="block text-sm mb-1">Channels</span>
            {['facebook', 'instagram', 'whatsapp', 'twitter'].map((channel) => (
              <label key={channel} className="inline-flex items-center gap-2 mr-4">
                <input type="checkbox" checked={form.marketing.channels.includes(channel)} onChange={() => handleChannelsToggle(channel)} />
                {channel}
              </label>
            ))}
          </div>
        </div>
      </section>
    
      {showCamera && (
        <CameraModal
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {selectedPhoto && (
        <FullscreenPhotoModal src={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
</div>
  )
}
