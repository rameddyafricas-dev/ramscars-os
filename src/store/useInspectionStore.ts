import { create } from 'zustand'
import { getAllRecords, addRecord, updateRecord } from '../services/db'
import type {
  Inspection,
  ChecklistItem,
  InspectionScore,
  LocationInfo,
  FinancialInfo,
  MarketingInfo,
  OwnerInfo,
  VehicleInfo,
} from '../types'

const emptyOwnerInfo: OwnerInfo = {
  name: '',
  contactNumber: '',
  email: '',
  idNumber: '',
  physicalAddress: '',
}

const emptyVehicleInfo: VehicleInfo = {
  vehicleType: 'runner',
  make: '',
  model: '',
  year: '',
  color: '',
  bodyType: '',
  mileage: '',
  transmission: 'manual',
  fuelType: 'petrol',
  registrationNumber: '',
  licenseExpiry: '',
  vin: '',
  engineNumber: '',
  vehiclePapers: 'pending',
  vehicleStatus: 'At yard',
  stockNumber: '',
}

const emptyScore: InspectionScore = {
  mechanical: null,
  interior: null,
  exterior: null,
  electrical: null,
  safety: null,
  body: null,
  engine: null,
  suspension: null,
}

const emptyLocation: LocationInfo = {
  dms: '',
  decimal: '',
  gps: undefined,
  bay: '',
}

const emptyFinancial: FinancialInfo = {
  purchasePrice: null,
  sellingPrice: null,
  repairCost: null,
  transportCost: null,
  estimatedProfit: null,
  expectedMargin: null,
  tradeValue: null,
}

const emptyMarketing: MarketingInfo = {
  title: '',
  description: '',
  seoKeywords: [],
  hashtags: [],
  channels: [],
}

const defaultChecklist: ChecklistItem[] = [
  { id: 'doc1', category: 'documentation', label: 'VIN plate present', checked: false },
  { id: 'doc2', category: 'documentation', label: 'Registration papers', checked: false },
  { id: 'doc3', category: 'documentation', label: 'Service history', checked: false },
  { id: 'ext1', category: 'exterior', label: 'Body panels aligned', checked: false },
  { id: 'ext2', category: 'exterior', label: 'Paint condition', checked: false },
  { id: 'ext3', category: 'exterior', label: 'Glass condition', checked: false },
  { id: 'ext4', category: 'exterior', label: 'Tyre condition', checked: false },
  { id: 'int1', category: 'interior', label: 'Seats condition', checked: false },
  { id: 'int2', category: 'interior', label: 'Dashboard warning lights', checked: false },
  { id: 'int3', category: 'interior', label: 'Odor', checked: false },
  { id: 'int4', category: 'interior', label: 'Air conditioning', checked: false },
  { id: 'eng1', category: 'engine_bay', label: 'Oil leaks', checked: false },
  { id: 'eng2', category: 'engine_bay', label: 'Coolant level', checked: false },
  { id: 'eng3', category: 'engine_bay', label: 'Battery condition', checked: false },
  { id: 'eng4', category: 'engine_bay', label: 'Belts and hoses', checked: false },
]

function createEmptyInspection(): Inspection {
  const now = new Date().toISOString()
  return {
    id: `insp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    vehicleId: '',
    status: 'draft',
    inspectionDate: now,
    items: [],
    ownerInfo: emptyOwnerInfo,
    vehicleInfo: emptyVehicleInfo,
    faults: [],
    checklist: defaultChecklist,
    score: emptyScore,
    location: emptyLocation,
    financial: emptyFinancial,
    marketing: emptyMarketing,
    progress: 0,
    advertisementPhotos: [],
    createdAt: now,
    updatedAt: now,
  }
}

interface InspectionState {
  inspections: Inspection[]
  activeInspection: Inspection | null
  isLoading: boolean
  error: string | null
  loadInspections: () => Promise<void>
  createInspection: (inspection: Inspection) => Promise<void>
  updateInspection: (inspection: Inspection) => Promise<void>
  setActiveInspection: (id: string) => void
  newInspection: () => Promise<void>
}

export const useInspectionStore = create<InspectionState>((set, get) => ({
  inspections: [],
  activeInspection: null,
  isLoading: false,
  error: null,
  loadInspections: async () => {
    set({ isLoading: true, error: null })
    try {
      const inspections = await getAllRecords<Inspection>('inspections')
      set({ inspections, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  createInspection: async (inspection) => {
    set({ isLoading: true, error: null })
    try {
      await addRecord('inspections', inspection)
      set((state) => ({
        inspections: [...state.inspections, inspection],
        activeInspection: inspection,
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  updateInspection: async (inspection) => {
    set({ isLoading: true, error: null })
    try {
      await updateRecord('inspections', inspection)
      set((state) => ({
        inspections: state.inspections.map((i) =>
          i.id === inspection.id ? inspection : i
        ),
        activeInspection: inspection,
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  setActiveInspection: (id) => {
    const inspection = get().inspections.find((i) => i.id === id) || null
    set({ activeInspection: inspection })
  },
  newInspection: async () => {
    const current = get().activeInspection
    if (current) {
      await get().updateInspection(current)
    }
    const newInsp = createEmptyInspection()
    await get().createInspection(newInsp)
  },
}))
