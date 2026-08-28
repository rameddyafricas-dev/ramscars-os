import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'

const menuItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/inspection', label: 'Inspection', icon: '🔍' },
  { path: '/inventory', label: 'Inventory', icon: '🚗' },
  { path: '/customers', label: 'Customers', icon: '👥' },
  { path: '/reports', label: 'Reports', icon: '📄' },
  { path: '/ai-insight', label: 'AI Insight', icon: '🤖' },
]

export default function SidebarLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex flex-col h-screen">
      {/* Top Bar */}
      <header className="bg-gray-900 text-white h-14 flex items-center px-4 shadow">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mr-4 p-2 rounded hover:bg-gray-700 focus:outline-none"
          aria-label="Toggle menu"
        >
          {/* Hamburger icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">RamsCars OS</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 bg-gray-900 text-white flex flex-col">
            <nav className="flex-1 p-2">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded mb-1 flex items-center gap-2 ${
                      isActive ? 'bg-gray-700' : 'hover:bg-gray-800'
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
