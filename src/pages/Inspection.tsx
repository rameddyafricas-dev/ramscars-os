import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInspectionStore } from '../store/useInspectionStore'
import { useVehicleStore } from '../store/useVehicleStore'
import { decodeVIN } from '../utils/vinDecoder'
import { compressImage } from '../utils/image'
import { getModelSuggestions } from '../utils/makeModels'
import CameraModal from '../components/CameraModal'
import FullscreenPhotoModal from '../components/FullscreenPhotoModal'
import VideoModal from '../components/VideoModal'
import CollapsibleCard from '../components/CollapsibleCard'
import type { FuelType, Transmission } from '../types'
import type { Inspection, InspectionScore, FinancialInfo, Vehicle } from '../types'
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

const commonMakes = [
  'Toyota', 'Volkswagen', 'BMW', 'Mercedes-Benz', 'Ford', 'Hyundai', 'Kia',
  'Nissan', 'Mazda', 'Honda', 'Lexus', 'Audi', 'Land Rover', 'Jaguar',
  'Chevrolet', 'Renault', 'Peugeot', 'Citroen', 'Fiat', 'Suzuki',
  'Mitsubishi', 'Volvo', 'Subaru', 'Isuzu', 'Opel', 'Daihatsu', 'Tata',
  'Mahindra', 'Chery', 'SsangYong', 'Porsche', 'Ferrari', 'Maserati',
  'Alfa Romeo', 'Jeep', 'Chrysler', 'Dodge', 'GMC', 'Tesla', 'MINI', 'SEAT', 'Skoda', 'Saab'
]

const commonBodyTypes = [
  'Sedan', 'Hatchback', 'SUV', 'Pickup', 'Coupe', 'Convertible', 'Wagon',
  'Van', 'Minivan', 'MPV', 'Crossover', 'Truck'
]

const commonColors = [
  'Black', 'White', 'Silver', 'Grey', 'Blue', 'Red', 'Green', 'Yellow',
  'Orange', 'Brown', 'Beige', 'Gold', 'Purple', 'Burgundy', 'Champagne', 'Pearl White'
]

const mapDecodedFuelType = (engineType?: string): FuelType | undefined => {
  if (!engineType) return undefined
  const lower = engineType.toLowerCase()
  if (lower === 'petrol') return 'petrol'
  if (lower === 'diesel') return 'diesel'
  if (lower === 'electric') return 'electric'
  if (lower === 'hybrid') return 'hybrid'
  if (lower === 'lpg') return 'lpg'
  return 'other'
}

const mapDecodedTransmission = (transmission?: string): Transmission | undefined => {
  if (!transmission) return undefined
  const lower = transmission.toLowerCase()
  if (lower === 'automatic') return 'automatic'
  if (lower === 'manual') return 'manual'
  if (lower === 'cvt') return 'cvt'
  return 'other'
}

