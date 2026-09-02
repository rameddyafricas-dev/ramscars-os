import { useEffect, useState, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useReminderStore } from '../store/useReminderStore'
import { useVehicleStore } from '../store/useVehicleStore'
import { generateId } from '../utils/id'
import type { Reminder } from '../types'

export default function Reminders() {
  const { reminders, loadReminders, createReminder, updateReminder, deleteReminder } = useReminderStore()
  const { vehicles, loadVehicles } = useVehicleStore()

  const [searchParams] = useSearchParams()
  const initialVehicleId = searchParams.get('vehicle') || ''

  const [title, setTitle] = useState('')
  const [vehicleId, setVehicleId] = useState(initialVehicleId)
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [category, setCategory] = useState<Reminder['category']>('general')
  const [priority, setPriority] = useState<Reminder['priority']>('medium')
  const [notes, setNotes] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('pending')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadReminders()
    loadVehicles()
  }, [loadReminders, loadVehicles])

  const notifiedRef = useRef<Set<string>>(new Set())
  const [permission, setPermission] = useState<NotificationPermission>('default')

  const playBeep = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) return
      const ctx = new AudioContext()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.frequency.value = 880
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1)
      oscillator.start()
      oscillator.stop(ctx.currentTime + 1)
      ctx.close()
    } catch (e) {
      console.log('Beep failed', e)
    }
  }

  const checkDueReminders = () => {
    const now = new Date()
    reminders.forEach(reminder => {
      if (reminder.completed) return
      const due = new Date(reminder.dueDate + 'T' + (reminder.dueTime || '00:00'))
      if (due <= now && !notifiedRef.current.has(reminder.id)) {
        notifiedRef.current.add(reminder.id)
        if (permission === 'granted') {
          new Notification('RamsCars Reminder', { body: reminder.title })
        }
        playBeep()
      }
    })
  }

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(p => setPermission(p))
      }
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(checkDueReminders, 30000)
    checkDueReminders()
    return () => clearInterval(interval)
  }, [reminders, permission])

  const filteredReminders = useMemo(() => {
    let result = reminders.filter(r => {
      const vehicle = vehicles.find(v => v.id === r.vehicleId)
      const searchLower = search.toLowerCase().trim()
      const matchesSearch = searchLower === '' || `${r.title} ${vehicle?.make || ''} ${vehicle?.model || ''}`.toLowerCase().includes(searchLower)
      const isOverdue = !r.completed && new Date(r.dueDate + 'T' + (r.dueTime || '00:00')) < new Date()
      const matchesFilter = filter === 'all' ||
        (filter === 'pending' && !r.completed && !isOverdue) ||
        (filter === 'completed' && r.completed) ||
        (filter === 'overdue' && isOverdue)
      return matchesSearch && matchesFilter
    })
    return result.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || (a.dueTime || '').localeCompare(b.dueTime || ''))
  }, [reminders, vehicles, search, filter])

  const stats = useMemo(() => {
    const total = reminders.length
    const pending = reminders.filter(r => !r.completed).length
    const completed = reminders.filter(r => r.completed).length
    const overdue = reminders.filter(r => !r.completed && new Date(r.dueDate + 'T' + (r.dueTime || '00:00')) < new Date()).length
    return { total, pending, completed, overdue }
  }, [reminders])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !dueDate) return
    const now = new Date().toISOString()
    const reminder: Reminder = {
      id: generateId('rem'),
      title,
      vehicleId: vehicleId || undefined,
      dueDate,
      dueTime: dueTime || undefined,
      completed: false,
      notes,
      category,
      priority,
      createdAt: now,
      updatedAt: now,
    }
    await createReminder(reminder)
    resetForm()
  }

  const resetForm = () => {
    setTitle('')
    setVehicleId('')
    setDueDate('')
    setDueTime('')
    setNotes('')
    setCategory('general')
    setPriority('medium')
  }

  const toggleComplete = async (reminder: Reminder) => {
    await updateReminder({ ...reminder, completed: !reminder.completed, updatedAt: new Date().toISOString() })
  }

  const snoozeReminder = async (reminder: Reminder) => {
    // snooze by 1 hour from now
    const now = new Date()
    now.setHours(now.getHours() + 1)
    const date = now.toISOString().slice(0,10)
    const time = now.toTimeString().slice(0,5)
    await updateReminder({ ...reminder, dueDate: date, dueTime: time, updatedAt: new Date().toISOString() })
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reminders & Service History</h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{stats.pending} pending</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center"><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold">{stats.total}</p></div>
        <div className="card p-4 text-center"><p className="text-xs text-gray-500">Pending</p><p className="text-xl font-bold text-yellow-600">{stats.pending}</p></div>
        <div className="card p-4 text-center"><p className="text-xs text-gray-500">Overdue</p><p className="text-xl font-bold text-red-600">{stats.overdue}</p></div>
        <div className="card p-4 text-center"><p className="text-xs text-gray-500">Completed</p><p className="text-xl font-bold text-green-600">{stats.completed}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add reminder form */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Reminder</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input placeholder="Title (e.g. Service due)" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" required />
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5" required />
              <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={category} onChange={(e) => setCategory(e.target.value as Reminder['category'])} className="border border-gray-300 rounded-xl px-4 py-2.5">
                <option value="service">Service</option>
                <option value="payment">Payment</option>
                <option value="general">General</option>
                <option value="other">Other</option>
              </select>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Reminder['priority'])} className="border border-gray-300 rounded-xl px-4 py-2.5">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} disabled={!!initialVehicleId} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500">
              <option value="">No vehicle</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>{vehicle.year} {vehicle.make} {vehicle.model}</option>
              ))}
            </select>
            <textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" rows={2} />
            <button type="submit" className="w-full bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700">Add Reminder</button>
          </form>
        </div>

        {/* Reminder list */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <input type="text" placeholder="Search reminders" value={search} onChange={(e) => setSearch(e.target.value)} className="border border-gray-300 rounded-xl px-4 py-2.5 flex-1" />
            <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="border border-gray-300 rounded-xl px-4 py-2.5">
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Completed</option>
              <option value="all">All</option>
            </select>
          </div>

          {filteredReminders.length === 0 ? (
            <p className="text-gray-500 text-sm">No reminders found.</p>
          ) : (
            <div className="space-y-2">
              {filteredReminders.map(reminder => {
                const vehicle = vehicles.find(v => v.id === reminder.vehicleId)
                const isOverdue = !reminder.completed && new Date(reminder.dueDate + 'T' + (reminder.dueTime || '00:00')) < new Date()
                return (
                  <div key={reminder.id} className={`flex items-center justify-between bg-gray-50 rounded-xl p-3 ${isOverdue ? 'border-l-4 border-red-500' : ''}`}>
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium truncate ${reminder.completed ? 'line-through text-gray-500' : ''}`}>{reminder.title}</p>
                      <p className="text-sm text-gray-600">
                        {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'General'} • {reminder.dueDate} {reminder.dueTime && `• ${reminder.dueTime}`}
                      </p>
                      <div className="flex gap-2 mt-1">
                        {reminder.category && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{reminder.category}</span>}
                        {reminder.priority && <span className={`text-xs px-2 py-0.5 rounded-full ${reminder.priority === 'high' ? 'bg-red-100 text-red-700' : reminder.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{reminder.priority}</span>}
                      </div>
                      {reminder.notes && <p className="text-xs text-gray-500 mt-1 italic">{reminder.notes}</p>}
                    </div>
                    <div className="flex flex-col gap-1 ml-3">
                      {!reminder.completed && (
                        <>
                          <button onClick={() => snoozeReminder(reminder)} className="text-xs text-indigo-600 hover:underline">Snooze 1h</button>
                          <button onClick={() => toggleComplete(reminder)} className="text-xs text-green-600 hover:underline">Complete</button>
                        </>
                      )}
                      {reminder.completed && (
                        <button onClick={() => toggleComplete(reminder)} className="text-xs text-amber-600 hover:underline">Reopen</button>
                      )}
                      <button onClick={() => { if (window.confirm('Delete this reminder?')) deleteReminder(reminder.id) }} className="text-xs text-red-600 hover:underline">Delete</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
