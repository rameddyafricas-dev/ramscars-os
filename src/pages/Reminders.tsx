import { useEffect, useState, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useReminderStore } from '../store/useReminderStore'
import { useVehicleStore } from '../store/useVehicleStore'
import { generateId } from '../utils/id'
import type { Reminder } from '../types'

export default function Reminders() {
  const { reminders, loadReminders, createReminder, updateReminder, deleteReminder } = useReminderStore()
  const { vehicles, loadVehicles } = useVehicleStore()

  const [title, setTitle] = useState('')
  const [searchParams] = useSearchParams()
  const initialVehicleId = searchParams.get('vehicle') || ''
  const [vehicleId, setVehicleId] = useState(initialVehicleId)
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadReminders()
    loadVehicles()
  }, [loadReminders, loadVehicles])

  const notifiedRef = useRef<Set<string>>(new Set());
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const playBeep = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 1);
      ctx.close();
    } catch (e) {
      console.log('Beep failed', e);
    }
  };

  const checkDueReminders = () => {
    const now = new Date();
    reminders.forEach(reminder => {
      if (reminder.completed) return;
      const due = new Date(reminder.dueDate + 'T' + (reminder.dueTime || '00:00'));
      if (due <= now && !notifiedRef.current.has(reminder.id)) {
        notifiedRef.current.add(reminder.id);
        if (permission === 'granted') {
          new Notification('RamsCars Reminder', { body: reminder.title });
        }
        playBeep();
      }
    });
  };

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(p => setPermission(p));
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(checkDueReminders, 30000);
    checkDueReminders();
    return () => clearInterval(interval);
  }, [reminders, permission]);

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
      dueTime: dueTime || undefined,
      completed: false,
      notes,
      createdAt: now,
      updatedAt: now,
    }
    await createReminder(reminder)
    setTitle('')
    setVehicleId('')
    setDueDate(''); setDueTime('')
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
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5"
            />
            <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} disabled={!!initialVehicleId} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500">
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
