
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useState, useEffect } from "react";
import { useSession } from "@/hooks/useSession";
import { useReportsData } from "@/hooks/useReportsData";

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
    title: "Bills",
    desc: "Create and manage customer bills",
    bg: "bg-purple-50",
    hover: "hover:bg-purple-100 active:bg-purple-200",
    color: "text-purple-900",
    route: "/bills",
  },
];

const Index = () => {
  const { user, status } = useSession();
  const [checking, setChecking] = useState(true); // for auth state loading
  const navigate = useNavigate();

  // Added: fetch live KPI data
  const { data: reportData, isLoading: reportLoading, error: reportError } = useReportsData();

  // On initial mount, check session
  useEffect(() => {
    if (status === "loading") {
      setChecking(true);
      return;
    }
    setChecking(false);
  }, [status]);

  // Redirect to /auth if signed out
  useEffect(() => {
    if (!checking && (status === "signed_out" || !user)) {
      navigate("/auth");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, status, user]);

  // If loading session, show loading spinner
  if (checking || status === "loading") {
    return <div className="h-screen flex items-center justify-center text-blue-900">Loading...</div>;
  }

  return (
    <AppLayout title="Glass Shop - Khata">
      <div className="p-3 pb-24 w-full max-w-md mx-auto">
        <div className="font-bold text-lg mb-2 text-blue-800 text-center">
          Welcome! Track your orders, sales and credits.
        </div>
        <div className="flex flex-wrap gap-y-2 mb-4 w-full">
          {/* Show real data for KPIs */}
          {reportLoading ? (
            <>
              <KPICard title="Total Sales" value="..." color="text-green-700" />
              <KPICard title="Credit (Udhaar)" value="..." color="text-red-600" />
              <KPICard title="Pending Orders" value="..." color="text-yellow-600" />
            </>
          ) : reportError ? (
            <>
              <KPICard title="Total Sales" value="Err" color="text-green-700" />
              <KPICard title="Credit (Udhaar)" value="Err" color="text-red-600" />
              <KPICard title="Pending Orders" value="Err" color="text-yellow-600" />
            </>
          ) : (
            <>
              <KPICard
                title="Total Sales"
                value={`₹${reportData?.totalSales ?? 0}`}
                color="text-green-700"
              />
              <KPICard
                title="Credit (Udhaar)"
                value={`₹${reportData?.totalCredit ?? 0}`}
                color="text-red-600"
              />
              <KPICard
                title="Pending Orders"
                value={reportData?.ordersPending ?? 0}
                color="text-yellow-600"
              />
            </>
          )}
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
