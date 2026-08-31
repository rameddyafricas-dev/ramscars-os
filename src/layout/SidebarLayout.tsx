import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'

const menuItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/inspection', label: 'Inspection', icon: '🔍' },
  { path: '/inventory', label: 'Inventory', icon: '🚗' },
  { path: '/media', label: 'Media', icon: '🖼️' },
  { path: '/documents', label: 'Documents', icon: '📄' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function SidebarLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = useNavigate()
  const profileRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
      if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setSidebarOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [sidebarOpen])

  const handleNavClick = () => setSidebarOpen(false)

  const goToProfile = () => {
    setProfileOpen(false)
    setSidebarOpen(false)
    navigate('/profile')
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg)' }}>
      <header className="h-20 flex items-center px-4 shadow-soft sticky top-0 z-40" style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mr-3 p-2 rounded-xl hover:bg-[var(--hover-bg)] transition-colors"
          style={{ color: 'var(--text)' }}
          aria-label="Toggle menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="leading-tight">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚗</span>
            <span className="text-lg font-bold" style={{ color: 'var(--text)' }}>RamsCars Dealership</span>
          </div>
          <span className="text-xs block opacity-75 mt-0.5" style={{ color: 'var(--text-muted)' }}>Inspected, Transparent and Trusted</span>
        </div>

        <div className="ml-auto relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-10 h-10 rounded-full hover:bg-[var(--hover-bg)] flex items-center justify-center overflow-hidden transition-colors"
            style={{ border: `1px solid ${'var(--border)'}` }}
            title="Profile"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6" style={{ color: 'var(--text-muted)' }}>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6v1H4v-1z" />
            </svg>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl shadow-card border overflow-hidden z-50" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <button onClick={goToProfile} className="w-full text-left px-4 py-3 hover:bg-[var(--hover-bg)] transition-colors">
                <p className="font-medium" style={{ color: 'var(--text)' }}>Dealer Profile</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Manage dealership details</p>
              </button>
              <button onClick={() => setProfileOpen(false)} className="w-full text-left px-4 py-3 hover:bg-[var(--hover-bg)] transition-colors border-t" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                Close
              </button>
            </div>
          )}
        </div>
      </header>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30" onClick={() => setSidebarOpen(false)} />
      )}

      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full w-72 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'var(--sidebar-bg)' }}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}><span className="text-xl">🚗</span> RamsCars Dealership</span>
          <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl hover:bg-[var(--hover-bg)]" style={{ color: 'var(--text)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'shadow-card' : 'hover:bg-[var(--hover-bg)]'
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? 'var(--accent-text)' : 'var(--text)',
              })}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <main className="flex-1 overflow-y-auto p-4 md:p-6" style={{ color: 'var(--text)' }}>
        <Outlet />
      </main>
    </div>
  )
}
