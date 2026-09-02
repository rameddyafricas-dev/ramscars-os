import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCustomerStore } from '../store/useCustomerStore'
import { useSaleStore } from '../store/useSaleStore'
import { useVehicleStore } from '../store/useVehicleStore'
import { generateId } from '../utils/id'
import type { Customer, CustomerRole } from '../types'

export default function Customers() {
  const { customers, loadCustomers, createCustomer, updateCustomer, deleteCustomer, isLoading } = useCustomerStore()
  const { sales, loadSales } = useSaleStore()
  const { vehicles, loadVehicles } = useVehicleStore()
  const [searchParams] = useSearchParams()
  const vehicleId = searchParams.get('vehicle') || ''

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | CustomerRole>('all')
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

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
    loadSales()
    loadVehicles()
  }, [loadCustomers, loadSales, loadVehicles])

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(search.toLowerCase())
      const matchesRole = roleFilter === 'all' || c.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [customers, search, roleFilter])

  const stats = useMemo(() => {
    const total = customers.length
    const owners = customers.filter(c => c.role === 'owner').length
    const buyers = customers.filter(c => c.role === 'buyer').length
    const others = customers.filter(c => c.role === 'other').length
    return { total, owners, buyers, others }
  }, [customers])

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCustomer) {
      const updated: Customer = { ...editingCustomer, ...customerForm, updatedAt: new Date().toISOString() }
      await updateCustomer(updated)
      setEditingCustomer(null)
    } else {
      const now = new Date().toISOString()
      const customer: Customer = {
        id: generateId('cust'),
        ...customerForm,
        createdAt: now,
        updatedAt: now,
      }
      await createCustomer(customer)
    }
    setCustomerForm({ name: '', phone: '', email: '', address: '', role: 'other', notes: '' })
  }

  const startEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setCustomerForm({ name: customer.name, phone: customer.phone || '', email: customer.email || '', address: customer.address || '', role: customer.role, notes: customer.notes || '' })
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this customer?')) {
      await deleteCustomer(id)
      if (editingCustomer?.id === id) {
        setEditingCustomer(null)
        setCustomerForm({ name: '', phone: '', email: '', address: '', role: 'other', notes: '' })
      }
    }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        {vehicleId && <p className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">Vehicle: {vehicleId}</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center"><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold">{stats.total}</p></div>
        <div className="card p-4 text-center"><p className="text-xs text-gray-500">Owners</p><p className="text-xl font-bold text-indigo-600">{stats.owners}</p></div>
        <div className="card p-4 text-center"><p className="text-xs text-gray-500">Buyers</p><p className="text-xl font-bold text-green-600">{stats.buyers}</p></div>
        <div className="card p-4 text-center"><p className="text-xs text-gray-500">Others</p><p className="text-xl font-bold text-amber-600">{stats.others}</p></div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-col md:flex-row gap-3">
        <input type="text" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5 md:w-80" />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as any)} className="border border-gray-300 rounded-xl px-4 py-2.5">
          <option value="all">All roles</option>
          <option value="owner">Owner</option>
          <option value="buyer">Buyer</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Customer form */}
      <div className="card p-5 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h2>
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
          <div className="col-span-full flex gap-2">
            <button type="submit" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700">{editingCustomer ? 'Update Customer' : 'Add Customer'}</button>
            {editingCustomer && <button type="button" onClick={() => { setEditingCustomer(null); setCustomerForm({ name: '', phone: '', email: '', address: '', role: 'other', notes: '' }) }} className="bg-gray-200 text-gray-800 px-5 py-2.5 rounded-xl">Cancel</button>}
          </div>
        </form>
      </div>

      {/* Customers list */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Customers ({filteredCustomers.length})</h2>
        {isLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : filteredCustomers.length === 0 ? (
          <p className="text-gray-500 text-sm">No customers found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((customer) => {
              const customerSales = sales.filter(s => s.buyerId === customer.id)
              const associatedVehicles = vehicles.filter(v => customerSales.some(s => s.vehicleId === v.id))
              return (
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
                  <div className="mt-2 text-xs text-gray-500">
                    {customerSales.length > 0 && <p>Sales: {customerSales.length}</p>}
                    {associatedVehicles.length > 0 && <p>Vehicles: {associatedVehicles.map(v => v.model).join(', ')}</p>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => startEdit(customer)} className="text-indigo-600 text-sm hover:underline">Edit</button>
                    <button onClick={() => handleDelete(customer.id)} className="text-red-600 text-sm hover:underline">Delete</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
