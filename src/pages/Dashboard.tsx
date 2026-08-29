import { useEffect } from 'react'
import { useInspectionStore } from '../store/useInspectionStore'

export default function Dashboard() {
  const { inspections, loadInspections } = useInspectionStore()

  useEffect(() => {
    loadInspections()
  }, [])

  const awaitingInspection = inspections.filter(
    (i) => i.status === 'draft'
  ).length
  const inspectionComplete = inspections.filter(
    (i) => i.status === 'completed'
  ).length
  // Placeholder for other metrics until more data is available
  const sold = 0
  const readyForSales = 0
  const vehicleLocated = 0
  const marketingReady = 0

  const metrics = [
    { label: 'Sold', value: sold },
    { label: 'Awaiting Inspection', value: awaitingInspection },
    { label: 'Ready for Sales', value: readyForSales },
    { label: 'Inspection Complete', value: inspectionComplete },
    { label: 'Vehicle Located', value: vehicleLocated },
    { label: 'Marketing Ready', value: marketingReady },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="card p-4">
            <div className="text-sm text-gray-600">{metric.label}</div>
            <div className="text-3xl font-bold">{metric.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Financial Summary</h2>
        <p>No data yet</p>
      </div>
      <div className="mt-8 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Advanced Analytics</h2>
        <p>Coming soon</p>
      </div>
    </div>
  )
}
