import { create } from 'zustand'
import { getAllRecords, addRecord, updateRecord } from '../services/db'
import { logAudit } from '../services/audit'
import { generateStockNumber } from '../utils/stockNumber'
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
  estimatedProfit: null,
  expectedMargin: null,
  tradeValue: null,
  additionalCosts: [],
}

const emptyMarketing: MarketingInfo = {
  title: '',
  description: '',
  seoKeywords: [],
  hashtags: [],
  channels: [],
}

const defaultChecklist: ChecklistItem[] = [
  // Legal Documents (10)
  { id: 'legal1', category: 'documentation', label: 'Registration Certificate', checked: false, photoLabels: ['Registration Certificate'], defaultPhotoCount: 1 },
  { id: 'legal2', category: 'documentation', label: "Owner's ID", checked: false, photoLabels: ['Front', 'Back'], defaultPhotoCount: 2 },
  { id: 'legal3', category: 'documentation', label: 'VIN Number', checked: false, photoLabels: ['Dashboard VIN', 'Door Jamb Sticker VIN', 'Chassis VIN'], defaultPhotoCount: 3 },
  { id: 'legal4', category: 'documentation', label: 'Engine Number', checked: false, photoLabels: ['Engine Number'], defaultPhotoCount: 1 },
  { id: 'legal5', category: 'documentation', label: 'Registration Number', checked: false, photoLabels: ['Front Plate', 'Back Plate'], defaultPhotoCount: 2 },
  { id: 'legal6', category: 'documentation', label: 'License Disc', checked: false, photoLabels: ['License Disc'], defaultPhotoCount: 1 },
  { id: 'legal7', category: 'documentation', label: 'Roadworthy Certificate', checked: false, photoLabels: ['Roadworthy Certificate'], defaultPhotoCount: 1 },
  { id: 'legal8', category: 'documentation', label: 'Service History', checked: false, photoLabels: ['Service History'], defaultPhotoCount: 1 },
  { id: 'legal9', category: 'documentation', label: 'HPI Report', checked: false, photoLabels: ['HPI Report'], defaultPhotoCount: 1 },
  { id: 'legal10', category: 'documentation', label: 'Signed Consignment Agreement', checked: false, photoLabels: ['Page 1', 'Page 2'], defaultPhotoCount: 2 },

  // Exterior (10)
  { id: 'ext1', category: 'exterior', label: 'Body Panels', checked: false, photoLabels: ['Bonnet', 'Rear Door', 'Front Left Door', 'Front Right Door', 'Rear Left Door', 'Rear Right Door', 'Left Fender', 'Right Fender', 'Roof'], defaultPhotoCount: 9 },
  { id: 'ext2', category: 'exterior', label: 'Panel Alignment', checked: false, photoLabels: ['Bonnet', 'Rear Door', 'Front Left Door', 'Front Right Door', 'Rear Left Door', 'Rear Right Door', 'Left Fender', 'Right Fender', 'Roof'], defaultPhotoCount: 9 },
  { id: 'ext3', category: 'exterior', label: 'Dents', checked: false, photoLabels: ['Dent Photo 1', 'Dent Photo 2'], defaultPhotoCount: 2 },
  { id: 'ext4', category: 'exterior', label: 'Scratches', checked: false, photoLabels: ['Scratch Photo 1', 'Scratch Photo 2'], defaultPhotoCount: 2 },
  { id: 'ext5', category: 'exterior', label: 'Paint & Rust', checked: false, photoLabels: ['Paint / Rust Photo'], defaultPhotoCount: 1 },
  { id: 'ext6', category: 'exterior', label: 'Glass', checked: false, photoLabels: ['Front Windscreen', 'Rear Windscreen', 'Driver Door Glass', 'Passenger Door Glass', 'Rear Driver Door Glass', 'Rear Passenger Door Glass'], defaultPhotoCount: 6 },
  { id: 'ext7', category: 'exterior', label: 'Mirrors', checked: false, photoLabels: ['Left Side Mirror', 'Right Side Mirror', 'Rearview Mirror'], defaultPhotoCount: 3 },
  { id: 'ext8', category: 'exterior', label: 'Wipers', checked: false, photoLabels: ['Front Wipers', 'Rear Wiper'], defaultPhotoCount: 2 },
  { id: 'ext9', category: 'exterior', label: 'Exterior Lights & Indicators', checked: false, photoLabels: ['Front Left Light', 'Front Right Light', 'Rear Left Light', 'Rear Right Light', 'Left Indicator', 'Right Indicator'], defaultPhotoCount: 6 },
  { id: 'ext10', category: 'exterior', label: 'Tires & Wheels', checked: false, photoLabels: ['Front Left Tire', 'Front Right Tire', 'Rear Left Tire', 'Rear Right Tire'], defaultPhotoCount: 4 },

  // Interior (9)
  { id: 'int1', category: 'interior', label: 'Warning Lights & Instruments', checked: false, photoLabels: ['Instrument Cluster'], defaultPhotoCount: 1 },
  { id: 'int2', category: 'interior', label: 'Interior Doors', checked: false, photoLabels: ['Driver Door Panel', 'Passenger Door Panel', 'Rear Driver Door Panel', 'Rear Passenger Door Panel'], defaultPhotoCount: 4 },
  { id: 'int3', category: 'interior', label: 'Windows & Mirrors', checked: false, photoLabels: ['Driver Window', 'Passenger Window', 'Rear Driver Window', 'Rear Passenger Window'], defaultPhotoCount: 4 },
  { id: 'int4', category: 'interior', label: 'Seats', checked: false, photoLabels: ['Driver Seat', 'Passenger Seat', 'Rear Seats'], defaultPhotoCount: 3 },
  { id: 'int5', category: 'interior', label: 'Steering Wheel', checked: false, photoLabels: ['Steering Wheel'], defaultPhotoCount: 1 },
  { id: 'int6', category: 'interior', label: 'Cabin Trim', checked: false, photoLabels: ['Dashboard Trim', 'Door Trim', 'Headliner'], defaultPhotoCount: 3 },
  { id: 'int7', category: 'interior', label: 'Infotainment', checked: false, photoLabels: ['Infotainment Screen'], defaultPhotoCount: 1 },
  { id: 'int8', category: 'interior', label: 'AC & Climate Control', checked: false, photoLabels: ['AC Controls'], defaultPhotoCount: 1 },
  { id: 'int9', category: 'interior', label: 'Safety & Cabin Electronics', checked: false, photoLabels: ['Safety Controls'], defaultPhotoCount: 1 },

  // Engine Bay & Drive Train (9)
  { id: 'eng1', category: 'engine_bay', label: 'Overall Engine Condition', checked: false, photoLabels: ['Engine Bay Overview'], defaultPhotoCount: 1 },
  { id: 'eng2', category: 'engine_bay', label: 'Fluid Levels', checked: false, photoLabels: ['Brake Fluid', 'Coolant', 'Washer Fluid'], defaultPhotoCount: 3 },
  { id: 'eng3', category: 'engine_bay', label: 'Condition & Leaks', checked: false, photoLabels: ['Leak Photo 1', 'Leak Photo 2'], defaultPhotoCount: 2 },
  { id: 'eng4', category: 'engine_bay', label: 'Wiring', checked: false, photoLabels: ['Wiring Photo'], defaultPhotoCount: 1 },
  { id: 'eng5', category: 'engine_bay', label: 'Belts', checked: false, photoLabels: ['Belt Photo'], defaultPhotoCount: 1 },
  { id: 'eng6', category: 'engine_bay', label: 'Hoses', checked: false, photoLabels: ['Hose Photo'], defaultPhotoCount: 1 },
  { id: 'eng7', category: 'engine_bay', label: 'Battery Health', checked: false, photoLabels: ['Battery Photo'], defaultPhotoCount: 1 },
  { id: 'eng8', category: 'engine_bay', label: 'Exhaust & Emissions', checked: false, photoLabels: ['Exhaust Photo'], defaultPhotoCount: 1 },
  { id: 'eng9', category: 'engine_bay', label: 'Transmission', checked: false, photoLabels: ['Transmission Photo'], defaultPhotoCount: 1 },

  // Underbody & Suspension (4)
  { id: 'under1', category: 'underbody', label: 'Chassis & Frame Integrity', checked: false, photoLabels: ['Chassis Photo'], defaultPhotoCount: 1 },
  { id: 'under2', category: 'underbody', label: 'Suspension', checked: false, photoLabels: ['Front Suspension', 'Rear Suspension'], defaultPhotoCount: 2 },
  { id: 'under3', category: 'underbody', label: 'Steering', checked: false, photoLabels: ['Steering Rack Photo'], defaultPhotoCount: 1 },
  { id: 'under4', category: 'underbody', label: 'Brakes', checked: false, photoLabels: ['Front Brakes', 'Rear Brakes'], defaultPhotoCount: 2 },
]

