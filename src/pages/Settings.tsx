import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type ThemeMode = 'light' | 'dark'
type ThemeName = 'indigo' | 'emerald' | 'amber' | 'dark-indigo' | 'dark-emerald' | 'dark-amber'

export default function Settings() {
  const [mode, setMode] = useState<ThemeMode>('light')
  const [lightTheme, setLightTheme] = useState<ThemeName | ''>('')
  const [darkTheme, setDarkTheme] = useState<ThemeName | ''>('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const savedMode = localStorage.getItem('ramscars_mode') as ThemeMode | null
    const savedLight = localStorage.getItem('ramscars_light_theme') as ThemeName | null
    const savedDark = localStorage.getItem('ramscars_dark_theme') as ThemeName | null

    if (savedMode === 'dark' || savedMode === 'light') setMode(savedMode)
    if (savedLight) setLightTheme(savedLight)
    if (savedDark) setDarkTheme(savedDark)
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('ramscars_mode', mode)
    localStorage.setItem('ramscars_light_theme', lightTheme)
    localStorage.setItem('ramscars_dark_theme', darkTheme)

    const root = document.documentElement
    if (mode === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    root.setAttribute('data-theme', mode === 'light' ? lightTheme : darkTheme)
  }, [mode, lightTheme, darkTheme])

  const currentTheme: ThemeName | '' = mode === 'light' ? lightTheme : darkTheme

  const handleModeChange = (newMode: ThemeMode) => setMode(newMode)

  const handleThemeChange = (newTheme: ThemeName) => {
    if (mode === 'light') setLightTheme(newTheme)
    else setDarkTheme(newTheme)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Appearance</h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Mode</h3>
            <div className="flex gap-3">
              <button
                onClick={() => handleModeChange('light')}
                className={`px-5 py-2.5 rounded-xl ${mode === 'light' ? 'btn-primary' : 'bg-gray-200 text-gray-800'}`}
              >
                Daylight
              </button>
              <button
                onClick={() => handleModeChange('dark')}
                className={`px-5 py-2.5 rounded-xl ${mode === 'dark' ? 'btn-primary' : 'bg-gray-200 text-gray-800'}`}
              >
                Night
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Themes</h3>
            {currentTheme === '' && <p className="text-sm text-gray-500 mb-3">Select theme</p>}
            <div className="grid grid-cols-3 gap-4">
              {mode === 'light' ? (
                <>
                  {[
                    { name: 'indigo', label: 'Classic Indigo', gradient: 'from-indigo-500 to-purple-600' },
                    { name: 'emerald', label: 'Fresh Emerald', gradient: 'from-emerald-400 to-teal-500' },
                    { name: 'amber', label: 'Golden Amber', gradient: 'from-amber-400 to-orange-500' },
                  ].map((t) => (
                    <button
                      key={t.name}
                      onClick={() => handleThemeChange(t.name as ThemeName)}
                      className={`p-4 rounded-xl border-2 transition-all ${currentTheme === t.name ? 'border-[var(--accent)] scale-105' : 'border-[var(--border)]'}`}
                      style={{ background: 'var(--surface)' }}
                    >
                      <div className={`h-10 w-full rounded-lg bg-gradient-to-br ${t.gradient} mb-3`}></div>
                      <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{t.label}</span>
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {[
                    { name: 'dark-indigo', label: 'Midnight Indigo', gradient: 'from-indigo-700 to-purple-800' },
                    { name: 'dark-emerald', label: 'Forest Emerald', gradient: 'from-emerald-700 to-green-900' },
                    { name: 'dark-amber', label: 'Charcoal Amber', gradient: 'from-amber-600 to-orange-800' },
                  ].map((t) => (
                    <button
                      key={t.name}
                      onClick={() => handleThemeChange(t.name as ThemeName)}
                      className={`p-4 rounded-xl border-2 transition-all ${currentTheme === t.name ? 'border-[var(--accent)] scale-105' : 'border-[var(--border)]'}`}
                      style={{ background: 'var(--surface)' }}
                    >
                      <div className={`h-10 w-full rounded-lg bg-gradient-to-br ${t.gradient} mb-3`}></div>
                      <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{t.label}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/data" className="card p-5 hover:bg-[var(--hover-bg)]">
          <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Data Management</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Export, restore, or clear all business data.</p>
        </Link>
      </div>

      <div className="card p-5 mt-6">
        <h3 className="font-semibold" style={{ color: 'var(--text)' }}>About</h3>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>RamsCars Operating System 2.0</p>
        <p className="text-xs mt-1 opacity-70" style={{ color: 'var(--text-muted)' }}>Local-first, offline-capable vehicle dealership OS.</p>
      </div>
    </div>
  )
}
