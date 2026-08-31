import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type ThemeMode = 'light' | 'dark'
type ThemeName = 'indigo' | 'emerald' | 'amber' | 'dark-indigo' | 'dark-emerald' | 'dark-amber'

export default function Settings() {
  const [mode, setMode] = useState<ThemeMode>('light')
  const [theme, setTheme] = useState<ThemeName>('indigo')

  useEffect(() => {
    const savedMode = localStorage.getItem('ramscars_mode') as ThemeMode | null
    const savedTheme = localStorage.getItem('ramscars_theme') as ThemeName | null
    if (savedMode) setMode(savedMode)
    if (savedTheme) setTheme(savedTheme)
  }, [])

  useEffect(() => {
    localStorage.setItem('ramscars_mode', mode)
    localStorage.setItem('ramscars_theme', theme)

    const root = document.documentElement
    if (mode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    root.setAttribute('data-theme', theme)
  }, [mode, theme])

  const handleModeChange = (newMode: ThemeMode) => {
    setMode(newMode)
    if (newMode === 'light') {
      setTheme('indigo')
    } else {
      setTheme('dark-indigo')
    }
  }

  const handleThemeChange = (newTheme: ThemeName) => {
    setTheme(newTheme)
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
                className={`px-5 py-2.5 rounded-xl ${mode === 'light' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                Daylight
              </button>
              <button
                onClick={() => handleModeChange('dark')}
                className={`px-5 py-2.5 rounded-xl ${mode === 'dark' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                Night
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Themes</h3>
            <div className="grid grid-cols-3 gap-3">
              {mode === 'light' ? (
                <>
                  <button onClick={() => handleThemeChange('indigo')} className={`p-4 rounded-xl border-2 ${theme === 'indigo' ? 'border-indigo-500' : 'border-gray-200'}`}>
                    <div className="h-6 w-full rounded bg-indigo-500 mb-2"></div>
                    <span className="text-sm">Indigo</span>
                  </button>
                  <button onClick={() => handleThemeChange('emerald')} className={`p-4 rounded-xl border-2 ${theme === 'emerald' ? 'border-emerald-500' : 'border-gray-200'}`}>
                    <div className="h-6 w-full rounded bg-emerald-500 mb-2"></div>
                    <span className="text-sm">Emerald</span>
                  </button>
                  <button onClick={() => handleThemeChange('amber')} className={`p-4 rounded-xl border-2 ${theme === 'amber' ? 'border-amber-500' : 'border-gray-200'}`}>
                    <div className="h-6 w-full rounded bg-amber-500 mb-2"></div>
                    <span className="text-sm">Amber</span>
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => handleThemeChange('dark-indigo')} className={`p-4 rounded-xl border-2 ${theme === 'dark-indigo' ? 'border-indigo-500' : 'border-gray-700'}`}>
                    <div className="h-6 w-full rounded bg-indigo-400 mb-2"></div>
                    <span className="text-sm">Indigo</span>
                  </button>
                  <button onClick={() => handleThemeChange('dark-emerald')} className={`p-4 rounded-xl border-2 ${theme === 'dark-emerald' ? 'border-emerald-500' : 'border-gray-700'}`}>
                    <div className="h-6 w-full rounded bg-emerald-400 mb-2"></div>
                    <span className="text-sm">Emerald</span>
                  </button>
                  <button onClick={() => handleThemeChange('dark-amber')} className={`p-4 rounded-xl border-2 ${theme === 'dark-amber' ? 'border-amber-500' : 'border-gray-700'}`}>
                    <div className="h-6 w-full rounded bg-amber-400 mb-2"></div>
                    <span className="text-sm">Amber</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/data" className="card p-5 hover:bg-gray-50">
          <h3 className="font-semibold">Data Management</h3>
          <p className="text-sm opacity-70 mt-1">Export, restore, or clear all business data.</p>
        </Link>
      </div>

      <div className="card p-5 mt-6">
        <h3 className="font-semibold">About</h3>
        <p className="text-sm opacity-70 mt-1">RamsCars Operating System 2.0</p>
        <p className="text-xs opacity-50 mt-1">Local-first, offline-capable vehicle dealership OS.</p>
      </div>
    </div>
  )
}
