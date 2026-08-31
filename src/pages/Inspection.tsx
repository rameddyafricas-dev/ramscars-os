import { useEffect, useState, useRef } from 'react'
import { generateAutoListing } from '../utils/autoListing'
import { useInspectionStore } from '../store/useInspectionStore'
import { useVehicleStore } from '../store/useVehicleStore'
import { decodeVIN } from '../services/vinEngine'
import { compressImage } from '../utils/image'
import { getModelSuggestions } from '../utils/makeModels'
import CameraModal from '../components/CameraModal'
import FullscreenPhotoModal from '../components/FullscreenPhotoModal'
import VideoModal from '../components/VideoModal'
import CollapsibleCard from '../components/CollapsibleCard'
import type { Inspection, InspectionScore, FinancialInfo, Vehicle } from '../types'
import type { DecodedVIN } from '../services/vinTypes'

function debounce<A extends any[]>(fn: (...args: A) => void, delay = 300) {
  let timer: ReturnType<typeof setTimeout> | null;
  return (...args: A) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

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

function ChecklistGroup({ title, items, totalSlots, filledSlots, onResult, onNote, onPhotoCapture, onPhotoPreview, onPhotoDelete, onAddPhotoSlot, onGallery }: {
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
  onGallery: (itemId: string, index: number, file: File) => void
}) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState<{ type: 'photo' | 'slot'; itemId: string; index: number } | null>(null)
  const [slotTarget, setSlotTarget] = useState<{ itemId: string; index: number } | null>(null)
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
                    const isImage = photo && photo.startsWith('data:image')

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
                            {isImage ? (
                              <img src={photo} alt={label} className="photo-thumb h-16 w-16" onClick={() => setSlotTarget({ itemId: item.id, index: idx })} />
                            ) : (
                              <div
                                className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center text-lg cursor-pointer"
                                onClick={() => window.open(photo, '_blank')}
                                title="Open document"
                              >📄</div>
                            )}
                            <p className="text-[10px] text-gray-500 text-center mt-1 truncate w-16">{label}</p>
                            <button onClick={() => setConfirm({ type: 'photo', itemId: item.id, index: idx })} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow">✕</button>
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
                              onClick={() => setSlotTarget({ itemId: item.id, index: idx })}
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

                        {slotTarget && slotTarget.itemId === item.id && slotTarget.index === idx && (
                          <div className="absolute inset-0 bg-black/60 rounded-lg flex flex-col items-center justify-center gap-1 z-20 p-1">
                            <button onClick={() => { onPhotoCapture(item.id, idx); setSlotTarget(null) }} className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg w-full">Camera</button>
                            <label className="bg-white text-gray-800 text-xs px-3 py-1.5 rounded-lg w-full text-center cursor-pointer">
                              Gallery
                              <input type="file" accept="image/*,application/pdf,.doc,.docx" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) onGallery(item.id, idx, file); setSlotTarget(null); e.target.value = '' }} />
                            </label>
                            {photo && isImage && (
                              <button onClick={() => { onPhotoPreview(photo); setSlotTarget(null) }} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg w-full">Preview</button>
                            )}
                            {photo && !isImage && (
                              <button onClick={() => { window.open(photo, '_blank'); setSlotTarget(null) }} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg w-full">Open</button>
                            )}
                            <button onClick={() => setSlotTarget(null)} className="text-white text-xs mt-1 hover:underline">Cancel</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              <button onClick={() => { const label = prompt('Photo label:'); if (label) onAddPhotoSlot(item.id, label) }} className="text-xs text-indigo-600 hover:underline">+ Add Photo</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
