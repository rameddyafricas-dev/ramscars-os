import { useEffect, useState } from 'react'
import { useCustomerStore } from '../store/useCustomerStore'
import { useLeadStore } from '../store/useLeadStore'
import { generateId } from '../utils/id'
import type { Customer, CustomerRole, Lead, LeadStatus } from '../types'

export default function Customers() {
  const {
    customers,
    loadCustomers,
    createCustomer,
    isLoading: customerLoading,
  } = useCustomerStore()
  const {
    leads,
    loadLeads,
    createLead,
    isLoading: leadLoading,
  } = useLeadStore()

  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    role: 'other' as CustomerRole,
    notes: '',
  })

  const [leadForm, setLeadForm] = useState({
    customerId: '',
    vehicleId: '',
    source: '',
    status: 'new' as LeadStatus,
    notes: '',
  })

  useEffect(() => {
    loadCustomers()
    loadLeads()
  }, [])

  const handleCustomerChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setCustomerForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const now = new Date().toISOString()
    const customer: Customer = {
      id: generateId('cust'),
      name: customerForm.name,
      phone: customerForm.phone,
      email: customerForm.email,
      address: customerForm.address,
      role: customerForm.role,
      notes: customerForm.notes,
      createdAt: now,
      updatedAt: now,
    }
    await createCustomer(customer)
    setCustomerForm({
      name: '',
      phone: '',
      email: '',
      address: '',
      role: 'other',
      notes: '',
    })
  }

  const handleLeadChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setLeadForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadForm.customerId) return
    const now = new Date().toISOString()
    const lead: Lead = {
      id: generateId('lead'),
      customerId: leadForm.customerId,
      vehicleId: leadForm.vehicleId || undefined,
      source: leadForm.source,
      status: leadForm.status,
      notes: leadForm.notes,
      createdAt: now,
      updatedAt: now,
    }
    await createLead(lead)
    setLeadForm({
      customerId: '',
      vehicleId: '',
      source: '',
      status: 'new',
      notes: '',
    })
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Customers & Leads</h1>

      {/* Customers Section */}
      <div className="card p-4">
        <h2 className="text-lg font-semibold mb-4">Add Customer</h2>
        <form onSubmit={handleCustomerSubmit} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Name *</label>
            <input
              type="text"
              name="name"
              value={customerForm.name}
              onChange={handleCustomerChange}
              className="mt-1 w-full border rounded px-2 py-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Phone</label>
            <input
              type="text"
              name="phone"
              value={customerForm.phone}
              onChange={handleCustomerChange}
              className="mt-1 w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={customerForm.email}
              onChange={handleCustomerChange}
              className="mt-1 w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Role</label>
            <select
              name="role"
              value={customerForm.role}
              onChange={handleCustomerChange}
              className="mt-1 w-full border rounded px-2 py-1"
            >
              <option value="owner">Owner</option>
              <option value="buyer">Buyer</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium">Address</label>
            <input
              type="text"
              name="address"
              value={customerForm.address}
              onChange={handleCustomerChange}
              className="mt-1 w-full border rounded px-2 py-1"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium">Notes</label>
            <textarea
              name="notes"
              value={customerForm.notes}
              onChange={handleCustomerChange}
              className="mt-1 w-full border rounded px-2 py-1"
              rows={2}
            />
          </div>
          <div className="col-span-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add Customer
            </button>
          </div>
        </form>
      </div>

      {/* Customers List */}
      <div className="card p-4">
        <h2 className="text-lg font-semibold mb-2">Customers ({customers.length})</h2>
        {customerLoading ? (
          <p>Loading...</p>
        ) : customers.length === 0 ? (
          <p className="text-gray-600">No customers yet.</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Phone</th>
                <th className="px-4 py-2 text-left">Role</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t">
                  <td className="px-4 py-2">{customer.name}</td>
                  <td className="px-4 py-2">{customer.phone || '-'}</td>
                  <td className="px-4 py-2">{customer.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Leads Section */}
      <div className="card p-4">
        <h2 className="text-lg font-semibold mb-4">Add Lead</h2>
        <form onSubmit={handleLeadSubmit} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Customer *</label>
            <select
              name="customerId"
              value={leadForm.customerId}
              onChange={handleLeadChange}
              className="mt-1 w-full border rounded px-2 py-1"
              required
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Source</label>
            <input
              type="text"
              name="source"
              value={leadForm.source}
              onChange={handleLeadChange}
              className="mt-1 w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Vehicle ID (optional)</label>
            <input
              type="text"
              name="vehicleId"
              value={leadForm.vehicleId}
              onChange={handleLeadChange}
              className="mt-1 w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Status</label>
            <select
              name="status"
              value={leadForm.status}
              onChange={handleLeadChange}
              className="mt-1 w-full border rounded px-2 py-1"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="viewing">Viewing</option>
              <option value="negotiating">Negotiating</option>
              <option value="closed_lost">Closed Lost</option>
              <option value="closed_won">Closed Won</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium">Notes</label>
            <textarea
              name="notes"
              value={leadForm.notes}
              onChange={handleLeadChange}
              className="mt-1 w-full border rounded px-2 py-1"
              rows={2}
            />
          </div>
          <div className="col-span-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Add Lead
            </button>
          </div>
        </form>
      </div>

      {/* Leads List */}
      <div className="card p-4">
        <h2 className="text-lg font-semibold mb-2">Leads ({leads.length})</h2>
        {leadLoading ? (
          <p>Loading...</p>
        ) : leads.length === 0 ? (
          <p className="text-gray-600">No leads yet.</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-4 py-2 text-left">Customer</th>
                <th className="px-4 py-2 text-left">Source</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const customer = customers.find((c) => c.id === lead.customerId)
                return (
                  <tr key={lead.id} className="border-t">
                    <td className="px-4 py-2">{customer?.name || lead.customerId}</td>
                    <td className="px-4 py-2">{lead.source || '-'}</td>
                    <td className="px-4 py-2">{lead.status}</td>
                    <td className="px-4 py-2">{lead.notes || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
