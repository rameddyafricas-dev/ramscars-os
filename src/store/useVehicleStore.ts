import { create } from 'zustand'
import { getAllRecords, addRecord, updateRecord } from '../services/db'
import { logAudit } from '../services/audit'
import type { Vehicle } from '../types'

interface VehicleState {
  vehicles: Vehicle[]
  isLoading: boolean
  error: string | null
  loadVehicles: () => Promise<void>
  createVehicle: (vehicle: Vehicle) => Promise<void>
  updateVehicle: (vehicle: Vehicle) => Promise<void>
}

function deduplicateByInspectionId(vehicles: Vehicle[]): Vehicle[] {
  const seen = new Map<string, Vehicle>()
  for (const vehicle of vehicles) {
    if (vehicle.inspectionId && seen.has(vehicle.inspectionId)) {
      // keep newer one
      const existing = seen.get(vehicle.inspectionId)!
      if (new Date(vehicle.updatedAt) > new Date(existing.updatedAt)) {
        seen.set(vehicle.inspectionId, vehicle)
      }
    } else {
      seen.set(vehicle.id, vehicle)
      if (vehicle.inspectionId) seen.set(vehicle.inspectionId, vehicle)
    }
  }
  return Array.from(new Set(seen.values()))
}

export const useVehicleStore = create<VehicleState>((set) => ({
  vehicles: [],
  isLoading: false,
  error: null,
  loadVehicles: async () => {
    set({ isLoading: true, error: null })
    try {
      let vehicles = await getAllRecords<Vehicle>('vehicles')
      vehicles = deduplicateByInspectionId(vehicles)
      set({ vehicles, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  createVehicle: async (vehicle) => {
    set({ isLoading: true, error: null })
    try {
      const existing = useVehicleStore.getState().vehicles.find((v) => v.inspectionId === vehicle.inspectionId)
      if (existing) {
        await updateRecord('vehicles', vehicle)
        set((state) => ({
          vehicles: state.vehicles.map((v) => (v.id === existing.id ? vehicle : v)),
          isLoading: false,
        }))
      } else {
        await addRecord('vehicles', vehicle)
        set((state) => ({
          vehicles: [...state.vehicles, vehicle],
          isLoading: false,
        }))
        await logAudit('Vehicle', vehicle.id, 'created', 'Vehicle created')
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  updateVehicle: async (vehicle) => {
    set({ isLoading: true, error: null })
    try {
      await updateRecord('vehicles', vehicle)
      set((state) => ({
        vehicles: state.vehicles.map((v) => (v.id === vehicle.id ? vehicle : v)),
        isLoading: false,
      }))
      await logAudit('Vehicle', vehicle.id, 'updated', 'Vehicle updated')
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
}))
