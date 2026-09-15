import { create } from 'zustand'

interface ToastState {
  message: string | null
  type: 'info' | 'success' | 'error'
  show: (message: string, type?: 'info' | 'success' | 'error') => void
  clear: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  type: 'info',
  show: (message, type = 'info') => {
    set({ message, type })
  },
  clear: () => {
    set({ message: null })
  },
}))
