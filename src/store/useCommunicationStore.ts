import { create } from 'zustand'
import { getAllRecords, addRecord, updateRecord, deleteRecord } from '../services/db'
import { logAudit } from '../services/audit'
import type { Communication } from '../types'

interface CommunicationState {
  communications: Communication[]
  isLoading: boolean
  error: string | null
  loadCommunications: () => Promise<void>
  createCommunication: (comm: Communication) => Promise<void>
  updateCommunication: (comm: Communication) => Promise<void>
  deleteCommunication: (id: string) => Promise<void>
}

export const useCommunicationStore = create<CommunicationState>((set) => ({
  communications: [],
  isLoading: false,
  error: null,
  loadCommunications: async () => {
    set({ isLoading: true, error: null })
    try {
      const communications = await getAllRecords<Communication>('communications')
      set({ communications, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  createCommunication: async (comm) => {
    set({ isLoading: true, error: null })
    try {
      await addRecord('communications', comm)
      await logAudit('Communication', comm.id, 'created', `Communication logged: ${comm.subject}`)
      set((state) => ({ communications: [...state.communications, comm], isLoading: false }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },
  updateCommunication: async (comm) => {
    set({ isLoading: true, error: null })
    try {
      await updateRecord('communications', comm)
      await logAudit('Communication', comm.id, 'updated', 'Communication updated')
      set((state) => ({
        communications: state.communications.map(c => (c.id === comm.id ? comm : c)),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  deleteCommunication: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await deleteRecord('communications', id)
      await logAudit('Communication', id, 'deleted', 'Communication deleted')
      set((state) => ({
        communications: state.communications.filter(c => c.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
}))