const defaultAdvertisementSlots = [
  { id: 'adv_front', label: 'Front View', photo: '' },
  { id: 'adv_rhs', label: 'RHS View', photo: '' },
  { id: 'adv_rear', label: 'Rear View', photo: '' },
  { id: 'adv_lhs', label: 'LHS View', photo: '' },
  { id: 'adv_interior', label: 'Interior', photo: '' },
  { id: 'adv_seats', label: 'Seats', photo: '' },
  { id: 'adv_dashboard', label: 'Dashboard', photo: '' },
  { id: 'adv_cluster', label: 'Cluster', photo: '' },
  { id: 'adv_enginebay', label: 'Engine Bay', photo: '' },
  { id: 'adv_enginerhs', label: 'Engine RHS', photo: '' },
  { id: 'adv_enginelhs', label: 'Engine LHS', photo: '' },
  { id: 'adv_boot', label: 'Boot', photo: '' },
  { id: 'adv_video', label: 'Video', photo: '' },
]


function createEmptyInspection(): Inspection {
  const now = new Date().toISOString()
  return {
    id: `insp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    vehicleId: '',
    status: 'in_progress',
    inspectionDate: now,
    items: [],
    ownerInfo: emptyOwnerInfo,
    vehicleInfo: {
      ...emptyVehicleInfo,
      stockNumber: generateStockNumber(),
    },
    faults: [],
    checklist: defaultChecklist,
    score: emptyScore,
    location: emptyLocation,
    financial: emptyFinancial,
    marketing: emptyMarketing,
    progress: 0,
    advertisementPhotos: [],
    advertisementSlots: defaultAdvertisementSlots,
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
      let inspections = await getAllRecords<Inspection>('inspections')
      // Migrate old checklists to the new default if length differs or missing photoLabels
      inspections = inspections.map((insp) => {
        const needsMigration = !insp.checklist || insp.checklist.length !== defaultChecklist.length || insp.checklist.some((item) => !item.photoLabels)
        // Preserve existing advertisement slots; add missing ones without wiping photos
        const existingSlots = Array.isArray(insp.advertisementSlots) ? insp.advertisementSlots : [];
        let mergedSlots = defaultAdvertisementSlots.map((defaultSlot) => {
          const existing = existingSlots.find((slot) => slot.id === defaultSlot.id);
          if (existing) return { ...defaultSlot, photo: existing.photo || '' };
          return defaultSlot;
        });
        // If no slot has photos and there are legacy advertisementPhotos, populate slots
        const hasSlotPhoto = mergedSlots.some((slot) => slot.photo && slot.photo.trim() !== '');
        const legacyPhotos = Array.isArray(insp.advertisementPhotos) ? insp.advertisementPhotos.filter((photo) => photo) : [];
        if (!hasSlotPhoto && legacyPhotos.length > 0) {
          let photoIndex = 0;
          mergedSlots = mergedSlots.map((slot) => {
            if (slot.id === 'adv_video') return slot;
            if (photoIndex < legacyPhotos.length) {
              return { ...slot, photo: legacyPhotos[photoIndex++] };
            }
            return slot;
          });
        }
        return {
          ...insp,
          checklist: needsMigration ? defaultChecklist : insp.checklist,
          advertisementSlots: mergedSlots,
        }
      })
      set({ inspections, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  createInspection: async (inspection) => {
    set({ isLoading: true, error: null })
    try {
      await addRecord('inspections', inspection)
      await logAudit('Inspection', inspection.id, 'created', 'Inspection created')
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
      await logAudit('Inspection', inspection.id, 'updated', 'Inspection updated')
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
