import { create } from 'zustand'
import { getAllRecords, addRecord, updateRecord, deleteRecord } from '../services/db'
import { logAudit } from '../services/audit'
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
      await logAudit('Reminder', reminder.id, 'created', 'Reminder created')
      set((state) => ({ reminders: [...state.reminders, reminder], isLoading: false }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  updateReminder: async (reminder) => {
    set({ isLoading: true, error: null })
    try {
      await updateRecord('reminders', reminder)
      await logAudit('Reminder', reminder.id, 'updated', 'Reminder updated')
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
      await logAudit('Reminder', id, 'deleted', 'Reminder deleted')
      set((state) => ({
        reminders: state.reminders.filter((r) => r.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
}))
