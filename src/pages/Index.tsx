
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useState, useEffect } from "react";
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
  <div className="flex-1 min-w-[110px] p-3 bg-white rounded-xl shadow border flex flex-col justify-center items-center mx-0.5 my-1">
    <span className={`text-lg font-bold mb-1 ${color}`}>{value}</span>
    <span className="text-xs font-medium text-gray-400 mb-1 text-center">{title}</span>
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

const DASH_ACTIONS = [
  {
    title: "Customer Ledger",
    desc: "Add/View udhaar or paid transactions",
    bg: "bg-blue-50",
    hover: "hover:bg-blue-100 active:bg-blue-200",
    color: "text-blue-900",
    route: "/customers",
  },
  {
    title: "Orders",
    desc: "Manage job orders and delivery status",
    bg: "bg-green-50",
    hover: "hover:bg-green-100 active:bg-green-200",
    color: "text-green-800",
    route: "/orders",
  },
  {
    title: "Product Catalog",
    desc: "Glass, Aluminium, Mirrors, etc.",
    bg: "bg-yellow-50",
    hover: "hover:bg-yellow-100 active:bg-yellow-200",
    color: "text-yellow-700",
    route: "/products",
  },
  {
    title: "Reports",
    desc: "Sales & pending summary",
    bg: "bg-gray-50",
    hover: "hover:bg-gray-100 active:bg-gray-200",
    color: "text-gray-700",
    route: "/customers",
  },
];

const UNLOCK_KEY = "unlocked";

const Index = () => {
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const navigate = useNavigate();

  // Sync unlocked state with localStorage
  useEffect(() => {
    const unlockedFromStorage = localStorage.getItem(UNLOCK_KEY);
    if (unlockedFromStorage === "true") {
      setUnlocked(true);
    }
  }, []);

  // Handler to unlock and persist state
  const handleUnlock = () => {
    setUnlocked(true);
    localStorage.setItem(UNLOCK_KEY, "true");
  };

  if (!unlocked) {
    return <PinLock onUnlock={handleUnlock} />;
  }

  const { totalSales, totalCredit, ordersPending, totalCustomers } = getKPIs();

  return (
    <AppLayout title="Glass Shop - Khata">
      <div className="p-3 pb-24 w-full max-w-md mx-auto">
        <div className="font-bold text-lg mb-2 text-blue-800 text-center">
          Welcome! Track your orders, sales and credits.
        </div>
        <div className="flex flex-wrap gap-y-2 mb-4 w-full">
          <KPICard title="Total Sales" value={`₹${totalSales}`} color="text-green-700" />
          <KPICard title="Credit (Udhaar)" value={`₹${totalCredit}`} color="text-red-600" />
          <KPICard title="Pending Orders" value={ordersPending} color="text-yellow-600" />
          <KPICard title="Customers" value={totalCustomers} color="text-blue-800" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 w-full mx-auto mt-2">
          {DASH_ACTIONS.map((action) => (
            <button
              key={action.title}
              onClick={() => navigate(action.route)}
              className={`
                ${action.bg} ${action.hover}
                rounded-xl shadow transition
                p-4 w-full flex flex-col items-start border
                active:scale-[0.98] min-h-[92px]
                `}
              style={{ minWidth: 0 }}
            >
              <span className={`text-base font-bold mb-1 ${action.color}`}>{action.title}</span>
              <span className="text-xs text-gray-600 text-left">{action.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
