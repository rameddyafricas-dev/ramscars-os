import type { Vehicle, Inspection, Sale, Document } from '../types'

export type DealStageKey =
  | 'intake'
  | 'consignment'
  | 'inspection'
  | 'hpi'
  | 'marketing'
  | 'sale'
  | 'ownership'
  | 'paid'

export interface DealStage {
  key: DealStageKey
  label: string
  done: boolean
}

export interface DealState {
  stages: DealStage[]
  progress: number
  adPhotos: string[]
  hpiStatus: 'passed' | 'pending' | 'failed' | 'unknown'
  consignmentSigned: boolean
  ownershipDone: boolean
  marketingPublished: boolean
  saleExists: boolean
  ownerPaid: boolean
  blockers: string[]
  nextAction: string
}

const isDocMatch = (docs: Document[], keyword: string, exclude?: string): boolean =>
  docs.some(d => {
    const t = d.title.toLowerCase()
    return t.includes(keyword.toLowerCase()) && (!exclude || !t.includes(exclude.toLowerCase()))
  })

const isValidPhotoSrc = (src: unknown): src is string => {
  if (typeof src !== 'string') return false
  const s = src.trim()
  if (s === '') return false
  if (s.startsWith('data:image/')) return true
  if (s.startsWith('blob:')) return true
  if (s.startsWith('http://') || s.startsWith('https://')) return true
  return false
}

export function getAdvertisementPhotos(inspection?: Inspection): string[] {
  if (!inspection) return []
  const slotPhotos = inspection.advertisementSlots
    ? inspection.advertisementSlots.map(s => s.photo).filter(isValidPhotoSrc)
    : []
  const legacyPhotos = inspection.advertisementPhotos
    ? inspection.advertisementPhotos.filter(isValidPhotoSrc)
    : []
  return Array.from(new Set([...slotPhotos, ...legacyPhotos]))
}

export function getAdvertisementVideos(inspection?: Inspection): string[] {
  if (!inspection || !inspection.advertisementSlots) return []
  return inspection.advertisementSlots
    .filter(s => s.id === 'adv_video' || s.label === 'Video')
    .map(s => s.photo)
    .filter(p => p && p.trim() !== '')
}

export function getDealState(
  vehicle: Vehicle,
  inspection: Inspection | undefined,
  documents: Document[],
  sale: Sale | undefined
): DealState {
  const vehicleDocs = documents.filter(d => d.vehicleId === vehicle.id)

  const consignmentSigned = isDocMatch(vehicleDocs, 'consignment')
  const hpiFailed = isDocMatch(vehicleDocs, 'hpi', 'passed') && !isDocMatch(vehicleDocs, 'passed')
  const hpiPassedDoc = isDocMatch(vehicleDocs, 'hpi') && isDocMatch(vehicleDocs, 'passed')
  const hpiAny = isDocMatch(vehicleDocs, 'hpi')
  const ownershipDone = isDocMatch(vehicleDocs, 'change of ownership')

  let hpiStatus: DealState['hpiStatus'] = 'unknown'
  if (hpiFailed) hpiStatus = 'failed'
  else if (hpiPassedDoc) hpiStatus = 'passed'
  else if (hpiAny) hpiStatus = 'pending'

  const marketingPublished =
    !!inspection?.marketing?.title &&
    (inspection.marketing.channels?.length ?? 0) > 0

  const saleExists = !!sale
  const ownerPaid = sale?.paymentStatus === 'paid'

  const stages: DealStage[] = [
    { key: 'intake', label: 'Intake', done: true },
    { key: 'consignment', label: 'Consignment', done: consignmentSigned },
    { key: 'inspection', label: 'Inspection', done: !!inspection },
    { key: 'hpi', label: 'HPI', done: hpiStatus === 'passed' },
    { key: 'marketing', label: 'Marketing', done: marketingPublished },
    { key: 'sale', label: 'Sale', done: saleExists },
    { key: 'ownership', label: 'Ownership', done: ownershipDone },
    { key: 'paid', label: 'Owner Paid', done: ownerPaid },
  ]

  const progress = Math.round(
    (stages.filter(s => s.done).length / stages.length) * 100
  )

  const blockers: string[] = []
  if (!consignmentSigned) blockers.push('Consignment agreement not signed')
  if (!inspection) blockers.push('Inspection not started')
  if (hpiStatus === 'failed') blockers.push('HPI failed — do not proceed')
  if (hpiStatus === 'pending') blockers.push('HPI pending')
  if (hpiStatus === 'unknown') blockers.push('HPI not requested')
  if (!marketingPublished && inspection) blockers.push('Marketing not published')
  if (saleExists && !ownershipDone) blockers.push('Change of ownership pending')
  if (saleExists && !ownerPaid) blockers.push('Owner not yet paid')

  let nextAction = 'All stages complete'
  if (!consignmentSigned) nextAction = 'Upload Consignment Agreement'
  else if (!inspection) nextAction = 'Complete Inspection'
  else if (hpiStatus === 'unknown' || hpiStatus === 'pending') nextAction = 'Upload HPI Report'
  else if (hpiStatus === 'failed') nextAction = 'Deal blocked — HPI failed'
  else if (!marketingPublished) nextAction = 'Publish Ad'
  else if (!saleExists) nextAction = 'Find a Buyer'
  else if (!ownershipDone) nextAction = 'Process Change of Ownership'
  else if (!ownerPaid) nextAction = 'Pay Owner / Close Deal'

  return {
    stages,
    progress,
    adPhotos: getAdvertisementPhotos(inspection),
    hpiStatus,
    consignmentSigned,
    ownershipDone,
    marketingPublished,
    saleExists,
    ownerPaid,
    blockers,
    nextAction,
  }
}
