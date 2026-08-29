import { create } from 'zustand'
import { getAuditLogs, logAudit } from '../services/audit'
import type { AuditLog, AuditAction } from '../types'

interface AuditState {
  logs: AuditLog[]
  isLoading: boolean
  error: string | null
  loadLogs: () => Promise<void>
  addLog: (entityType: string, entityId: string, action: AuditAction, message: string, metadata?: Record<string, unknown>) => Promise<void>
}

export const useAuditStore = create<AuditState>((set) => ({
  logs: [],
  isLoading: false,
  error: null,
  loadLogs: async () => {
    set({ isLoading: true, error: null })
    try {
      const logs = await getAuditLogs()
      set({ logs, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  addLog: async (entityType, entityId, action, message, metadata) => {
    try {
      await logAudit(entityType, entityId, action, message, metadata)
      await getAuditLogs().then((logs) => set({ logs }))
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },
}))
