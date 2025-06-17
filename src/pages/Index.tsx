import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useState, useEffect } from "react";
import { useSession } from "@/hooks/useSession";
import { useReportsData } from "@/hooks/useReportsData";
import { supabase } from "@/integrations/supabase/client";

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
    desc: "Add your products",
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
  {
    title: "Collections",
    desc: "Track payments received from customers",
    bg: "bg-teal-50",
    hover: "hover:bg-teal-100 active:bg-teal-200",
    color: "text-teal-800",
    route: "/collections",
  },
];

const Index = () => {
  const { user, status } = useSession();
  const [checking, setChecking] = useState(true); // for auth state loading
  const navigate = useNavigate();

  // KPI data
  const { data: reportData, isLoading: reportLoading, error: reportError } = useReportsData();

  // Shop name loading
  const [shopName, setShopName] = useState<string | null>(null);
  const [loadingShopName, setLoadingShopName] = useState(true);

  useEffect(() => {
    if (user) {
      setLoadingShopName(true);
      supabase
        .from("profiles")
        .select("shop_name")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          setShopName(data?.shop_name || null);
          setLoadingShopName(false);
        });
    } else {
      setShopName(null);
      setLoadingShopName(false);
    }
  }, [user]);

  useEffect(() => {
    if (status === "loading") {
      setChecking(true);
      return;
    }
    setChecking(false);
  }, [status]);

  useEffect(() => {
    if (!checking && (status === "signed_out" || !user)) {
      navigate("/auth");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, status, user]);

  if (checking || status === "loading") {
    return <div className="h-screen flex items-center justify-center text-blue-900">Loading...</div>;
  }

  return (
    <AppLayout
      shopName={shopName || undefined}
      loadingTitle={loadingShopName}
      title="Shop - Khata"
    >
      <div className="p-6 pb-28 sm:pb-24 w-full max-w-4xl mx-auto">
        {/* <div className="font-bold text-2xl mb-6 text-blue-800 text-center">
          Welcome! Track your orders, sales and credits.
        </div> */}
        <div className="flex flex-wrap gap-4 mb-8 w-full justify-center">
          {/* Show KPIs, WITHOUT Total Sales */}
          {reportLoading ? (
            <>
              <KPICard title="Credit (Udhaar)" value="..." color="text-red-600" />
              <KPICard title="Pending Orders" value="..." color="text-yellow-600" />
            </>
          ) : reportError ? (
            <>
              <KPICard title="Credit (Udhaar)" value="Err" color="text-red-600" />
              <KPICard title="Pending Orders" value="Err" color="text-yellow-600" />
            </>
          ) : (
            <>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full mx-auto mt-2">
          {DASH_ACTIONS.map((action) => (
            <button
              key={action.title}
              onClick={() => navigate(action.route)}
              className={`
                ${action.bg} ${action.hover}
                rounded-2xl shadow-lg transition
                p-6 w-full flex flex-col items-start border border-gray-200
                active:scale-[0.98] min-h-[110px]
                hover:shadow-xl
                `}
              style={{ minWidth: 0 }}
            >
              <span className={`text-lg font-bold mb-2 ${action.color}`}>{action.title}</span>
              <span className="text-sm text-gray-600 text-left">{action.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
