import { useEffect, useState, useMemo } from 'react'
import { useReminderStore } from '../store/useReminderStore'
import { useVehicleStore } from '../store/useVehicleStore'
import { generateId } from '../utils/id'
import type { Reminder } from '../types'

export default function Reminders() {
  const { reminders, loadReminders, createReminder, updateReminder, deleteReminder } = useReminderStore()
  const { vehicles, loadVehicles } = useVehicleStore()

  const [title, setTitle] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadReminders()
    loadVehicles()
  }, [loadReminders, loadVehicles])

  const pendingReminders = useMemo(
    () => reminders.filter((r) => !r.completed).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [reminders]
  )
  const completedReminders = useMemo(
    () => reminders.filter((r) => r.completed).sort((a, b) => b.dueDate.localeCompare(a.dueDate)),
    [reminders]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !dueDate) return
    const now = new Date().toISOString()
    const reminder: Reminder = {
      id: generateId('rem'),
      title,
      vehicleId: vehicleId || undefined,
      dueDate,
      completed: false,
      notes,
      createdAt: now,
      updatedAt: now,
    }
    await createReminder(reminder)
    setTitle('')
    setVehicleId('')
    setDueDate('')
    setNotes('')
  }

  const toggleComplete = async (reminder: Reminder) => {
    await updateReminder({
      ...reminder,
      completed: !reminder.completed,
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reminders & Service History</h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {pendingReminders.length} pending
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Reminder</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              placeholder="Title (e.g. Service due)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
              required
            />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
              required
            />
            <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5">
              <option value="">No vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </option>
              ))}
            </select>
            <textarea
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
              rows={2}
            />
            <button type="submit" className="w-full bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700">
              Add Reminder
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pending Reminders</h2>
            {pendingReminders.length === 0 ? (
              <p className="text-gray-500 text-sm">No pending reminders.</p>
            ) : (
              <div className="space-y-2">
                {pendingReminders.map((reminder) => {
                  const vehicle = vehicles.find((v) => v.id === reminder.vehicleId)
                  return (
                    <div key={reminder.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">{reminder.title}</p>
                        <p className="text-sm text-gray-600">
                          {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'General'} • {reminder.dueDate}
                        </p>
                        {reminder.notes && <p className="text-xs text-gray-500 mt-1 italic">{reminder.notes}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => toggleComplete(reminder)} className="text-green-600 text-sm hover:underline">Complete</button>
                        <button onClick={() => { if (window.confirm('Delete this reminder?')) deleteReminder(reminder.id) }} className="text-red-600 text-sm hover:underline">Delete</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Completed Reminders</h2>
            {completedReminders.length === 0 ? (
              <p className="text-gray-500 text-sm">No completed reminders.</p>
            ) : (
              <div className="space-y-2">
                {completedReminders.map((reminder) => {
                  const vehicle = vehicles.find((v) => v.id === reminder.vehicleId)
                  return (
                    <div key={reminder.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3 opacity-70">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 line-through truncate">{reminder.title}</p>
                        <p className="text-sm text-gray-600">
                          {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'General'} • {reminder.dueDate}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => toggleComplete(reminder)} className="text-amber-600 text-sm hover:underline">Reopen</button>
                        <button onClick={() => deleteReminder(reminder.id)} className="text-red-600 text-sm hover:underline">Delete</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
