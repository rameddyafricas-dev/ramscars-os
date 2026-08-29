import { create } from 'zustand'
import { getAllRecords, addRecord, updateRecord } from '../services/db'
import { logAudit } from '../services/audit'
import type { Customer } from '../types'

interface CustomerState {
  customers: Customer[]
  isLoading: boolean
  error: string | null
  loadCustomers: () => Promise<void>
  createCustomer: (customer: Customer) => Promise<void>
  updateCustomer: (customer: Customer) => Promise<void>
}

export const useCustomerStore = create<CustomerState>((set) => ({
  customers: [],
  isLoading: false,
  error: null,
  loadCustomers: async () => {
    set({ isLoading: true, error: null })
    try {
      const customers = await getAllRecords<Customer>('customers')
      set({ customers, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  createCustomer: async (customer) => {
    set({ isLoading: true, error: null })
    try {
      await addRecord('customers', customer)
      await logAudit('Customer', customer.id, 'created', 'Customer created')
      set((state) => ({
        customers: [...state.customers, customer],
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  updateCustomer: async (customer) => {
    set({ isLoading: true, error: null })
    try {
      await updateRecord('customers', customer)
      await logAudit('Customer', customer.id, 'updated', 'Customer updated')
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === customer.id ? customer : c
        ),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
}))
