import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useVehicleStore } from '../store/useVehicleStore'
import { useInspectionStore } from '../store/useInspectionStore'
import { useDealershipStore } from '../store/useDealershipStore'
import type { Inspection, MarketingInfo, Vehicle } from '../types'
import Toast from '../components/Toast'
import { useAdDraftsStore, type AdDraft } from '../store/useAdDraftsStore'

export default function Marketing() {
  const { vehicles, loadVehicles } = useVehicleStore()
  const { inspections, loadInspections, updateInspection } = useInspectionStore()
  const { profile, loadProfile } = useDealershipStore()
  const { drafts, loadDrafts, removeDraft } = useAdDraftsStore()
  const [searchParams] = useSearchParams()
  const vehicleParam = searchParams.get('vehicle') || ''
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<MarketingInfo | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [generatedAdImage, setGeneratedAdImage] = useState<string | null>(null)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    loadVehicles()
    loadInspections()
    loadProfile()
    loadDrafts()
  }, [loadVehicles, loadInspections, loadProfile, loadDrafts])

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

  const getListingText = (marketing: MarketingInfo, vehicle: Vehicle) => {
    const pricePart = vehicle.listingPrice !== undefined ? `R ${vehicle.listingPrice.toLocaleString()}` : 'Contact for price'
    const dealerPart = profile ? `${profile.name} | ${profile.phone} | ${profile.email}` : ''
    return `${marketing.title}\n${marketing.description}\nPrice: ${pricePart}\n${dealerPart}\n${marketing.hashtags.join(' ')}`
  }

  const handleCopy = async (id: string, marketing: MarketingInfo, vehicle: Vehicle) => {
    try {
      await navigator.clipboard.writeText(getListingText(marketing, vehicle))
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      setToastMessage('Failed to copy listing text.')
    }
  }

  const openShare = (channel: string, text: string) => {
    const encoded = encodeURIComponent(text)
    const url =
      channel === 'whatsapp' ? `https://wa.me/?text=${encoded}` :
      channel === 'facebook' ? `https://www.facebook.com/sharer/sharer.php?u=${encoded}` :
      channel === 'twitter' ? `https://twitter.com/intent/tweet?text=${encoded}` :
      channel === 'telegram' ? `https://t.me/share/url?url=${encoded}&text=${encoded}` :
      channel === 'linkedin' ? `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}` :
      channel === 'email' ? `mailto:?body=${encoded}` :
      channel === 'sms' ? `sms:?body=${encoded}` : ''
    if (url) window.open(url, '_blank')
  }

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const getAdvertisementPhotos = (inspection: Inspection): string[] => {
    const slotPhotos = inspection.advertisementSlots
      ? inspection.advertisementSlots.filter(s => s.photo && s.photo.trim() !== '').map(s => s.photo)
      : [];
    const legacyPhotos = inspection.advertisementPhotos ? inspection.advertisementPhotos.filter(p => p) : [];
    const combined = [...slotPhotos, ...legacyPhotos];
    return Array.from(new Set(combined));
  };

  const generateAdImage = async (vehicle: Vehicle, inspection: Inspection): Promise<string> => {
    const adPhotos = getAdvertisementPhotos(inspection);
    const sourcePhotos = adPhotos.length > 0 ? adPhotos : (vehicle.photos && vehicle.photos.length > 0 ? vehicle.photos : []);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    canvas.width = 800;
    canvas.height = 600;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 800, 600);
    gradient.addColorStop(0, '#1e293b');
    gradient.addColorStop(1, '#4f46e5');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (sourcePhotos.length > 0) {
      const images: HTMLImageElement[] = [];
      for (const src of sourcePhotos) {
        try {
          const img = await loadImage(src);
          images.push(img);
        } catch (err) {
          console.warn('Failed to load image', src, err);
        }
      }

      if (images.length > 0) {
        const cols = images.length >= 3 ? 3 : images.length;
        const rows = Math.ceil(images.length / cols);
        const padding = 10;
        const availableWidth = canvas.width - padding * 2;
        const availableHeight = 400; // leave space for text overlay
        const cellWidth = availableWidth / cols;
        const cellHeight = availableHeight / rows;

        images.forEach((img, idx) => {
          const row = Math.floor(idx / cols);
          const col = idx % cols;
          const x = padding + col * cellWidth;
          const y = padding + row * cellHeight;
          // cover crop within cell
          const scale = Math.max(cellWidth / img.width, cellHeight / img.height);
          const dw = img.width * scale;
          const dh = img.height * scale;
          const dx = x + (cellWidth - dw) / 2;
          const dy = y + (cellHeight - dh) / 2;
          ctx.drawImage(img, dx, dy, dw, dh);
          // subtle border
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);
        });
      }
    }

    // Bottom overlay
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, canvas.height - 140, canvas.width, 140);

    // Title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 26px Arial';
    ctx.fillText(`${vehicle.year} ${vehicle.make} ${vehicle.model}`, 30, canvas.height - 95);

    // Price
    const priceText = vehicle.listingPrice !== undefined ? `R ${vehicle.listingPrice.toLocaleString()}` : 'Contact for price';
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#34d399';
    ctx.fillText(priceText, 30, canvas.height - 60);

    // Dealer info
    if (profile) {
      ctx.font = '18px Arial';
      ctx.fillStyle = 'white';
      ctx.fillText(`${profile.name} | ${profile.phone}`, 30, canvas.height - 30);
    }

    // Stock
    if (vehicle.stockNumber) {
      ctx.font = '16px Arial';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`Stock: ${vehicle.stockNumber}`, 30, canvas.height - 10);
    }

    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const handleGenerateAdImage = async (vehicle: Vehicle, inspection: Inspection) => {
    setGeneratingId(vehicle.id);
    try {
      const dataUrl = await generateAdImage(vehicle, inspection);
      setGeneratedAdImage(dataUrl);
    } catch (err) {
      setToastMessage('Failed to generate ad image.');
    } finally {
      setGeneratingId(null);
    }
  };

  const downloadAdImage = () => {
    if (!generatedAdImage) return
    const a = document.createElement('a')
    a.href = generatedAdImage
    a.download = `ad-${Date.now()}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }


  const shareDraft = async (draft: AdDraft) => {
    try {
      if (navigator.share) {
        const shareData: any = { title: draft.title, text: draft.text };
        if (draft.photo && navigator.canShare && navigator.canShare({ files: [await (async () => {
          const [meta, data] = draft.photo!.split(',');
          const mime = meta.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
          return new File([Uint8Array.from(atob(data), c => c.charCodeAt(0))], 'ad.jpg', { type: mime });
        })()] })) {
          const file = await (async () => {
            const [meta, data] = draft.photo!.split(',');
            const mime = meta.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
            return new File([Uint8Array.from(atob(data), c => c.charCodeAt(0))], 'ad.jpg', { type: mime });
          })();
          shareData.files = [file];
        }
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(draft.text);
        window.open(`https://wa.me/?text=${encodeURIComponent(draft.text)}`, '_blank');
      }
    } catch (err) {
      console.error('Share draft failed', err);
    }
  };

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
                  {vehicle.listingPrice !== undefined && (
                    <p className="text-green-700 font-medium">R {vehicle.listingPrice.toLocaleString()}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(inspection!)} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-sm hover:bg-indigo-200">
                    {editingId === inspection!.id ? 'Cancel' : 'Edit'}
                  </button>
                  <button onClick={() => handleCopy(inspection!.id, inspection!.marketing, vehicle)} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm hover:bg-gray-200">
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

                  {/* Share buttons */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button onClick={() => openShare('whatsapp', getListingText(inspection!.marketing, vehicle))} className="text-green-600 text-xs hover:underline">WhatsApp</button>
                    <button onClick={() => openShare('facebook', getListingText(inspection!.marketing, vehicle))} className="text-blue-600 text-xs hover:underline">Facebook</button>
                    <button onClick={() => openShare('twitter', getListingText(inspection!.marketing, vehicle))} className="text-sky-600 text-xs hover:underline">Twitter</button>
                    <button onClick={() => openShare('telegram', getListingText(inspection!.marketing, vehicle))} className="text-blue-500 text-xs hover:underline">Telegram</button>
                    <button onClick={() => openShare('linkedin', getListingText(inspection!.marketing, vehicle))} className="text-blue-700 text-xs hover:underline">LinkedIn</button>
                    <button onClick={() => openShare('email', getListingText(inspection!.marketing, vehicle))} className="text-gray-600 text-xs hover:underline">Email</button>
                    <button onClick={() => openShare('sms', getListingText(inspection!.marketing, vehicle))} className="text-indigo-600 text-xs hover:underline">SMS</button>
                  </div>

                  {/* Ad image generation */}
                  <div className="pt-2 border-t mt-3">
                    <button
                      onClick={() => handleGenerateAdImage(vehicle, inspection!)}
                      disabled={generatingId === vehicle.id}
                      className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-xs font-medium hover:bg-purple-200 disabled:opacity-50"
                    >
                      {generatingId === vehicle.id ? 'Generating...' : 'Generate Ad Image'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Saved Drafts */}
      {drafts.length > 0 && (
        <div className="card p-5 mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Saved Drafts</h2>
          <div className="space-y-2">
            {drafts.map(draft => (
              <div key={draft.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{draft.title}</p>
                  <p className="text-xs text-gray-500 truncate">{draft.text.slice(0, 100)}...</p>
                </div>
                {draft.photo && <img src={draft.photo} alt="draft" className="h-12 w-12 object-cover rounded ml-3" />}
                <div className="flex gap-2 ml-3">
                  <button onClick={() => shareDraft(draft)} className="text-indigo-600 text-sm hover:underline">Share</button>
                  <button onClick={() => removeDraft(draft.id)} className="text-red-600 text-sm hover:underline">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated ad image preview modal */}
      {generatedAdImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setGeneratedAdImage(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 flex justify-between items-center border-b">
              <h3 className="font-semibold text-gray-800">Generated Ad Image</h3>
              <button onClick={() => setGeneratedAdImage(null)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>
            <div className="p-4">
              <img src={generatedAdImage} alt="Generated ad" className="w-full rounded-lg" />
            </div>
            <div className="p-4 flex justify-end gap-2 border-t">
              <button onClick={downloadAdImage} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm">Download</button>
              <button onClick={() => setGeneratedAdImage(null)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </div>
  )
}