export default function InspectionPage() {
  const { activeInspection, loadInspections, newInspection, updateInspection, setActiveInspection } = useInspectionStore()
  const { vehicles, createVehicle, updateVehicle, loadVehicles } = useVehicleStore()
  const [form, setForm] = useState<Inspection | null>(activeInspection)
  const [decodedVIN, setDecodedVIN] = useState<DecodedVIN | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [cameraTarget, setCameraTarget] = useState<string | null>(null)
  const [adSlotTarget, setAdSlotTarget] = useState<string | null>(null)

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
    loadVehicles()
  }, [loadInspections, setActiveInspection, loadVehicles])

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

  useEffect(() => {
    if (!form || !form.vehicleInfo.make || !form.vehicleInfo.model) return;
    const auto = generateAutoListing(form.vehicleInfo, form.marketing);
    if (auto.title !== form.marketing.title || auto.description !== form.marketing.description || auto.hashtags.join(',') !== form.marketing.hashtags.join(',') || auto.seoKeywords.join(',') !== form.marketing.seoKeywords.join(',')) {
      setForm((prev) => prev ? { ...prev, marketing: auto } : prev)
    }
  }, [form?.vehicleInfo.make, form?.vehicleInfo.model, form?.vehicleInfo.year, form?.vehicleInfo.bodyType, form?.vehicleInfo.fuelType, form?.vehicleInfo.mileage, form?.vehicleInfo.transmission, form?.vehicleInfo.color])

  useEffect(() => {
    if (!form || !form.id) return;
    const timer = setTimeout(async () => {
      const existingVehicle = useVehicleStore.getState().vehicles.find((v) => v.inspectionId === form.id);
      if (!form.vehicleInfo.make && !form.vehicleInfo.model && !form.vehicleInfo.vin) return;

      const now = new Date().toISOString();
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
        status: existingVehicle?.status || 'available',
        notes: existingVehicle?.notes || '',
        stockNumber: form.vehicleInfo.stockNumber,
        photos: form.advertisementSlots && form.advertisementSlots.length > 0 ? form.advertisementSlots.filter((slot) => slot.photo).map((slot) => slot.photo) : form.advertisementPhotos,
        inspectionId: form.id,
        listingPrice: form.financial.sellingPrice ?? undefined,
        createdAt: existingVehicle?.createdAt || now,
        updatedAt: now,
      };

      if (existingVehicle) {
        await updateVehicle(vehicleData);
      } else {
        await createVehicle(vehicleData);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [form, createVehicle, updateVehicle]);

  const saveCurrentInspectionToInventory = async () => {
    if (!form) return;
    await updateInspection(form);
    const existingVehicle = vehicles.find((v) => v.inspectionId === form.id);
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
      status: existingVehicle?.status || 'available',
      notes: '',
      ownerName: form.ownerInfo.name,
      stockNumber: form.vehicleInfo.stockNumber,
      photos: form.advertisementSlots?.filter((slot) => slot.photo).map((slot) => slot.photo) || form.advertisementPhotos,
      inspectionId: form.id,
      listingPrice: form.financial.sellingPrice ?? undefined,
      createdAt: existingVehicle?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (existingVehicle) await updateVehicle(vehicleData);
    else await createVehicle(vehicleData);
  };

  const handleSaveInspection = async () => {
    await saveCurrentInspectionToInventory();
  };

  const isCurrentInspectionEmpty = () => {
    if (!form) return true;
    const hasOwner = form.ownerInfo.name || form.ownerInfo.contactNumber || form.ownerInfo.idNumber || form.ownerInfo.email;
    const hasVehicle = form.vehicleInfo.make || form.vehicleInfo.model || form.vehicleInfo.vin || form.vehicleInfo.registrationNumber || form.vehicleInfo.engineNumber;
    const hasPhotos = (form.advertisementSlots && form.advertisementSlots.some((slot) => slot.photo)) || form.advertisementPhotos.length > 0;
    const hasFaults = form.faults.length > 0;
    const hasChecklist = form.checklist.some((item) => item.result || item.note || (item.mediaIds && item.mediaIds.some((media) => media)));
    return !(hasOwner || hasVehicle || hasPhotos || hasFaults || hasChecklist);
  };

  const handleNewInspection = async () => {
    if (!form) {
      // No current inspection yet, create the first one
      await newInspection();
      return;
    }
    if (isCurrentInspectionEmpty()) {
      alert('Current inspection is empty. Please add some data before starting a new inspection.');
      return;
    }
    await saveCurrentInspectionToInventory();
    await newInspection();
  };

  if (!form) {
    return (
      <div className="p-6">
        <button onClick={handleNewInspection} className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700">New Inspection</button>
      </div>
    )
  }

  const handleOwnerChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, ownerInfo: { ...form.ownerInfo, [e.target.name]: e.target.value } })
  const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, vehicleInfo: { ...form.vehicleInfo, [e.target.name]: e.target.value } })

  const handleVINChange = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    const vin = e.target.value.toUpperCase()
    setForm({ ...form, vehicleInfo: { ...form.vehicleInfo, vin } })
    if (vin.length > 0) {
      const decoded = decodeVIN(vin)
      setDecodedVIN(decoded)
      if (decoded.manufacturer.value !== 'Unknown') {
        setForm((prev) => prev ? ({
          ...prev,
          vehicleInfo: {
            ...prev.vehicleInfo,
            make: decoded.manufacturer.value,
            year: decoded.modelYear.value !== 'Unknown' ? decoded.modelYear.value : prev.vehicleInfo.year,
          },
        }) : prev)
      } else if (decoded.modelYear.value !== 'Unknown') {
        setForm((prev) => prev ? ({ ...prev, vehicleInfo: { ...prev.vehicleInfo, year: decoded.modelYear.value } }) : prev)
      }
    } else {
      setDecodedVIN(null)
    }
  })

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
  const getGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setForm({ ...form, location: { ...form.location, decimal: `${lat.toFixed(6)}, ${lng.toFixed(6)}`, gps: { lat, lng } } });
      });
    }
  };

  const showCoordinates = () => {
    if (form.location.decimal) {
      window.open(`https://www.google.com/maps?q=${form.location.decimal}`, '_blank');
    }
  };

  const showMap = () => {
    if (form.location.gps) {
      window.open(`https://www.google.com/maps?q=${form.location.gps.lat},${form.location.gps.lng}`, '_blank');
    }
  };

  const clearLocation = () => {
    if (window.confirm('Clear location?')) {
      setForm({ ...form, location: { dms: '', decimal: '', gps: undefined, bay: '' } })
    }
  };

  const recalcFinancial = (financial: FinancialInfo): FinancialInfo => {
    const purchase = financial.purchasePrice || 0;
    const selling = financial.sellingPrice || 0;
    const additionalTotal = (financial.additionalCosts || []).reduce((sum, c) => sum + (c.amount || 0), 0);
    if (purchase > 0 && selling > 0) {
      financial.estimatedProfit = selling - purchase - additionalTotal;
      financial.expectedMargin = (financial.estimatedProfit / purchase) * 100;
    } else {
      financial.estimatedProfit = null;
      financial.expectedMargin = null;
    }
    return financial;
  };

  const handleFinancialChange = (field: keyof FinancialInfo, value: string) => {
    setForm((prev) => prev ? {
      ...prev,
      financial: recalcFinancial({
        ...prev.financial,
        [field]: value === '' ? null : Number(value),
      })
    } : prev);
  };

  const handleAddAdditionalCost = () => {
    const label = window.prompt('Specify cost label:');
    if (!label) return;
    const amountStr = window.prompt('Amount:');
    const amount = Number(amountStr);
    if (isNaN(amount)) return;
    const newCost = { label, amount };
    setForm((prev) => prev ? {
      ...prev,
      financial: recalcFinancial({
        ...prev.financial,
        additionalCosts: [...(prev.financial.additionalCosts || []), newCost],
      })
    } : prev);
  };

  const handleRemoveAdditionalCost = (index: number) => {
    if (!window.confirm('Remove this cost?')) return;
    setForm((prev) => prev ? {
      ...prev,
      financial: recalcFinancial({
        ...prev.financial,
        additionalCosts: prev.financial.additionalCosts?.filter((_, i) => i !== index),
      })
    } : prev);
  }

  const handleDeleteAdMedia = (slotId: string) => {
    setForm((prev) => prev ? ({
      ...prev,
      advertisementSlots: prev.advertisementSlots?.map((slot) =>
        slot.id === slotId ? { ...slot, photo: '' } : slot
      )
    }) : prev)
    setAdSlotTarget(null)
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
  const handleChecklistGallery = async (itemId: string, index: number, file: File) => {
    let dataUrl = ''
    if (file.type.startsWith('image/')) {
      dataUrl = await compressImage(file)
    } else {
      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    }
    setForm((prev) => prev ? ({
      ...prev,
      checklist: prev.checklist.map((c) => {
        if (c.id !== itemId) return c
        const media = [...(c.mediaIds || [])]
        while (media.length <= index) media.push('')
        media[index] = dataUrl
        return { ...c, mediaIds: media }
      })
    }) : prev)
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
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Inspection['status'] })} className="bg-white border border-gray-300 text-gray-800 px-4 py-2.5 rounded-xl shadow-sm">
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <button onClick={handleSaveInspection} className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700">Save</button>
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
          <select name="vehicleType" value={form.vehicleInfo.vehicleType} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5">
            <option value="runner">Runner</option>
            <option value="non-runner">Non-Runner</option>
          </select>
          <input name="vin" placeholder="VIN" value={form.vehicleInfo.vin} onChange={handleVINChange} className="border border-gray-300 rounded-xl px-4 py-2.5" />

          {decodedVIN && (
            <div className="col-span-full bg-gray-50 p-3 rounded-xl text-sm space-y-1">
              <p><span className="font-medium">VIN Type:</span> {decodedVIN.vinType}</p>
              <p><span className="font-medium">Status:</span> {decodedVIN.vinStatus}</p>
              <p><span className="font-medium">Check Digit:</span> {decodedVIN.validation.checksumApplicable ? (decodedVIN.validation.checksumValid ? 'Valid' : 'Failed') : 'Not Applicable'}</p>
              <p><span className="font-medium">Manufacturer:</span> {decodedVIN.manufacturer.value} (Confidence: {decodedVIN.manufacturer.level}, Score: {decodedVIN.manufacturer.score})</p>
              <p><span className="font-medium">Country:</span> {decodedVIN.country.value} ({decodedVIN.region})</p>
              <p><span className="font-medium">Model Year:</span> {decodedVIN.modelYear.value}{decodedVIN.modelYearCandidates.length > 1 ? ' (Candidates: ' + decodedVIN.modelYearCandidates.join(', ') + ')' : ''}</p>
              {decodedVIN.model && decodedVIN.model.value !== 'Unknown' && <p><span className="font-medium">Model:</span> {decodedVIN.model.value}</p>}
              {decodedVIN.engine && decodedVIN.engine.value !== 'Unknown' && <p><span className="font-medium">Engine:</span> {decodedVIN.engine.value}</p>}
              {decodedVIN.bodyStyle && decodedVIN.bodyStyle.value !== 'Unknown' && <p><span className="font-medium">Body:</span> {decodedVIN.bodyStyle.value}</p>}
              {decodedVIN.transmission && decodedVIN.transmission.value !== 'Unknown' && <p><span className="font-medium">Transmission:</span> {decodedVIN.transmission.value}</p>}
              {decodedVIN.fuel && decodedVIN.fuel.value !== 'Unknown' && <p><span className="font-medium">Fuel:</span> {decodedVIN.fuel.value}</p>}
              <p className="text-xs text-gray-500 mt-1">Decoder v{decodedVIN.decoderVersion} | DB v{decodedVIN.databaseVersion}</p>
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
          <select name="transmission" value={form.vehicleInfo.transmission} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5">
            <option value="manual">Manual</option>
            <option value="automatic">Automatic</option>
            <option value="cvt">CVT</option>
            <option value="other">Other</option>
          </select>
          <select name="fuelType" value={form.vehicleInfo.fuelType} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5">
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Electric</option>
            <option value="hybrid">Hybrid</option>
            <option value="lpg">LPG</option>
            <option value="other">Other</option>
          </select>
          <input name="registrationNumber" placeholder="Registration Number" value={form.vehicleInfo.registrationNumber} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Licence Disc Validity</label>
            <input name="licenseExpiry" type="date" value={form.vehicleInfo.licenseExpiry} onChange={handleVehicleChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" />
            {form.vehicleInfo.licenseExpiry && (() => {
              const expiry = new Date(form.vehicleInfo.licenseExpiry);
              const now = new Date();
              const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const isExpired = diffDays < 0;
              const isExpiringSoon = diffDays >= 0 && diffDays <= 30;
              return (
                <p className={`text-xs mt-1 font-medium ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-green-600'}`}>
                  {isExpired ? `Expired ${Math.abs(diffDays)} day(s) ago` : isExpiringSoon ? `Expires in ${diffDays} day(s)` : `Valid for ${diffDays} day(s)`}
                </p>
              );
            })()}
          </div>

          <input name="engineNumber" placeholder="Engine Number" value={form.vehicleInfo.engineNumber} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <select name="vehiclePapers" value={form.vehicleInfo.vehiclePapers} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5">
            <option value="available">Papers Available</option>
            <option value="pending">Papers Pending</option>
            <option value="missing">Papers Missing</option>
          </select>
          <input name="vehicleStatus" placeholder="Vehicle Status" value={form.vehicleInfo.vehicleStatus} onChange={handleVehicleChange} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <input name="stockNumber" placeholder="Stock Number" value={form.vehicleInfo.stockNumber} readOnly className="border border-gray-300 rounded-xl px-4 py-2.5 bg-gray-100 text-gray-700 cursor-not-allowed" />
        </div>
      </CollapsibleCard>


      <CollapsibleCard title={`Faults (${form.faults.length})`}>
        {form.faults.map((fault) => (
          <div key={fault.id} className="flex gap-2 mb-2">
            <input value={fault.description} onChange={(e) => handleFaultChange(fault.id, e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5 flex-1" placeholder="Describe fault" />
            <button onClick={() => { if (window.confirm('Delete this fault?')) handleFaultDelete(fault.id) }} className="bg-red-50 text-red-600 px-3 rounded-xl">✕</button>
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
                  {slot.photo && (
                    <button
                      onClick={() => { if (window.confirm('Delete this media?')) handleDeleteAdMedia(slot.id) }}
                      className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg w-full"
                    >
                      Delete
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
        onGallery={handleChecklistGallery}
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coordinates</label>
              <input
                placeholder="e.g. -26.195246, 28.034088"
                value={form.location.decimal}
                onChange={(e) => setForm({ ...form, location: { ...form.location, decimal: e.target.value } })}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bay (optional)</label>
              <input
                placeholder="Bay"
                value={form.location.bay || ''}
                onChange={(e) => setForm({ ...form, location: { ...form.location, bay: e.target.value } })}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={getGPS} className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl hover:bg-indigo-200">Get Current GPS</button>
            <button onClick={showCoordinates} className="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl hover:bg-amber-200">Show Coordinates</button>
            <button onClick={showMap} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl hover:bg-blue-200">Show Map</button>
            <button onClick={clearLocation} className="bg-red-100 text-red-700 px-4 py-2 rounded-xl hover:bg-red-200">Clear</button>
          </div>

          {form.location.gps && (
            <p className="text-sm text-gray-600">
              Pinned: {form.location.gps.lat.toFixed(6)}, {form.location.gps.lng.toFixed(6)}
            </p>
          )}
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="Financial Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="number" placeholder="Purchase Price" value={form.financial.purchasePrice ?? ''} onChange={(e) => handleFinancialChange('purchasePrice', e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5" />
          <input type="number" placeholder="Selling Price" value={form.financial.sellingPrice ?? ''} onChange={(e) => handleFinancialChange('sellingPrice', e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5" />


          <div className="border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50">Estimated Profit: <strong>{form.financial.estimatedProfit ?? '—'}</strong></div>
          <div className="border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50">Expected Margin: <strong>{form.financial.expectedMargin ? `${form.financial.expectedMargin.toFixed(2)}%` : '—'}</strong></div>
          <input type="number" placeholder="Trade Value" value={form.financial.tradeValue ?? ''} onChange={(e) => handleFinancialChange('tradeValue', e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5 col-span-full" />
          <div className="col-span-full space-y-2">
            <p className="font-medium text-gray-700">Additional Costs</p>
            {form.financial.additionalCosts?.map((cost, idx) => (
              <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2 rounded-xl">
                <span className="flex-1 text-sm">{cost.label}</span>
                <span className="font-semibold">R {cost.amount.toLocaleString()}</span>
                <button onClick={() => handleRemoveAdditionalCost(idx)} className="text-red-600">✕</button>
              </div>
            ))}
            <button onClick={handleAddAdditionalCost} className="text-indigo-600 text-sm hover:underline">+ Add Other Cost</button>
          </div>
        </div>
      </CollapsibleCard>

      

      {showCamera && <CameraModal onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />}
      {selectedPhoto && <FullscreenPhotoModal src={selectedPhoto} onClose={() => setSelectedPhoto(null)} />}
      {selectedVideo && <VideoModal src={selectedVideo} onClose={() => setSelectedVideo(null)} />}
    </div>
  )
}
