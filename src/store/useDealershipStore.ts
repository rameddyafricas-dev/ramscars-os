import { create } from 'zustand'
import { getAllRecords, addRecord, updateRecord } from '../services/db'

export interface DealershipProfile {
  id: string
  name: string
  phone: string
  email: string
  address: string
  logo?: string
}

interface DealershipState {
  profile: DealershipProfile | null
  isLoading: boolean
  error: string | null
  loadProfile: () => Promise<void>
  saveProfile: (profile: DealershipProfile) => Promise<void>
}

export const useDealershipStore = create<DealershipState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,
  loadProfile: async () => {
    set({ isLoading: true, error: null })
    try {
      const profiles = await getAllRecords<DealershipProfile>('dealershipProfile')
      set({ profile: profiles[0] || null, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  saveProfile: async (profile) => {
    set({ isLoading: true, error: null })
    try {
      const existing = (await getAllRecords<DealershipProfile>('dealershipProfile'))[0]
      if (existing) {
        await updateRecord('dealershipProfile', profile)
      } else {
        await addRecord('dealershipProfile', profile)
      }
      set({ profile, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
}))
