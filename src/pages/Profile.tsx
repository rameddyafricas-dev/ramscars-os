import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDealershipStore } from '../store/useDealershipStore'

export default function Profile() {
  const { profile, loadProfile, saveProfile, isLoading } = useDealershipStore()
  const [form, setForm] = useState({
    id: 'dealership',
    name: '',
    phone: '',
    email: '',
    address: '',
  })
  const [saved, setSaved] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    if (profile) {
      setForm(profile)
    }
  }, [profile])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveProfile(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dealer Profile</h1>
        <button
          onClick={() => navigate('/')}
          className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-50"
        >
          ← Dashboard
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading profile...</div>
      ) : (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div className="bg-indigo-50 rounded-xl p-4 mb-2">
            <p className="text-sm text-indigo-700">
              This profile is used across all inspections and reports. Save it once.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dealer Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-100"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              {saved ? '✓ Saved' : 'Save Profile'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-200 text-gray-800 px-5 py-2.5 rounded-xl hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
