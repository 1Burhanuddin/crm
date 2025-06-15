
import { useReportsData } from "@/hooks/useReportsData";

export function ReportPanel() {
  const { data, isLoading, error } = useReportsData();

  return (
    <div className="p-4">
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
            <div className="text-gray-500 text-xs">Total Sales</div>
            <div className="text-green-700 font-bold text-xl mb-1">₹{data.totalSales}</div>
          </div>
          <div className="bg-white shadow rounded-lg px-6 py-4 flex-1 min-w-[130px] text-center border">
            <div className="text-gray-500 text-xs">Credit (Udhaar)</div>
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
