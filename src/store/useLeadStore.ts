import { create } from 'zustand'
import { getAllRecords, addRecord, updateRecord } from '../services/db'
import type { Lead } from '../types'

interface LeadState {
  leads: Lead[]
  isLoading: boolean
  error: string | null
  loadLeads: () => Promise<void>
  createLead: (lead: Lead) => Promise<void>
  updateLead: (lead: Lead) => Promise<void>
}

export const useLeadStore = create<LeadState>((set) => ({
  leads: [],
  isLoading: false,
  error: null,
  loadLeads: async () => {
    set({ isLoading: true, error: null })
    try {
      const leads = await getAllRecords<Lead>('leads')
      set({ leads, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  createLead: async (lead) => {
    set({ isLoading: true, error: null })
    try {
      await addRecord('leads', lead)
      set((state) => ({
        leads: [...state.leads, lead],
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  updateLead: async (lead) => {
    set({ isLoading: true, error: null })
    try {
      await updateRecord('leads', lead)
      set((state) => ({
        leads: state.leads.map((l) => (l.id === lead.id ? lead : l)),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
}))
