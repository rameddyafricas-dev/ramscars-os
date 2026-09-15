import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SidebarLayout from './layout/SidebarLayout'
import ErrorBoundary from './components/ErrorBoundary'
import ToastContainer from './components/ToastContainer'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Inspection = lazy(() => import('./pages/Inspection'))
const Inventory = lazy(() => import('./pages/Inventory'))
const InspectionView = lazy(() => import('./pages/InspectionView'))
const Customers = lazy(() => import('./pages/Customers'))
const Reports = lazy(() => import('./pages/Reports'))
const Profile = lazy(() => import('./pages/Profile'))
const DataManagement = lazy(() => import('./pages/DataManagement'))
const Settings = lazy(() => import('./pages/Settings'))
const Marketing = lazy(() => import('./pages/Marketing'))
const DocumentsMedia = lazy(() => import('./pages/DocumentsMedia'))
const Sales = lazy(() => import('./pages/Sales'))
const Documents = lazy(() => import('./pages/Documents'))
const Reminders = lazy(() => import('./pages/Reminders'))
const OwnerPayouts = lazy(() => import('./pages/OwnerPayouts'))
const OwnerStatement = lazy(() => import('./pages/OwnerStatement'))
const HpiTraffic = lazy(() => import('./pages/HpiTraffic'))
const Communications = lazy(() => import('./pages/Communications'))

function App() {
  return (
    <ErrorBoundary>
      <ToastContainer />
      <BrowserRouter>
        <Suspense fallback={<div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>}>
          <Routes>
            <Route element={<SidebarLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inspection" element={<Inspection />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/inspection/view/:id" element={<InspectionView />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/data" element={<DataManagement />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/marketing" element={<Marketing />} />
              <Route path="/media" element={<DocumentsMedia />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/reminders" element={<Reminders />} />
              <Route path="/payouts" element={<OwnerPayouts />} />
              <Route path="/statements" element={<OwnerStatement />} />
              <Route path="/hpi-traffic" element={<HpiTraffic />} />
              <Route path="/communications" element={<Communications />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
