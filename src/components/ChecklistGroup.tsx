import { useState, useRef } from 'react'

function ChecklistGroup({ title, items, totalSlots, filledSlots, onResult, onNote, onPhotoCapture, onPhotoPreview, onPhotoDelete, onRequestAddPhotoSlot, onGallery }: {
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
  onRequestAddPhotoSlot: (itemId: string) => void
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
                              <input type="file" accept="image/*,application/pdf,.doc,.docx" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (file) await onGallery(item.id, idx, file); setSlotTarget(null); e.target.value = '' }} />
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
              <button onClick={() => onRequestAddPhotoSlot(item.id)} className="text-xs text-indigo-600 hover:underline">+ Add Photo</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ChecklistGroup
