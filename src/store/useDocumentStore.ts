import { create } from 'zustand'
import { getAllRecords, addRecord, updateRecord, deleteRecord } from '../services/db'
import { logAudit } from '../services/audit'
import type { Document } from '../types'

interface DocumentState {
  documents: Document[]
  isLoading: boolean
  error: string | null
  loadDocuments: () => Promise<void>
  createDocument: (document: Document) => Promise<void>
  updateDocument: (document: Document) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  isLoading: false,
  error: null,
  loadDocuments: async () => {
    set({ isLoading: true, error: null })
    try {
      const documents = await getAllRecords<Document>('documents')
      set({ documents, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  createDocument: async (document) => {
    set({ isLoading: true, error: null })
    try {
      await addRecord('documents', document)
      await logAudit('Document', document.id, 'created', 'Document created')
      set((state) => ({ documents: [...state.documents, document], isLoading: false }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  updateDocument: async (document) => {
    set({ isLoading: true, error: null })
    try {
      await updateRecord('documents', document)
      await logAudit('Document', document.id, 'updated', 'Document updated')
      set((state) => ({
        documents: state.documents.map((d) => (d.id === document.id ? document : d)),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  deleteDocument: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await deleteRecord('documents', id)
      await logAudit('Document', id, 'deleted', 'Document deleted')
      set((state) => ({
        documents: state.documents.filter((d) => d.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
}))
