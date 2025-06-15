
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { PinLock } from "@/components/PinLock";
import { DEMO_CUSTOMERS, DEMO_TRANSACTIONS, DEMO_ORDERS } from "@/constants/demoData";

const KPICard = ({
  title,
  value,
  color,
  sub,
}: {
  title: string;
  value: string | number;
  color: string;
  sub?: string;
}) => (
  <div className="flex-1 p-3 bg-white rounded-lg shadow border min-w-[110px] flex flex-col justify-center items-center">
    <span className={`text-lg font-bold mb-1 ${color}`}>{value}</span>
    <span className="text-xs font-medium text-gray-400 mb-1">{title}</span>
    {sub && <span className="text-xs text-blue-900">{sub}</span>}
  </div>
);

const getKPIs = () => {
  const totalSales = DEMO_TRANSACTIONS
    .filter((t) => t.type === "paid")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalCredit = DEMO_TRANSACTIONS
    .filter((t) => t.type === "udhaar")
    .reduce((sum, t) => sum + t.amount, 0);
  const ordersPending = DEMO_ORDERS.filter((o) => o.status === "pending").length;
  const totalCustomers = DEMO_CUSTOMERS.length;
  return { totalSales, totalCredit, ordersPending, totalCustomers };
};

const Index = () => {
  const [unlocked, setUnlocked] = useState(false);
  const navigate = useNavigate(); // moved up here, always called

  if (!unlocked) {
    return <PinLock onUnlock={() => setUnlocked(true)} />;
  }

  const { totalSales, totalCredit, ordersPending, totalCustomers } = getKPIs();

  return (
    <AppLayout title="Glass Shop - Khata">
      <div className="p-4 pb-24">
        <div className="font-bold text-lg mb-2 text-blue-800">
          Welcome! Track your orders, sales and credits.
        </div>
        <div className="flex flex-row gap-2 mb-5">
          <KPICard title="Total Sales" value={`₹${totalSales}`} color="text-green-700" />
          <KPICard title="Credit (Udhaar)" value={`₹${totalCredit}`} color="text-red-600" />
          <KPICard title="Pending Orders" value={ordersPending} color="text-yellow-600" />
          <KPICard title="Customers" value={totalCustomers} color="text-blue-800" />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => navigate("/customers")}
            className="bg-blue-50 rounded-lg shadow p-4 flex flex-col items-center hover:bg-blue-100 active:bg-blue-200 transition"
          >
            <span className="text-xl font-bold text-blue-900 mb-1">Customer Ledger</span>
            <span className="text-xs text-blue-800">Add/View udhaar or paid transactions</span>
          </button>
          <button
            onClick={() => navigate("/orders")}
            className="bg-green-50 rounded-lg shadow p-4 flex flex-col items-center hover:bg-green-100 active:bg-green-200 transition"
          >
            <span className="text-xl font-bold text-green-800 mb-1">Orders</span>
            <span className="text-xs text-green-700">Manage job orders and delivery status</span>
          </button>
          <button
            onClick={() => navigate("/products")}
            className="bg-yellow-50 rounded-lg shadow p-4 flex flex-col items-center hover:bg-yellow-100 active:bg-yellow-200 transition"
          >
            <span className="text-xl font-bold text-yellow-700 mb-1">Product Catalog</span>
            <span className="text-xs text-yellow-700">Glass, Aluminium, Mirrors, etc.</span>
          </button>
          <button
            onClick={() => navigate("/customers")}
            className="bg-gray-50 rounded-lg shadow p-4 flex flex-col items-center hover:bg-gray-100 active:bg-gray-200 transition"
          >
            <span className="text-xl font-bold text-gray-700 mb-1">Reports</span>
            <span className="text-xs text-gray-700">Sales & pending summary</span>
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
