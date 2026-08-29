import { useEffect, useMemo } from 'react'
import { useSaleStore } from '../store/useSaleStore'
import { useInspectionStore } from '../store/useInspectionStore'
import { useVehicleStore } from '../store/useVehicleStore'
import { useCustomerStore } from '../store/useCustomerStore'

export default function Finance() {
  const { sales, payments, loadSales, loadPayments } = useSaleStore()
  const { inspections, loadInspections } = useInspectionStore()
  const { vehicles, loadVehicles } = useVehicleStore()
  const { customers, loadCustomers } = useCustomerStore()

  useEffect(() => {
    loadSales()
    loadPayments()
    loadInspections()
    loadVehicles()
    loadCustomers()
  }, [loadSales, loadPayments, loadInspections, loadVehicles, loadCustomers])

  const stats = useMemo(() => {
    const totalRevenue = sales
      .filter((s) => s.status === 'completed')
      .reduce((sum, s) => sum + (s.salePrice || 0), 0)

    const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0)

    const totalDeposits = sales.reduce((sum, s) => sum + (s.deposit || 0), 0)

    const outstanding = sales
      .filter((s) => s.status !== 'completed')
      .reduce((sum, s) => sum + (s.salePrice || 0), 0) - totalPayments

    const totalProfitPotential = inspections.reduce(
      (sum, i) => sum + (i.financial.estimatedProfit || 0),
      0
    )

    return {
      totalRevenue,
      totalPayments,
      totalDeposits,
      outstanding,
      totalProfitPotential,
    }
  }, [sales, payments, inspections])

  const recentSales = useMemo(() => {
    return [...sales].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8)
  }, [sales])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Finance</h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {sales.length} sale(s)
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="card p-4">
          <p className="text-xs text-gray-500">Revenue (Completed)</p>
          <p className="text-lg font-bold text-green-600">R {stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Payments Received</p>
          <p className="text-lg font-bold text-indigo-600">R {stats.totalPayments.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Deposits</p>
          <p className="text-lg font-bold text-amber-600">R {stats.totalDeposits.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Outstanding</p>
          <p className="text-lg font-bold text-red-600">R {Math.max(stats.outstanding, 0).toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Profit Potential</p>
          <p className="text-lg font-bold text-purple-600">R {stats.totalProfitPotential.toLocaleString()}</p>
        </div>
      </div>

      {/* Recent sales */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Sales</h2>
        {recentSales.length === 0 ? (
          <p className="text-gray-500 text-sm">No sales yet.</p>
        ) : (
          <div className="space-y-2">
            {recentSales.map((sale) => {
              const vehicle = vehicles.find((v) => v.id === sale.vehicleId)
              const buyer = customers.find((c) => c.id === sale.buyerId)
              return (
                <div key={sale.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate">
                      {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown vehicle'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {buyer?.name || 'Unknown buyer'} • {sale.status.replace('_', ' ')}
                    </p>
                  </div>
                  <span className="font-semibold text-gray-800">
                    R {(sale.salePrice || 0).toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
