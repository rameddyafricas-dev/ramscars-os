import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SidebarLayout from './layout/SidebarLayout'
import Dashboard from './pages/Dashboard'
import Inspection from './pages/Inspection'
import Inventory from './pages/Inventory'
import Customers from './pages/Customers'
import Reports from './pages/Reports'
import AIInsight from './pages/AIInsight'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<SidebarLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inspection" element={<Inspection />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/ai-insight" element={<AIInsight />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
