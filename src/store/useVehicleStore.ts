import { create } from 'zustand'
import { getAllRecords, addRecord, updateRecord } from '../services/db'
import type { Vehicle } from '../types'

interface VehicleState {
  vehicles: Vehicle[]
  isLoading: boolean
  error: string | null
  loadVehicles: () => Promise<void>
  createVehicle: (vehicle: Vehicle) => Promise<void>
  updateVehicle: (vehicle: Vehicle) => Promise<void>
}

export const useVehicleStore = create<VehicleState>((set) => ({
  vehicles: [],
  isLoading: false,
  error: null,
  loadVehicles: async () => {
    set({ isLoading: true, error: null })
    try {
      const vehicles = await getAllRecords<Vehicle>('vehicles')
      set({ vehicles, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  createVehicle: async (vehicle) => {
    set({ isLoading: true, error: null })
    try {
      await addRecord('vehicles', vehicle)
      set((state) => ({
        vehicles: [...state.vehicles, vehicle],
        isLoading: false,
      }))
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
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
}))
