import { create } from 'zustand'

export interface AdDraft {
  id: string
  vehicleId: string
  title: string
  text: string
  photo?: string
  createdAt: string
}

interface AdDraftsState {
  drafts: AdDraft[]
  loadDrafts: () => void
  saveDraft: (draft: AdDraft) => void
  removeDraft: (id: string) => void
}

const STORAGE_KEY = 'ramscars_ad_drafts'

function getStoredDrafts(): AdDraft[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const useAdDraftsStore = create<AdDraftsState>((set) => ({
  drafts: [],
  loadDrafts: () => {
    set({ drafts: getStoredDrafts() })
  },
  saveDraft: (draft) => {
    set((state) => {
      const existing = state.drafts.find(d => d.id === draft.id)
      const drafts = existing
        ? state.drafts.map(d => d.id === draft.id ? draft : d)
        : [draft, ...state.drafts]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
      return { drafts }
    })
  },
  removeDraft: (id) => {
    set((state) => {
      const drafts = state.drafts.filter(d => d.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
      return { drafts }
    })
  },
}))
