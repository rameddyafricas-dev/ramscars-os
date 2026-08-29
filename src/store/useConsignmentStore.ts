import { create } from 'zustand'
import { getAllRecords, addRecord, updateRecord } from '../services/db'
import { logAudit } from '../services/audit'
import type { Consignment } from '../types'

interface ConsignmentState {
  consignments: Consignment[]
  isLoading: boolean
  error: string | null
  loadConsignments: () => Promise<void>
  createConsignment: (consignment: Consignment) => Promise<void>
  updateConsignment: (consignment: Consignment) => Promise<void>
}

export const useConsignmentStore = create<ConsignmentState>((set) => ({
  consignments: [],
  isLoading: false,
  error: null,
  loadConsignments: async () => {
    set({ isLoading: true, error: null })
    try {
      const consignments = await getAllRecords<Consignment>('consignments')
      set({ consignments, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  createConsignment: async (consignment) => {
    set({ isLoading: true, error: null })
    try {
      await addRecord('consignments', consignment)
      await logAudit('Consignment', consignment.id, 'created', 'Consignment created')
      set((state) => ({ consignments: [...state.consignments, consignment], isLoading: false }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  updateConsignment: async (consignment) => {
    set({ isLoading: true, error: null })
    try {
      await updateRecord('consignments', consignment)
      await logAudit('Consignment', consignment.id, 'updated', 'Consignment updated')
      set((state) => ({
        consignments: state.consignments.map((c) => (c.id === consignment.id ? consignment : c)),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
}))
