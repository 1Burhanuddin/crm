import { useNavigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { useReportsData } from "@/hooks/useReportsData";
import { Home, ClipboardList, FileText, UserCircle, Box, BookOpen, ShoppingBag, Package } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";

const KPICard = ({ value, label }: { value: string | number; label: string }) => (
  <div className="bg-gray-50 rounded-2xl shadow p-4 flex flex-col items-center min-w-[120px] min-h-[80px] border border-gray-200 cursor-default select-none">
    <div className="text-xl font-bold text-blue-900">{value}</div>
    <div className="text-gray-500 text-xs text-center mt-1">{label}</div>
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const { user } = useSession();
  const { data: reportData, isLoading: reportLoading } = useReportsData();

  // Fetch profile info for avatar
  const [profile, setProfile] = useState<{ name: string | null; profile_image_url: string | null; email: string } | null>(null);
  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("name, profile_image_url, email")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setProfile(data);
        });
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-blue-50 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-3">
        {/* Mobile View */}
        <div className="flex items-center gap-2 md:hidden">
          <span className="bg-blue-100 rounded-lg p-2">
            <Home className="h-6 w-6 text-blue-700" />
          </span>
          <span className="font-bold text-xl text-blue-900">Khata Book</span>
        </div>
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 flex-1">
          <span className="font-bold text-xl text-blue-900">Khata Book</span>
          <nav className="flex items-center gap-6">
            <button onClick={() => navigate("/orders")} className="text-gray-600 hover:text-blue-700 font-medium">Orders</button>
            <button onClick={() => navigate("/bills")} className="text-gray-600 hover:text-blue-700 font-medium">Bills</button>
            <button onClick={() => navigate("/collections")} className="text-gray-600 hover:text-blue-700 font-medium">Collections</button>
            <button onClick={() => navigate("/products")} className="text-gray-600 hover:text-blue-700 font-medium">Products</button>
            <button onClick={() => navigate("/customers")} className="text-gray-600 hover:text-blue-700 font-medium">Customers</button>
          </nav>
        </div>
        {/* Profile Section */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right">
            <div className="font-medium text-gray-900">{profile?.name || profile?.email}</div>
            <div className="text-sm text-gray-500">My Account</div>
          </div>
          <button 
            onClick={() => navigate("/profile")} 
            className="rounded-full hover:ring-2 hover:ring-blue-300 transition-all"
          >
            <Avatar className="h-10 w-10 border-2 border-blue-200 shadow">
              <AvatarImage src={profile?.profile_image_url || undefined} alt={profile?.name || profile?.email || "U"} />
              <AvatarFallback>{(profile?.name || profile?.email || "U")[0]}</AvatarFallback>
            </Avatar>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 px-4 mt-2">
        <KPICard value={reportLoading ? "..." : `₹${reportData?.totalCredit ?? 0}`} label="Credit (Udhaar)" />
        <KPICard value={reportLoading ? "..." : reportData?.ordersPending ?? 0} label="Pending Orders" />
      </div>

      {/* Main Action Cards */}
      <div className="flex flex-col gap-5 px-4 mt-7">
        {/* Orders and Bills grouped together */}
        <div className="w-full rounded-2xl bg-blue-100/60 p-3 flex flex-col gap-3">
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/orders")}
              className="flex-1 bg-white rounded-xl shadow p-4 flex flex-col items-center justify-center min-h-[90px] active:scale-[0.98] border border-gray-100 hover:shadow-lg transition-all"
            >
              <span className="rounded-full bg-green-100 p-3 mb-2 flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-blue-700" />
              </span>
              <div className="font-bold text-blue-900 text-base mb-0.5">Orders</div>
              <div className="text-gray-500 text-xs text-center">Manage job orders</div>
            </button>
            <button
              onClick={() => navigate("/bills")}
              className="flex-1 bg-white rounded-xl shadow p-4 flex flex-col items-center justify-center min-h-[90px] active:scale-[0.98] border border-gray-100 hover:shadow-lg transition-all"
            >
              <span className="rounded-full bg-purple-100 p-3 mb-2 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-700" />
              </span>
              <div className="font-bold text-blue-900 text-base mb-0.5">Bills</div>
              <div className="text-gray-500 text-xs text-center">Customer bills</div>
            </button>
          </div>
          {/* Customer Ledger at the top */}
          <button
            onClick={() => navigate("/customers")}
            className="w-full bg-white rounded-xl shadow p-4 flex items-center gap-3 min-h-[80px] active:scale-[0.98] border border-gray-100 hover:shadow-lg transition-all"
          >
            <span className="rounded-full bg-blue-100 p-3 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-blue-700" />
            </span>
            <div className="text-left">
              <div className="font-bold text-blue-900 text-base">Customer Ledger</div>
              <div className="text-gray-500 text-xs mt-0.5">Add/View udhaar or paid transactions</div>
            </div>
          </button>
          {/* Collection full-width */}
          <button
            onClick={() => navigate("/collections")}
            className="w-full bg-white rounded-xl shadow p-4 flex items-center gap-3 min-h-[80px] active:scale-[0.98] border border-gray-100 hover:shadow-lg transition-all"
          >
            <span className="rounded-full bg-yellow-100 p-3 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-blue-700" />
            </span>
            <div className="text-left">
              <div className="font-bold text-blue-900 text-base">Collection</div>
              <div className="text-gray-500 text-xs mt-0.5">Record customer payments</div>
            </div>
          </button>
          {/* Product Catalog full-width */}
          <button
            onClick={() => navigate("/products")}
            className="w-full bg-white rounded-xl shadow p-4 flex items-center gap-3 min-h-[80px] active:scale-[0.98] border border-gray-100 hover:shadow-lg transition-all"
          >
            <span className="rounded-full bg-purple-100 p-3 flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-700" />
            </span>
            <div className="text-left">
              <div className="font-bold text-blue-900 text-base">Product Catalog</div>
              <div className="text-gray-500 text-xs mt-0.5">Add your products</div>
            </div>
          </button>
        </div>
      </div>

      {/* Bottom Navigation for mobile */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
};

export default Index;
