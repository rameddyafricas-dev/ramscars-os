import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCustomerStore } from '../store/useCustomerStore'
import { generateId } from '../utils/id'
import type { Customer, CustomerRole } from '../types'

export default function Customers() {
  const { customers, loadCustomers, createCustomer, isLoading } = useCustomerStore()
  const [searchParams] = useSearchParams()
  const vehicleId = searchParams.get('vehicle') || ''

  const [search, setSearch] = useState('')
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    role: 'other' as CustomerRole,
    notes: '',
  })

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) =>
      `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(search.toLowerCase())
    )
  }, [customers, search])

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

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        {vehicleId && (
          <p className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            Vehicle: {vehicleId}
          </p>
        )}
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-100 md:w-80"
        />
      </div>

      <div className="space-y-6">
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

        <div className="card p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Customers ({filteredCustomers.length})</h2>
          {isLoading ? (
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
    </div>
  )
}