function ChecklistGroup({ title, items, totalSlots, filledSlots, onResult, onNote, onPhotoCapture, onPhotoPreview, onPhotoDelete, onAddPhotoSlot }: {
  title: string
  items: any[]
  totalSlots: number
  filledSlots: number
  onResult: (id: string, result: 'pass' | 'advisory' | 'fail' | 'na') => void
  onNote: (id: string, note: string) => void
  onPhotoCapture: (itemId: string, index: number) => void
  onPhotoPreview: (src: string) => void
  onPhotoDelete: (itemId: string, index: number, mode: 'photo' | 'slot') => void
  onAddPhotoSlot: (itemId: string, label: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState<{ type: 'photo' | 'slot'; itemId: string; index: number } | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPress = useRef(false)

  const startLongPress = (itemId: string, index: number) => {
    isLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true
      setConfirm({ type: 'slot', itemId, index })
    }, 600)
  }

  const startLongPressPhoto = (itemId: string, index: number) => {
    isLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true
      setConfirm({ type: 'photo', itemId, index })
    }, 600)
  }

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleDeleteConfirm = () => {
    if (!confirm) return
    onPhotoDelete(confirm.itemId, confirm.index, confirm.type)
    setConfirm(null)
  }

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left">
        <span className="text-sm font-semibold text-gray-800">{title} <span className="text-xs font-normal text-indigo-600">({filledSlots}/{totalSlots})</span></span>
        <span className="text-gray-500">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="p-3 space-y-3">
          {items.map((item: any) => (
            <div key={item.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                <div className="flex gap-1 flex-wrap">
                  <button onClick={() => onResult(item.id, 'pass')} className={`px-2 py-1 rounded-md text-xs font-medium ${item.result === 'pass' ? 'bg-green-600 text-white' : 'bg-white text-green-600 border border-green-300'}`}>Pass</button>
                  <button onClick={() => onResult(item.id, 'advisory')} className={`px-2 py-1 rounded-md text-xs font-medium ${item.result === 'advisory' ? 'bg-yellow-500 text-white' : 'bg-white text-yellow-600 border border-yellow-300'}`}>Advisory</button>
                  <button onClick={() => onResult(item.id, 'fail')} className={`px-2 py-1 rounded-md text-xs font-medium ${item.result === 'fail' ? 'bg-red-600 text-white' : 'bg-white text-red-600 border border-red-300'}`}>Fail</button>
                  <button onClick={() => onResult(item.id, 'na')} className={`px-2 py-1 rounded-md text-xs font-medium ${item.result === 'na' ? 'bg-black text-white' : 'bg-white text-black border border-gray-300'}`}>N/A</button>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
                <span title="Note">📝</span>
                <input value={item.note || ''} onChange={(e) => onNote(item.id, e.target.value)} placeholder="Add note" className="w-full text-sm bg-transparent focus:outline-none" />
              </div>

              {item.photoLabels && item.photoLabels.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.photoLabels.map((label: string, idx: number) => {
                    const photo = item.mediaIds?.[idx]
                    
                    return (
                      <div key={label + idx} className="relative">
                        {photo ? (
                          <div
                            className="relative"
                            onTouchStart={() => startLongPressPhoto(item.id, idx)}
                            onTouchEnd={cancelLongPress}
                            onMouseDown={() => startLongPressPhoto(item.id, idx)}
                            onMouseUp={cancelLongPress}
                            onMouseLeave={cancelLongPress}
                          >
                            <img
                              src={photo}
                              alt={label}
                              className="photo-thumb h-16 w-16"
                              onClick={() => {
                                if (isLongPress.current) {
                                  isLongPress.current = false
                                  return
                                }
                                onPhotoPreview(photo)
                              }}
                            />
                            <p className="text-[10px] text-gray-500 text-center mt-1 truncate w-16">{label}</p>
                            <button
                              onClick={() => setConfirm({ type: 'photo', itemId: item.id, index: idx })}
                              className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow"
                            >
                              ✕
                            </button>
                            {confirm?.type === 'photo' && confirm.itemId === item.id && confirm.index === idx && (
                              <div className="absolute inset-0 bg-black/60 rounded-lg flex flex-col items-center justify-center gap-1 z-10">
                                <button onClick={handleDeleteConfirm} className="bg-red-600 text-white text-xs px-2 py-1 rounded">Delete</button>
                                <button onClick={() => setConfirm(null)} className="bg-white text-gray-800 text-xs px-2 py-1 rounded">Cancel</button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="relative">
                            <button
                              onClick={() => {
                                if (isLongPress.current) {
                                  isLongPress.current = false
                                  return
                                }
                                onPhotoCapture(item.id, idx)
                              }}
                              onTouchStart={() => startLongPress(item.id, idx)}
                              onTouchEnd={cancelLongPress}
                              onMouseDown={() => startLongPress(item.id, idx)}
                              onMouseUp={cancelLongPress}
                              onMouseLeave={cancelLongPress}
                              className="h-16 w-16 border-2 border-dashed border-indigo-300 rounded-lg flex items-center justify-center text-indigo-500 text-xs text-center p-1 hover:bg-indigo-50"
                            >
                              {label}
                            </button>
                            {confirm?.type === 'slot' && confirm.itemId === item.id && confirm.index === idx && (
                              <div className="absolute inset-0 bg-black/60 rounded-lg flex flex-col items-center justify-center gap-1 z-10">
                                <button onClick={handleDeleteConfirm} className="bg-red-600 text-white text-xs px-2 py-1 rounded">Delete</button>
                                <button onClick={() => setConfirm(null)} className="bg-white text-gray-800 text-xs px-2 py-1 rounded">Cancel</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              <button
                onClick={() => {
                  const label = prompt('Photo label:')
                  if (label) onAddPhotoSlot(item.id, label)
                }}
                className="text-xs text-indigo-600 hover:underline"
              >
                + Add Photo
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


export default function InspectionPage() {
  const { activeInspection, loadInspections, newInspection, updateInspection, setActiveInspection } = useInspectionStore()
  const { vehicles, createVehicle, updateVehicle } = useVehicleStore()
  const [form, setForm] = useState<Inspection | null>(activeInspection)
  const [decodedVIN, setDecodedVIN] = useState<DecodedVIN | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [cameraTarget, setCameraTarget] = useState<string | null>(null)
  const [adSlotTarget, setAdSlotTarget] = useState<string | null>(null)
  const navigate = useNavigate()

  const modelSuggestions = form ? getModelSuggestions(form.vehicleInfo.make) : []

  useEffect(() => {
    const loadLatest = async () => {
      const currentState = useInspectionStore.getState()
      if (currentState.activeInspection) return
      await loadInspections()
      const latest = [...useInspectionStore.getState().inspections].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
      if (latest) setActiveInspection(latest.id)
    }
    loadLatest()
  }, [loadInspections, setActiveInspection])

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
        inspection.checklist.some((c) => c.result === 'pass' || c.result === 'advisory'),
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
    const timer = setTimeout(() => updateInspection(form), 500)
    return () => clearTimeout(timer)
  }, [form, activeInspection, updateInspection])

  const handleNewInspection = async () => {
    if (form) {
      await updateInspection(form)
      const existingVehicle = vehicles.find((v) => v.inspectionId === form.id)
      const vehicleData: Vehicle = {
        id: existingVehicle?.id || `veh_${Date.now()}`,
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
        photos: form.advertisementSlots?.filter((slot) => slot.photo).map((slot) => slot.photo) || form.advertisementPhotos,
        inspectionId: form.id,
        listingPrice: form.financial.sellingPrice ?? undefined,
        createdAt: existingVehicle?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      if (existingVehicle) await updateVehicle(vehicleData)
      else await createVehicle(vehicleData)
    }
    await newInspection()
  }

  if (!form) {
    return (
      <div className="p-6">
        <button onClick={handleNewInspection} className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700">New Inspection</button>
      </div>
    )
  }

  const handleOwnerChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, ownerInfo: { ...form.ownerInfo, [e.target.name]: e.target.value } })
  const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, vehicleInfo: { ...form.vehicleInfo, [e.target.name]: e.target.value } })

  const handleVINChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vin = e.target.value.toUpperCase()
    setForm({ ...form, vehicleInfo: { ...form.vehicleInfo, vin } })
    if (vin.length > 0) {
      const decoded = decodeVIN(vin)
      setDecodedVIN(decoded)
      if (decoded.make !== 'Unknown') {
        setForm((prev) => prev ? ({
          ...prev,
          vehicleInfo: {
            ...prev.vehicleInfo,
            make: decoded.make,
            model: decoded.model !== 'Unknown' ? decoded.model : '',
            year: decoded.year || prev.vehicleInfo.year,
            bodyType: decoded.bodyType || prev.vehicleInfo.bodyType,
            transmission: mapDecodedTransmission(decoded.transmission) || prev.vehicleInfo.transmission,
            fuelType: mapDecodedFuelType(decoded.engineType) || prev.vehicleInfo.fuelType,
          },
        }) : prev)
      } else if (decoded.year) {
        setForm((prev) => prev ? ({ ...prev, vehicleInfo: { ...prev.vehicleInfo, year: decoded.year } }) : prev)
      }
    } else {
      setDecodedVIN(null)
    }
  }

  const handleChecklistResult = (id: string, result: 'pass' | 'advisory' | 'fail' | 'na') => {
    setForm({ ...form, checklist: form.checklist.map((c) => (c.id === id ? { ...c, result, checked: result !== 'na' } : c)) })
  }
  const handleChecklistNote = (id: string, note: string) => {
    setForm({ ...form, checklist: form.checklist.map((c) => (c.id === id ? { ...c, note } : c)) })
  }
  const handleFaultAdd = () => setForm({ ...form, faults: [...form.faults, { id: `fault_${Date.now()}`, description: '' }] })
  const handleFaultChange = (id: string, value: string) => setForm({ ...form, faults: form.faults.map((f) => (f.id === id ? { ...f, description: value } : f)) })
  const handleFaultDelete = (id: string) => setForm({ ...form, faults: form.faults.filter((f) => f.id !== id) })
  const handleScoreChange = (category: keyof InspectionScore, value: string) => setForm({ ...form, score: { ...form.score, [category]: value === '' ? null : Number(value) } })
  const handleLocationChange = (field: 'dms' | 'decimal' | 'bay', value: string) => setForm({ ...form, location: { ...form.location, [field]: value } })
  const clearLocation = () => setForm({ ...form, location: { dms: '', decimal: '', gps: undefined, bay: '' } })
  const getGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setForm({ ...form, location: { ...form.location, decimal: `${lat.toFixed(6)}, ${lng.toFixed(6)}`, gps: { lat, lng } } })
      })
    }
  }
  const showMap = () => {
    if (form.location.gps) window.open(`https://www.google.com/maps?q=${form.location.gps.lat},${form.location.gps.lng}`, '_blank')
    else if (form.location.decimal) window.open(`https://www.google.com/maps?q=${form.location.decimal}`, '_blank')
  }
  const handleFinancialChange = (field: keyof FinancialInfo, value: string) => {
    const updatedFinancial = { ...form.financial, [field]: value === '' ? null : Number(value) }
    const purchase = updatedFinancial.purchasePrice || 0
    const selling = updatedFinancial.sellingPrice || 0
    const repair = updatedFinancial.repairCost || 0
    const transport = updatedFinancial.transportCost || 0
    if (purchase > 0 && selling > 0) {
      updatedFinancial.estimatedProfit = selling - purchase - repair - transport
      updatedFinancial.expectedMargin = (updatedFinancial.estimatedProfit / purchase) * 100
    }
    setForm({ ...form, financial: updatedFinancial })
  }
  const handleMarketingChange = (field: 'title' | 'description', value: string) => setForm({ ...form, marketing: { ...form.marketing, [field]: value } })
  const handleHashtagsChange = (value: string) => setForm({ ...form, marketing: { ...form.marketing, hashtags: value.split(',').map((s) => s.trim()).filter(Boolean) } })
  const handleChannelsToggle = (channel: string) => {
    const channels = form.marketing.channels.includes(channel) ? form.marketing.channels.filter((c) => c !== channel) : [...form.marketing.channels, channel]
    setForm({ ...form, marketing: { ...form.marketing, channels } })
  }

  const openAdCamera = (slotId: string) => {
    setCameraTarget(`ad:${slotId}:0`)
    setShowCamera(true)
  }

  const handleAdGallery = async (e: React.ChangeEvent<HTMLInputElement>, slotId: string) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const file = files[0]
    let dataUrl = ''

    if (slotId === 'adv_video') {
      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    } else {
      dataUrl = await compressImage(file)
    }

    setForm((prev) => prev ? ({
      ...prev,
      advertisementSlots: prev.advertisementSlots?.map((slot) => slot.id === slotId ? { ...slot, photo: dataUrl } : slot)
    }) : prev)
    setAdSlotTarget(null)
    e.target.value = ''
  }
  const openCameraForChecklist = (itemId: string, index: number) => {
    setCameraTarget(`check:${itemId}:${index}`)
    setShowCamera(true)
  }
  const handleAddPhotoSlot = (itemId: string, label: string) => {
    setForm((prev) => prev ? ({
      ...prev,
      checklist: prev.checklist.map((c) => c.id === itemId ? {
        ...c,
        photoLabels: [...(c.photoLabels || []), label],
        mediaIds: [...(c.mediaIds || []), ''],
      } : c)
    }) : prev)
  }
  
  const handleChecklistPhotoDelete = (itemId: string, index: number, mode: 'photo' | 'slot') => {
    setForm((prev) => prev ? ({
      ...prev,
      checklist: prev.checklist.map((c) => {
        if (c.id !== itemId) return c
        const photoLabels = [...(c.photoLabels || [])]
        const mediaIds = [...(c.mediaIds || [])]
        if (mode === 'photo') {
          // clear only the photo, keep slot
          mediaIds[index] = ''
        } else {
          // delete entire slot (allowed for all slots now)
          photoLabels.splice(index, 1)
          mediaIds.splice(index, 1)
        }
        return { ...c, photoLabels, mediaIds }
      })
    }) : prev)
  }

  const handleCameraCapture = (dataUrl: string) => {
    if (cameraTarget) {
      const parts = cameraTarget.split(':')
      if (parts.length >= 3) {
        const targetType = parts[0]
        const targetId = parts[1]
        const idx = Number(parts[2])

        if (targetType === 'ad') {
          // advertisement slot
          setForm((prev) => prev ? ({
            ...prev,
            advertisementSlots: prev.advertisementSlots?.map((slot) => slot.id === targetId ? { ...slot, photo: dataUrl } : slot)
          }) : prev)
          setAdSlotTarget(null)
        } else if (targetType === 'check') {
          // checklist item
          setForm((prev) => prev ? ({
            ...prev,
            checklist: prev.checklist.map((c) => {
              if (c.id !== targetId) return c
              const media = [...(c.mediaIds || [])]
              media[idx] = dataUrl
              return { ...c, mediaIds: media }
            })
          }) : prev)
        }
      }
      setCameraTarget(null)
      setShowCamera(false)
    } else {
      setForm((prev) => prev ? { ...prev, advertisementPhotos: [...prev.advertisementPhotos, dataUrl] } : prev)
      setShowCamera(false)
    }
  }

  const allChecklistItems = form ? form.checklist : [];
  const overallTotalSlots = allChecklistItems.reduce((sum, item) => sum + (item.photoLabels?.length || 0), 0);
  const overallFilledSlots = allChecklistItems.reduce((sum, item) => sum + (item.mediaIds?.filter((m) => m && m.trim() !== '').length || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-4 p-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Inspection</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/inventory')}
            className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-50"
          >
            ← Inventory
          </button>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Inspection['status'] })} className="bg-white border border-gray-300 text-gray-800 px-4 py-2.5 rounded-xl shadow-sm">
            <option value="draft">Draft</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <button onClick={handleNewInspection} className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center" title="New Inspection">+</button>
        </div>
      </div>

      {/* Inspection progress summary */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Inspection Progress</span>
          <span className="text-sm font-bold text-indigo-600">{form.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all" style={{ width: `${form.progress}%` }} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
          <div className="bg-gray-50 p-3 rounded-xl">
            <p className="text-xs text-gray-500">Vehicle</p>
            <p className="font-semibold text-gray-800 truncate">
              {form.vehicleInfo.year && form.vehicleInfo.make
                ? `${form.vehicleInfo.year} ${form.vehicleInfo.make} ${form.vehicleInfo.model}`
                : 'Not set'}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl">
            <p className="text-xs text-gray-500">Stock</p>
            <p className="font-semibold text-gray-800 truncate">{form.vehicleInfo.stockNumber || '—'}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl">
            <p className="text-xs text-gray-500">VIN</p>
            <p className="font-semibold text-gray-800 truncate">{form.vehicleInfo.vin || '—'}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl">
            <p className="text-xs text-gray-500">Status</p>
            <p className="font-semibold text-gray-800 capitalize">{form.status.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      <CollapsibleCard title="Owner Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="name" placeholder="Owner Name" value={form.ownerInfo.name} onChange={handleOwnerChange} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <input name="contactNumber" placeholder="Contact Number" value={form.ownerInfo.contactNumber} onChange={handleOwnerChange} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <input name="email" placeholder="Email" value={form.ownerInfo.email} onChange={handleOwnerChange} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <input name="idNumber" placeholder="ID Number" value={form.ownerInfo.idNumber} onChange={handleOwnerChange} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <input name="physicalAddress" placeholder="Physical Address" value={form.ownerInfo.physicalAddress} onChange={handleOwnerChange} className="border border-gray-300 rounded-xl px-4 py-2.5 col-span-full" />
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="Vehicle Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select name="vehicleType" value={form.vehicleInfo.vehicleType} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5"><option value="runner">Runner</option><option value="non-runner">Non-Runner</option></select>
          <input name="vin" placeholder="VIN" value={form.vehicleInfo.vin} onChange={handleVINChange} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          {decodedVIN && (
            <div className="col-span-full bg-gray-50 p-3 rounded-xl text-sm space-y-1">
              <p><span className="font-medium">Make:</span> {decodedVIN.make}</p>
              <p><span className="font-medium">Model:</span> {decodedVIN.model !== 'Unknown' ? decodedVIN.model : 'Not detected'}</p>
              <p><span className="font-medium">Country:</span> {decodedVIN.country} ({decodedVIN.region})</p>
              <p><span className="font-medium">Year:</span> {decodedVIN.year || 'Unknown'}</p>
              {decodedVIN.bodyType && <p><span className="font-medium">Body:</span> {decodedVIN.bodyType}</p>}
              {decodedVIN.engineType && <p><span className="font-medium">Engine:</span> {decodedVIN.engineType}</p>}
              {decodedVIN.transmission && <p><span className="font-medium">Transmission:</span> {decodedVIN.transmission}</p>}
            </div>
          )}
          <input name="make" placeholder="Make" value={form.vehicleInfo.make} onChange={handleVehicleChange} list="make-suggestions" className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <datalist id="make-suggestions">{commonMakes.map((m) => <option key={m} value={m} />)}</datalist>
          <input name="model" placeholder="Model" value={form.vehicleInfo.model} onChange={handleVehicleChange} list="model-suggestions" className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <datalist id="model-suggestions">{modelSuggestions.map((m) => <option key={m} value={m} />)}</datalist>
          <input name="year" placeholder="Year" value={form.vehicleInfo.year} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <input name="color" placeholder="Color" value={form.vehicleInfo.color} onChange={handleVehicleChange} list="color-suggestions" className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <datalist id="color-suggestions">{commonColors.map((c) => <option key={c} value={c} />)}</datalist>
          <input name="bodyType" placeholder="Body Type" value={form.vehicleInfo.bodyType} onChange={handleVehicleChange} list="body-type-suggestions" className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <datalist id="body-type-suggestions">{commonBodyTypes.map((b) => <option key={b} value={b} />)}</datalist>
          <input name="mileage" placeholder="Mileage" value={form.vehicleInfo.mileage} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <select name="transmission" value={form.vehicleInfo.transmission} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5"><option value="manual">Manual</option><option value="automatic">Automatic</option><option value="cvt">CVT</option><option value="other">Other</option></select>
          <select name="fuelType" value={form.vehicleInfo.fuelType} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5"><option value="petrol">Petrol</option><option value="diesel">Diesel</option><option value="electric">Electric</option><option value="hybrid">Hybrid</option><option value="lpg">LPG</option><option value="other">Other</option></select>
          <input name="registrationNumber" placeholder="Registration Number" value={form.vehicleInfo.registrationNumber} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <input name="licenseExpiry" type="date" value={form.vehicleInfo.licenseExpiry} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          {form.vehicleInfo.licenseExpiry && new Date(form.vehicleInfo.licenseExpiry) < new Date() && <span className="text-red-600 text-sm self-center">Expired</span>}
          <input name="engineNumber" placeholder="Engine Number" value={form.vehicleInfo.engineNumber} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <select name="vehiclePapers" value={form.vehicleInfo.vehiclePapers} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5"><option value="available">Papers Available</option><option value="pending">Papers Pending</option><option value="missing">Papers Missing</option></select>
          <input name="vehicleStatus" placeholder="Vehicle Status" value={form.vehicleInfo.vehicleStatus} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <input name="stockNumber" placeholder="Stock Number" value={form.vehicleInfo.stockNumber} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5 bg-gray-50" />
        </div>
      </CollapsibleCard>

      <CollapsibleCard title={`Faults (${form.faults.length})`}>
        {form.faults.map((fault) => (
          <div key={fault.id} className="flex gap-2 mb-2">
            <input value={fault.description} onChange={(e) => handleFaultChange(fault.id, e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5 flex-1" placeholder="Describe fault" />
            <button onClick={() => handleFaultDelete(fault.id)} className="bg-red-50 text-red-600 px-3 rounded-xl">✕</button>
          </div>
        ))}
        <button onClick={handleFaultAdd} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl hover:bg-indigo-100">+ Add Fault</button>
      </CollapsibleCard>

      <CollapsibleCard title={`Advertisement Photos (${form.advertisementSlots?.filter((s) => s.photo).length || 0}/${form.advertisementSlots?.length || 0})`}>
        <div className="flex flex-wrap gap-3">
          {form.advertisementSlots?.map((slot) => (
            <div key={slot.id} className="relative">
              {slot.photo ? (
                <div className="relative group">
                  {slot.id === 'adv_video' ? (
                    <video
                      src={slot.photo}
                      className="photo-thumb h-20 w-20 object-cover cursor-pointer"
                      onClick={() => setAdSlotTarget(slot.id)}
                      controls={false}
                      muted
                    />
                  ) : (
                    <img
                      src={slot.photo}
                      alt={slot.label}
                      className="photo-thumb h-20 w-20"
                      onClick={() => setAdSlotTarget(slot.id)}
                    />
                  )}
                  <p className="text-[10px] text-gray-500 text-center mt-1 truncate w-20">{slot.label}</p>
                </div>
              ) : (
                <button
                  onClick={() => setAdSlotTarget(slot.id)}
                  className="h-20 w-20 border-2 border-dashed border-indigo-300 rounded-xl flex items-center justify-center text-indigo-500 text-xs text-center p-1 hover:bg-indigo-50"
                >
                  {slot.label}
                </button>
              )}

              {adSlotTarget === slot.id && (
                <div className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center gap-1 z-10 p-1">
                  {slot.id !== 'adv_video' && (
                    <button
                      onClick={() => openAdCamera(slot.id)}
                      className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg w-full"
                    >
                      Camera
                    </button>
                  )}
                  <label className="bg-white text-gray-800 text-xs px-3 py-1.5 rounded-lg w-full text-center cursor-pointer">
                    Gallery
                    <input
                      type="file"
                      accept={slot.id === 'adv_video' ? 'video/*' : 'image/*'}
                      className="hidden"
                      onChange={(e) => handleAdGallery(e, slot.id)}
                    />
                  </label>
                  {slot.id === 'adv_video' && slot.photo && (
                    <button
                      onClick={() => {
                        setSelectedVideo(slot.photo)
                        setAdSlotTarget(null)
                      }}
                      className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg w-full"
                    >
                      Preview
                    </button>
                  )}
                  <button
                    onClick={() => setAdSlotTarget(null)}
                    className="text-white text-xs mt-1 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CollapsibleCard>

      <CollapsibleCard title={`Checklist (${overallFilledSlots}/${overallTotalSlots})`}>
  {(['documentation','exterior','interior','engine_bay','underbody'] as const).map((category) => {
    const titleMap: Record<string, string> = {
      documentation: 'Legal Documents',
      exterior: 'Exterior',
      interior: 'Interior',
      engine_bay: 'Engine Bay & Drive Train',
      underbody: 'Underbody & Suspension',
    };
    const categoryItems = form.checklist.filter((c) => c.category === category);
    const total = categoryItems.reduce((sum, item) => sum + (item.photoLabels?.length || 0), 0);
    const filled = categoryItems.reduce((sum, item) => sum + (item.mediaIds?.filter((m) => m && m.trim() !== '').length || 0), 0);
    return (
      <ChecklistGroup
        key={category}
        title={titleMap[category]}
        items={categoryItems}
        totalSlots={total}
        filledSlots={filled}
        onResult={handleChecklistResult}
        onNote={handleChecklistNote}
        onPhotoCapture={openCameraForChecklist}
        onPhotoPreview={setSelectedPhoto}
        onPhotoDelete={handleChecklistPhotoDelete}
        onAddPhotoSlot={handleAddPhotoSlot}
      />
    );
  })}
</CollapsibleCard>

      <CollapsibleCard title="Inspection Score">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.keys(initialScore).map((category) => (
            <div key={category}>
              <label className="block text-sm capitalize">{category}</label>
              <input type="number" min="0" max="100" value={form.score[category as keyof InspectionScore] ?? ''} onChange={(e) => handleScoreChange(category as keyof InspectionScore, e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2 w-full" />
            </div>
          ))}
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="Location">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input placeholder="DMS coordinates" value={form.location.dms} onChange={(e) => handleLocationChange('dms', e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <input placeholder="Decimal" value={form.location.decimal} onChange={(e) => handleLocationChange('decimal', e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <input placeholder="Bay" value={form.location.bay || ''} onChange={(e) => handleLocationChange('bay', e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <div className="flex gap-3">
            <button onClick={getGPS} className="icon-btn" title="Get GPS"><svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="12" r="3"/></svg></button>
            <button onClick={showMap} className="icon-btn" title="Show Map"><svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg></button>
            <button onClick={clearLocation} className="icon-btn" title="Clear"><svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
          </div>
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="Financial Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="number" placeholder="Purchase Price" value={form.financial.purchasePrice ?? ''} onChange={(e) => handleFinancialChange('purchasePrice', e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <input type="number" placeholder="Selling Price" value={form.financial.sellingPrice ?? ''} onChange={(e) => handleFinancialChange('sellingPrice', e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <input type="number" placeholder="Repair Cost" value={form.financial.repairCost ?? ''} onChange={(e) => handleFinancialChange('repairCost', e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <input type="number" placeholder="Transport Cost" value={form.financial.transportCost ?? ''} onChange={(e) => handleFinancialChange('transportCost', e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <div className="border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50">Estimated Profit: <strong>{form.financial.estimatedProfit ?? '—'}</strong></div>
          <div className="border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50">Expected Margin: <strong>{form.financial.expectedMargin ? `${form.financial.expectedMargin.toFixed(2)}%` : '—'}</strong></div>
          <input type="number" placeholder="Trade Value" value={form.financial.tradeValue ?? ''} onChange={(e) => handleFinancialChange('tradeValue', e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5 col-span-full" />
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="Marketing & Advertisement">
        <div className="space-y-4">
          <input placeholder="Listing Title" value={form.marketing.title} onChange={(e) => handleMarketingChange('title', e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5 w-full" />
          <textarea placeholder="Description" value={form.marketing.description} onChange={(e) => handleMarketingChange('description', e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5 w-full" rows={3} />
          <input placeholder="SEO Keywords" value={form.marketing.seoKeywords.join(', ')} onChange={(e) => setForm({ ...form, marketing: { ...form.marketing, seoKeywords: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) } })} className="border border-gray-300 rounded-xl px-4 py-2.5 w-full" />
          <input placeholder="Hashtags" value={form.marketing.hashtags.join(', ')} onChange={(e) => handleHashtagsChange(e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5 w-full" />
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">Channels</span>
            <div className="flex flex-wrap gap-3">
              {[
                { id: 'facebook', label: 'Facebook', icon: '📘', color: 'bg-blue-50 text-blue-700' },
                { id: 'instagram', label: 'Instagram', icon: '📸', color: 'bg-pink-50 text-pink-700' },
                { id: 'whatsapp', label: 'WhatsApp', icon: '💬', color: 'bg-green-50 text-green-700' },
                { id: 'twitter', label: 'Twitter', icon: '🐦', color: 'bg-sky-50 text-sky-700' },
              ].map((channel) => (
                <button key={channel.id} type="button" onClick={() => handleChannelsToggle(channel.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${form.marketing.channels.includes(channel.id) ? channel.color + ' border-current' : 'bg-white border-gray-200 text-gray-500'}`}>
                  <span>{channel.icon}</span>
                  <span className="text-sm font-medium">{channel.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleCard>

      {showCamera && <CameraModal onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />}
      {selectedPhoto && <FullscreenPhotoModal src={selectedPhoto} onClose={() => setSelectedPhoto(null)} />}
      {selectedVideo && <VideoModal src={selectedVideo} onClose={() => setSelectedVideo(null)} />}
    </div>
  )
}
