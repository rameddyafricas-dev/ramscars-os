// One-time cleanup for oversized videos that crash mobile browsers.
// Runs BEFORE the app mounts so IndexedDB data is sanitised early.

const MAX_VIDEO_MB = 15
const BASE64_OVERHEAD = 1.37
const MAX_BASE64_CHARS = Math.floor(MAX_VIDEO_MB * 1024 * 1024 * BASE64_OVERHEAD)

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('ramscars-os')
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function isLargeVideo(src: unknown): boolean {
  if (typeof src !== 'string') return false
  if (!src.startsWith('data:video')) return false
  return src.length > MAX_BASE64_CHARS
}

export async function cleanupLargeVideos(): Promise<number> {
  try {
    const db = await openDB()
    if (!db.objectStoreNames.contains('inspections')) return 0

    const tx = db.transaction('inspections', 'readwrite')
    const store = tx.objectStore('inspections')

    const all: any[] = await new Promise((resolve, reject) => {
      const r = store.getAll()
      r.onsuccess = () => resolve(r.result as any[])
      r.onerror = () => reject(r.error)
    })

    let cleared = 0
    let inspectionsChanged = 0

    for (const insp of all) {
      let changed = false

      // Clear oversized videos from advertisementSlots
      if (Array.isArray(insp.advertisementSlots)) {
        insp.advertisementSlots = insp.advertisementSlots.map((slot: any) => {
          if (slot && slot.photo && isLargeVideo(slot.photo)) {
            cleared++
            changed = true
            return { ...slot, photo: '' }
          }
          return slot
        })
      }

      // Clear oversized videos from legacy advertisementPhotos
      if (Array.isArray(insp.advertisementPhotos)) {
        const filtered = insp.advertisementPhotos.filter((p: any) => {
          if (isLargeVideo(p)) {
            cleared++
            changed = true
            return false
          }
          return true
        })
        if (filtered.length !== insp.advertisementPhotos.length) {
          insp.advertisementPhotos = filtered
        }
      }

      // Clear oversized videos from checklist items
      if (Array.isArray(insp.checklist)) {
        insp.checklist = insp.checklist.map((item: any) => {
          if (Array.isArray(item.mediaIds)) {
            const cleaned = item.mediaIds.map((m: any) => {
              if (isLargeVideo(m)) {
                cleared++
                changed = true
                return ''
              }
              return m
            })
            if (JSON.stringify(cleaned) !== JSON.stringify(item.mediaIds)) {
              return { ...item, mediaIds: cleaned }
            }
          }
          return item
        })
      }

      if (changed) {
        insp.updatedAt = new Date().toISOString()
        inspectionsChanged++
        await new Promise<void>((resolve, reject) => {
          const r = store.put(insp)
          r.onsuccess = () => resolve()
          r.onerror = () => reject(r.error)
        })
      }
    }

    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })

    if (cleared > 0) {
      console.log(`[cleanup] Removed ${cleared} oversized video(s) from ${inspectionsChanged} inspection(s)`)
    }
    return cleared
  } catch (err) {
    console.error('[cleanup] Failed:', err)
    return 0
  }
}
