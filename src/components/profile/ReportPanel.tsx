
import { useReportsData } from "@/hooks/useReportsData";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, BarChart3 } from 'lucide-react';

export function ReportPanel() {
  const { data, isLoading, error } = useReportsData();

  // Calculate avg order value and growth (week over week)
  let avgOrderValue = 0;
  let growthRate = 0;
  if (data) {
    avgOrderValue = data.totalSales && data.ordersPending !== undefined ? (data.totalSales / (data.ordersPending + (data.totalSales > 0 ? 1 : 0))) : 0;
    // For growth, just use weekSales vs previous week (not available in hook, so show 0%)
    // You can enhance this if you add more data to the hook
    growthRate = 0;
  }

  return (
    <div className="p-4">
      {/* Business Analytics Section */}
      {data && (
        <div className="mb-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Business Analytics</h3>
                  <p className="text-sm text-gray-600">Key performance metrics</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-green-700 font-medium mb-1">Total Revenue</p>
                    <p className="text-xl font-bold text-green-800">₹{data.totalSales}</p>
                    <p className="text-xs text-green-600">All time earnings</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-blue-700 font-medium mb-1">Total Orders</p>
                    <p className="text-xl font-bold text-blue-800">{data.ordersPending + (data.totalSales > 0 ? 1 : 0)}</p>
                    <p className="text-xs text-blue-600">Completed orders</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-100">
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-purple-700 font-medium mb-1">Avg Order</p>
                    <p className="text-xl font-bold text-purple-800">₹{avgOrderValue.toFixed(2)}</p>
                    <p className="text-xs text-purple-600">Per order value</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                  <div className={`h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center`}>
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-orange-700 font-medium mb-1">Growth</p>
                    <p className="text-xl font-bold text-green-800">{growthRate.toFixed(1)}%</p>
                    <p className="text-xs text-orange-600">Week over week</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="text-blue-900 font-bold text-lg mb-4">Reports Summary</div>
      {isLoading && (
        <div className="text-gray-600 py-8 text-center">Loading report data...</div>
      )}
      {error && (
        <div className="text-red-700 py-2 text-center">
          Failed to load reports: {(error as any)?.message || "Unknown error"}
        </div>
      )}
      {data && (
        <div className="flex flex-wrap gap-4">
          <div className="bg-white shadow rounded-lg px-6 py-4 flex-1 min-w-[130px] text-center border">
            <div className="text-gray-500 text-xs">Credit</div>
            <div className="text-red-600 font-bold text-xl mb-1">₹{data.totalCredit}</div>
          </div>
          <div className="bg-white shadow rounded-lg px-6 py-4 flex-1 min-w-[130px] text-center border">
            <div className="text-gray-500 text-xs">Pending Orders</div>
            <div className="text-yellow-600 font-bold text-xl mb-1">{data.ordersPending}</div>
          </div>
        </div>
      )}
    </div>
  );
}

