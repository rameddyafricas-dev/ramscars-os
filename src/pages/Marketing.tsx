import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useVehicleStore } from '../store/useVehicleStore'
import { useInspectionStore } from '../store/useInspectionStore'
import type { Inspection, MarketingInfo } from '../types'

export default function Marketing() {
  const { vehicles, loadVehicles } = useVehicleStore()
  const { inspections, loadInspections, updateInspection } = useInspectionStore()
  const [searchParams] = useSearchParams()
  const vehicleParam = searchParams.get('vehicle') || ''
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<MarketingInfo | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    loadVehicles()
    loadInspections()
  }, [loadVehicles, loadInspections])

  useEffect(() => {
    if (!vehicleParam || vehicles.length === 0 || inspections.length === 0) return
    const vehicle = vehicles.find(v => v.id === vehicleParam)
    if (!vehicle) return
    const inspection = inspections.find(i => i.id === vehicle.inspectionId)
    if (inspection) startEdit(inspection)
  }, [vehicleParam, vehicles, inspections])

  const listings = useMemo(() => {
    return vehicles.map(vehicle => ({
      vehicle,
      inspection: inspections.find(i => i.id === vehicle.inspectionId)
    })).filter(item => item.inspection)
  }, [vehicles, inspections])

  const generateListingFromVehicle = (inspection: Inspection): MarketingInfo => {
    const v = inspection.vehicleInfo
    const year = v.year || ''
    const make = v.make || ''
    const model = v.model || ''
    const body = v.bodyType || ''
    const fuel = v.fuelType || ''
    const mileage = v.mileage || ''
    const trans = v.transmission || ''
    const color = v.color || ''
    const title = `${year} ${make} ${model}`.trim()
    const description = [
      'This well-maintained vehicle is ready for its next owner.',
      title,
      body ? `Body type: ${body}` : '',
      fuel ? `Fuel: ${fuel}` : '',
      mileage ? `Mileage: ${mileage} km` : '',
      trans ? `Transmission: ${trans}` : '',
      color ? `Colour: ${color}` : '',
    ].filter(Boolean).join('. ') + '.'
    const hashtags = [make.replace(/\s+/g, ''), model.replace(/\s+/g, ''), 'RamsCars', 'UsedCars', 'ForSale']
      .filter(Boolean).map(tag => '#' + tag)
    return {
      ...inspection.marketing,
      title: inspection.marketing.title || title,
      description: inspection.marketing.description || description,
      hashtags: inspection.marketing.hashtags && inspection.marketing.hashtags.length > 0 ? inspection.marketing.hashtags : hashtags,
      seoKeywords: inspection.marketing.seoKeywords && inspection.marketing.seoKeywords.length > 0 ? inspection.marketing.seoKeywords : [year, make, model, body, fuel, trans].filter(Boolean),
    }
  }

  const startEdit = (inspection: Inspection) => {
    setEditingId(inspection.id)
    setEditForm(generateListingFromVehicle(inspection))
  }

  const handleSave = async () => {
    if (!editingId || !editForm) return
    const inspection = inspections.find(i => i.id === editingId)
    if (!inspection) return
    const updated: Inspection = { ...inspection, marketing: editForm, updatedAt: new Date().toISOString() }
    await updateInspection(updated)
    setEditingId(null)
    setEditForm(null)
    setSavedId(editingId)
    setTimeout(() => setSavedId(null), 2000)
  }

  const toggleChannel = (channel: string) => {
    if (!editForm) return
    const channels = editForm.channels.includes(channel)
      ? editForm.channels.filter(c => c !== channel)
      : [...editForm.channels, channel]
    setEditForm({ ...editForm, channels })
  }

  const getListingText = (marketing: MarketingInfo) => {
    return `${marketing.title}\n${marketing.description}\n${marketing.hashtags.join(' ')}`
  }

  const handleCopy = async (id: string, marketing: MarketingInfo) => {
    try {
      await navigator.clipboard.writeText(getListingText(marketing))
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      alert('Failed to copy listing text.')
    }
  }

  const openShare = (channel: string, text: string) => {
    const encoded = encodeURIComponent(text)
    const url = channel === 'whatsapp' ? `https://wa.me/?text=${encoded}` :
                channel === 'facebook' ? `https://www.facebook.com/sharer/sharer.php?u=${encoded}` :
                channel === 'twitter' ? `https://twitter.com/intent/tweet?text=${encoded}` :
                channel === 'email' ? `mailto:?body=${encoded}` : ''
    if (url) window.open(url, '_blank')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Marketing & Listings</h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{listings.length} listing(s)</span>
      </div>

      {listings.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          No listings available. Complete inspections to create marketing listings.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {listings.map(({ vehicle, inspection }) => (
            <div key={inspection!.id} className={`card p-5 ${vehicle.id === vehicleParam ? 'ring-2 ring-indigo-500' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                  <p className="text-sm text-gray-500">Stock: {vehicle.stockNumber || '—'}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(inspection!)}
                    className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-sm hover:bg-indigo-200"
                  >
                    {editingId === inspection!.id ? 'Cancel' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handleCopy(inspection!.id, inspection!.marketing)}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm hover:bg-gray-200"
                  >
                    {copiedId === inspection!.id ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {editingId === inspection!.id && editForm ? (
                <div className="mt-4 space-y-3">
                  <input placeholder="Listing Title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full border border-gray-300 rounded-xl px-3 py-2" />
                  <textarea placeholder="Description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full border border-gray-300 rounded-xl px-3 py-2" rows={3} />
                  <input placeholder="SEO Keywords (comma separated)" value={editForm.seoKeywords.join(', ')} onChange={(e) => setEditForm({ ...editForm, seoKeywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="w-full border border-gray-300 rounded-xl px-3 py-2" />
                  <input placeholder="Hashtags (comma separated)" value={editForm.hashtags.join(', ')} onChange={(e) => setEditForm({ ...editForm, hashtags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="w-full border border-gray-300 rounded-xl px-3 py-2" />
                  <div className="flex flex-wrap gap-2">
                    {['facebook', 'instagram', 'whatsapp', 'twitter', 'tiktok', 'youtube'].map(channel => (
                      <button key={channel} type="button" onClick={() => toggleChannel(channel)} className={`px-3 py-1 rounded-full text-xs font-medium ${editForm.channels.includes(channel) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {channel}
                      </button>
                    ))}
                  </div>
                  <button onClick={handleSave} className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700">Save Listing</button>
                </div>
              ) : (
                <div className="mt-4 space-y-3 text-sm">
                  <p className="font-medium text-gray-800">{inspection!.marketing.title || 'No title'}</p>
                  <p className="text-gray-600">{inspection!.marketing.description || 'No description'}</p>
                  <div className="flex flex-wrap gap-1">
                    {inspection!.marketing.channels.map(ch => (
                      <span key={ch} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs capitalize">{ch}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {inspection!.marketing.hashtags.map((tag, idx) => (
                      <span key={idx} className="text-indigo-600 text-xs">{tag}</span>
                    ))}
                  </div>
                  {savedId === inspection!.id && <p className="text-green-600 text-xs">✓ Saved</p>}
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => openShare('whatsapp', getListingText(inspection!.marketing))} className="text-green-600 text-xs hover:underline">WhatsApp</button>
                    <button onClick={() => openShare('facebook', getListingText(inspection!.marketing))} className="text-blue-600 text-xs hover:underline">Facebook</button>
                    <button onClick={() => openShare('twitter', getListingText(inspection!.marketing))} className="text-sky-600 text-xs hover:underline">Twitter</button>
                    <button onClick={() => openShare('email', getListingText(inspection!.marketing))} className="text-gray-600 text-xs hover:underline">Email</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
