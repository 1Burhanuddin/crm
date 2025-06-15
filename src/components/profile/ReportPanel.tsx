
import { DEMO_TRANSACTIONS, DEMO_ORDERS } from "@/constants/demoData";

export function ReportPanel() {
  const totalSales = DEMO_TRANSACTIONS
    .filter((t) => t.type === "paid")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalCredit = DEMO_TRANSACTIONS
    .filter((t) => t.type === "udhaar")
    .reduce((sum, t) => sum + t.amount, 0);
  const ordersPending = DEMO_ORDERS.filter((o) => o.status === "pending").length;

  return (
    <div className="p-4">
      <div className="text-blue-900 font-bold text-lg mb-4">Reports Summary</div>
      <div className="flex flex-wrap gap-4">
        <div className="bg-white shadow rounded-lg px-6 py-4 flex-1 min-w-[130px] text-center border">
          <div className="text-gray-500 text-xs">Total Sales</div>
          <div className="text-green-700 font-bold text-xl mb-1">₹{totalSales}</div>
        </div>
        <div className="bg-white shadow rounded-lg px-6 py-4 flex-1 min-w-[130px] text-center border">
          <div className="text-gray-500 text-xs">Credit (Udhaar)</div>
          <div className="text-red-600 font-bold text-xl mb-1">₹{totalCredit}</div>
        </div>
        <div className="bg-white shadow rounded-lg px-6 py-4 flex-1 min-w-[130px] text-center border">
          <div className="text-gray-500 text-xs">Pending Orders</div>
          <div className="text-yellow-600 font-bold text-xl mb-1">{ordersPending}</div>
        </div>
      </div>
    </div>
  );
}
