import { useEffect, useState, useMemo } from 'react'
import { useCustomerStore } from '../store/useCustomerStore'
import { useLeadStore } from '../store/useLeadStore'
import { generateId } from '../utils/id'
import type { Customer, CustomerRole, Lead, LeadStatus } from '../types'

export default function Customers() {
  const { customers, loadCustomers, createCustomer, isLoading: customerLoading } = useCustomerStore()
  const { leads, loadLeads, createLead, isLoading: leadLoading } = useLeadStore()

  const [activeTab, setActiveTab] = useState<'customers' | 'leads'>('customers')
  const [search, setSearch] = useState('')

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
  }, [loadCustomers, loadLeads])

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) =>
      `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(search.toLowerCase())
    )
  }, [customers, search])

  const filteredLeads = useMemo(() => {
    const lower = search.toLowerCase()
    return leads.filter((l) => {
      const customer = customers.find((c) => c.id === l.customerId)
      return `${customer?.name || ''} ${l.source || ''} ${l.status}`.toLowerCase().includes(lower)
    })
  }, [leads, customers, search])

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
    setCustomerForm({ name: '', phone: '', email: '', address: '', role: 'other', notes: '' })
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
    setLeadForm({ customerId: '', vehicleId: '', source: '', status: 'new', notes: '' })
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Customers & Leads</h1>
      </div>

      {/* Search + Tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <input
          type="text"
          placeholder="Search customers or leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-100 md:w-80"
        />
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'customers' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Customers ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'leads' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Leads ({leads.length})
          </button>
        </div>
      </div>

      {activeTab === 'customers' ? (
        <div className="space-y-6">
          {/* Add Customer */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Add Customer</h2>
            <form onSubmit={handleCustomerSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="name" placeholder="Name *" value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} className="border border-gray-300 rounded-xl px-4 py-2.5" required />
              <input name="phone" placeholder="Phone" value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} className="border border-gray-300 rounded-xl px-4 py-2.5" />
              <input name="email" placeholder="Email" type="email" value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} className="border border-gray-300 rounded-xl px-4 py-2.5" />
              <select value={customerForm.role} onChange={(e) => setCustomerForm({ ...customerForm, role: e.target.value as CustomerRole })} className="border border-gray-300 rounded-xl px-4 py-2.5">
                <option value="owner">Owner</option>
                <option value="buyer">Buyer</option>
                <option value="other">Other</option>
              </select>
              <input name="address" placeholder="Address" value={customerForm.address} onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })} className="border border-gray-300 rounded-xl px-4 py-2.5 col-span-full" />
              <textarea placeholder="Notes" value={customerForm.notes} onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })} className="border border-gray-300 rounded-xl px-4 py-2.5 col-span-full" rows={2} />
              <div className="col-span-full">
                <button type="submit" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700">Add Customer</button>
              </div>
            </form>
          </div>

          {/* Customers list */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Customers ({filteredCustomers.length})</h2>
            {customerLoading ? (
              <p className="text-gray-500">Loading...</p>
            ) : filteredCustomers.length === 0 ? (
              <p className="text-gray-500 text-sm">No customers found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCustomers.map((customer) => (
                  <div key={customer.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800">{customer.name}</span>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full capitalize">{customer.role}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                      {customer.phone && <p>📞 {customer.phone}</p>}
                      {customer.email && <p>✉️ {customer.email}</p>}
                      {customer.address && <p>📍 {customer.address}</p>}
                      {customer.notes && <p className="italic">{customer.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Add Lead */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Add Lead</h2>
            <form onSubmit={handleLeadSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={leadForm.customerId} onChange={(e) => setLeadForm({ ...leadForm, customerId: e.target.value })} className="border border-gray-300 rounded-xl px-4 py-2.5" required>
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
              <input placeholder="Vehicle ID (optional)" value={leadForm.vehicleId} onChange={(e) => setLeadForm({ ...leadForm, vehicleId: e.target.value })} className="border border-gray-300 rounded-xl px-4 py-2.5" />
              <input placeholder="Source (e.g. Facebook)" value={leadForm.source} onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })} className="border border-gray-300 rounded-xl px-4 py-2.5" />
              <select value={leadForm.status} onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value as LeadStatus })} className="border border-gray-300 rounded-xl px-4 py-2.5">
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="viewing">Viewing</option>
                <option value="negotiating">Negotiating</option>
                <option value="closed_lost">Closed Lost</option>
                <option value="closed_won">Closed Won</option>
              </select>
              <textarea placeholder="Notes" value={leadForm.notes} onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })} className="border border-gray-300 rounded-xl px-4 py-2.5 col-span-full" rows={2} />
              <div className="col-span-full">
                <button type="submit" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700">Add Lead</button>
              </div>
            </form>
          </div>

          {/* Leads list */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Leads ({filteredLeads.length})</h2>
            {leadLoading ? (
              <p className="text-gray-500">Loading...</p>
            ) : filteredLeads.length === 0 ? (
              <p className="text-gray-500 text-sm">No leads found.</p>
            ) : (
              <div className="space-y-2">
                {filteredLeads.map((lead) => {
                  const customer = customers.find((c) => c.id === lead.customerId)
                  return (
                    <div key={lead.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{customer?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-600">{lead.source || '—'}</p>
                      </div>
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full capitalize">{lead.status.replace('_', ' ')}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
