import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SidebarLayout from './layout/SidebarLayout'
import Dashboard from './pages/Dashboard'
import Inspection from './pages/Inspection'
import Inventory from './pages/Inventory'
import InspectionView from './pages/InspectionView'
import Customers from './pages/Customers'
import Reports from './pages/Reports'
import AIInsight from './pages/AIInsight'
import Profile from './pages/Profile'
import DataManagement from './pages/DataManagement'
import Settings from './pages/Settings'
import Marketing from './pages/Marketing'
import DocumentsMedia from './pages/DocumentsMedia'
import Sales from './pages/Sales'
import Finance from './pages/Finance'
import Consignment from './pages/Consignment'
import Documents from './pages/Documents'
import Reminders from './pages/Reminders'
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
            <Route path="/inspection/view/:id" element={<InspectionView />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/ai-insight" element={<AIInsight />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/data" element={<DataManagement />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/marketing" element={<Marketing />} />
            <Route path="/media" element={<DocumentsMedia />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/consignment" element={<Consignment />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/reminders" element={<Reminders />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
