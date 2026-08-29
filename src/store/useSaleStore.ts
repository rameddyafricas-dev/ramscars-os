import { create } from 'zustand'
import { getAllRecords, addRecord, updateRecord } from '../services/db'
import { logAudit } from '../services/audit'
import type { Sale, Payment } from '../types'

interface SaleState {
  sales: Sale[]
  payments: Payment[]
  isLoading: boolean
  error: string | null
  loadSales: () => Promise<void>
  loadPayments: () => Promise<void>
  createSale: (sale: Sale) => Promise<void>
  updateSale: (sale: Sale) => Promise<void>
  createPayment: (payment: Payment) => Promise<void>
}

export const useSaleStore = create<SaleState>((set) => ({
  sales: [],
  payments: [],
  isLoading: false,
  error: null,
  loadSales: async () => {
    set({ isLoading: true, error: null })
    try {
      const sales = await getAllRecords<Sale>('sales')
      set({ sales, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  loadPayments: async () => {
    set({ isLoading: true, error: null })
    try {
      const payments = await getAllRecords<Payment>('payments')
      set({ payments, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  createSale: async (sale) => {
    set({ isLoading: true, error: null })
    try {
      await addRecord('sales', sale)
      await logAudit('Sale', sale.id, 'created', 'Sale created')
      set((state) => ({ sales: [...state.sales, sale], isLoading: false }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  updateSale: async (sale) => {
    set({ isLoading: true, error: null })
    try {
      await updateRecord('sales', sale)
      await logAudit('Sale', sale.id, 'updated', 'Sale updated')
      set((state) => ({
        sales: state.sales.map((s) => (s.id === sale.id ? sale : s)),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  createPayment: async (payment) => {
    set({ isLoading: true, error: null })
    try {
      await addRecord('payments', payment)
      await logAudit('Sale', payment.saleId, 'payment_received', 'Payment received')
      set((state) => ({ payments: [...state.payments, payment], isLoading: false }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
}))
