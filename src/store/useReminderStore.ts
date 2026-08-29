import { create } from 'zustand'
import { getAllRecords, addRecord, updateRecord, deleteRecord } from '../services/db'
import type { Reminder } from '../types'

interface ReminderState {
  reminders: Reminder[]
  isLoading: boolean
  error: string | null
  loadReminders: () => Promise<void>
  createReminder: (reminder: Reminder) => Promise<void>
  updateReminder: (reminder: Reminder) => Promise<void>
  deleteReminder: (id: string) => Promise<void>
}

export const useReminderStore = create<ReminderState>((set) => ({
  reminders: [],
  isLoading: false,
  error: null,
  loadReminders: async () => {
    set({ isLoading: true, error: null })
    try {
      const reminders = await getAllRecords<Reminder>('reminders')
      set({ reminders, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  createReminder: async (reminder) => {
    set({ isLoading: true, error: null })
    try {
      await addRecord('reminders', reminder)
      set((state) => ({ reminders: [...state.reminders, reminder], isLoading: false }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  updateReminder: async (reminder) => {
    set({ isLoading: true, error: null })
    try {
      await updateRecord('reminders', reminder)
      set((state) => ({
        reminders: state.reminders.map((r) => (r.id === reminder.id ? reminder : r)),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  deleteReminder: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await deleteRecord('reminders', id)
      set((state) => ({
        reminders: state.reminders.filter((r) => r.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
}))
