import { useNavigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { useReportsData } from "@/hooks/useReportsData";
import { Home, ClipboardList, FileText, UserCircle, Box, BookOpen, ShoppingBag, Package, TrendingUp, Wallet2, Clock, Bell } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/ui/BottomNav";
import { ChevronDown } from "lucide-react";
import { format } from 'date-fns';
import { PendingOrdersNotification } from "@/components/ui/PendingOrdersNotification";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const KPICard = ({ value, label }: { value: string | number; label: string }) => (
  <div className="bg-gray-50 rounded-2xl shadow p-4 flex flex-col items-center min-w-[120px] min-h-[80px] border border-gray-200 cursor-default select-none">
    <div className="text-xl font-bold text-blue-900">{value}</div>
    <div className="text-gray-500 text-xs text-center mt-1">{label}</div>
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const { user } = useSession();
  const [salesFilter, setSalesFilter] = useState<'all' | 'day' | 'week' | 'month'>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLButtonElement>(null);
  const { data: reportData, isLoading: reportLoading } = useReportsData();
  const [filteredSales, setFilteredSales] = useState<number>(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [filterCollapsed, setFilterCollapsed] = useState(true);

  const filterOptions = [
    { key: 'day', label: 'Today' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'all', label: 'All' },
  ];

  useEffect(() => {
    if (!reportData) return;
    if (salesFilter === 'all') {
      setFilteredSales(reportData.totalSales);
    } else if (salesFilter === 'day') {
      setFilteredSales(reportData.daySales ?? reportData.totalSales);
    } else if (salesFilter === 'week') {
      setFilteredSales(reportData.weekSales ?? reportData.totalSales);
    } else if (salesFilter === 'month') {
      setFilteredSales(reportData.monthSales ?? reportData.totalSales);
    }
  }, [reportData, salesFilter]);

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

  // Find the earliest completed order date for the sales period
  const salesStartDate = (() => {
    if (!reportData || !user) return null;
    return null;
  })();

  // For date range display
  const today = new Date();
  const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const dateDisplay = useMemo(() => {
    if (salesFilter === 'day') {
      return format(today, 'dd MMM yyyy');
    } else if (salesFilter === 'week') {
      return `${format(startOfWeek, 'dd MMM')} - ${format(endOfWeek, 'dd MMM yyyy')}`;
    } else if (salesFilter === 'month') {
      return format(today, 'MMMM yyyy');
    } else {
      return '';
    }
  }, [salesFilter, today, startOfWeek, endOfWeek]);

  // Close filter dropdown on outside click
  useEffect(() => {
    if (!filterOpen) return;
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [filterOpen]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-3">
        {/* Mobile View */}
        <div className="flex items-center gap-2 md:hidden">
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
          <button className="rounded-full p-2 hover:bg-blue-100 transition relative" aria-label="Notifications" onClick={() => setNotificationOpen(true)}>
            <Bell className="h-6 w-6 text-blue-700" />
          </button>
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
      <PendingOrdersNotification open={notificationOpen} onOpenChange={setNotificationOpen} />

      {/* Main Stats Card */}
      <div className="px-4 mt-2">
        <div className="w-full bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col items-stretch mb-6 p-4 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl shadow p-4 w-full flex flex-col lg:flex-row items-stretch gap-6">
            {/* Left: Total Sales info, vertically centered */}
            <div className="flex-1 flex flex-col justify-center lg:justify-center lg:pl-2 mb-4 lg:mb-0 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full">
                <div className="flex items-center gap-3 w-full flex-wrap">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <span className="text-base font-semibold text-blue-900">Total Sales</span>
                  <span className="text-2xl font-extrabold text-blue-800 tracking-tight">{reportLoading ? '...' : `₹${filteredSales}`}</span>
                  {/* Collapsible Filter for Mobile */}
                  <div className="block sm:hidden ml-auto">
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-blue-800 font-semibold text-sm"
                      onClick={() => setFilterCollapsed((v) => !v)}
                    >
                      <span>Filter</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${filterCollapsed ? '' : 'rotate-180'}`} />
                    </button>
                  </div>
                  {/* Modern Segmented Control Filter for Desktop */}
                  <div className="hidden sm:flex gap-1 bg-gray-100 rounded-full p-1 ml-4">
                    {filterOptions.map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setSalesFilter(opt.key as typeof salesFilter)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-150
                          ${salesFilter === opt.key
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-transparent text-blue-800 hover:bg-blue-100'}
                        `}
                        style={{ minWidth: 64 }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Mobile filter options row below, when expanded */}
                {(!filterCollapsed && window.innerWidth < 640) && (
                  <div className="flex flex-row gap-1 bg-gray-50 rounded-xl p-2 mt-1 shadow w-full justify-between">
                    {filterOptions.map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => { setSalesFilter(opt.key as typeof salesFilter); setFilterCollapsed(true); }}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150
                          ${salesFilter === opt.key
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-transparent text-blue-800 hover:bg-blue-100'}
                        `}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-2">{salesStartDate ? `Since ${format(salesStartDate, 'dd MMM yyyy')}` : 'All completed orders'}</div>
              <div className="text-xs text-gray-600 min-h-[16px]">{dateDisplay}</div>
            </div>
            {/* Right: Chart and stats, vertically centered */}
            <div className="flex flex-col justify-center w-full lg:w-[420px] max-w-xl mx-auto gap-3">
              {/* Mini Sales Trend Chart */}
              <div className="bg-white border border-gray-100 rounded-xl shadow flex flex-col items-center justify-center p-2 w-full">
                <div className="w-full text-xs font-semibold text-blue-900 mb-1 pl-2">Sales Trend (7 days)</div>
                <div className="w-full h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { day: 'Mon', sales: 1200 },
                      { day: 'Tue', sales: 2100 },
                      { day: 'Wed', sales: 800 },
                      { day: 'Thu', sales: 1600 },
                      { day: 'Fri', sales: 900 },
                      { day: 'Sat', sales: 1700 },
                      { day: 'Sun', sales: 1400 },
                    ]}>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={10} />
                      <YAxis hide domain={[0, 'dataMax + 500']} />
                      <Tooltip />
                      <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Unified Credit/Pending container */}
              <div className="flex flex-row w-full gap-2 bg-gray-50 rounded-xl p-2 border border-gray-100 shadow-sm">
                <div className="flex-1 flex flex-col items-center justify-center p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet2 className="w-5 h-5 text-red-400" />
                    <span className="text-sm font-semibold text-red-700">Credit [Udhaar]</span>
                  </div>
                  <span className="text-lg font-extrabold text-red-600 tracking-tight mb-1 block">{reportLoading ? '...' : `₹${reportData?.totalCredit ?? 0}`}</span>
                </div>
                <div className="w-px bg-gray-200 mx-2 my-2" />
                <div className="flex-1 flex flex-col items-center justify-center p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-semibold text-yellow-700">Pending Orders</span>
                  </div>
                  <span className="text-lg font-extrabold text-yellow-600 tracking-tight block">{reportLoading ? '...' : reportData?.ordersPending ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Cards */}
      <div className="flex flex-col gap-5 px-4 mt-7">
        <div className="w-full rounded-2xl bg-white p-4 flex flex-col gap-3 shadow">
            <button
              onClick={() => navigate("/orders")}
            className="w-full bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg shadow-black/10 border border-gray-100 border-l-4 border-l-black flex flex-col items-center justify-center min-h-[90px] p-4 hover:shadow-xl transition-all mb-2"
            >
            <div className="w-full bg-gray-100/80 rounded-xl px-3 py-2">
              <div className="font-bold text-black text-base mb-0.5">Orders</div>
              <div className="text-gray-500 text-xs">Manage job orders</div>
            </div>
            </button>
            <button
              onClick={() => navigate("/bills")}
            className="w-full bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg shadow-black/10 border border-gray-100 border-l-4 border-l-black flex flex-col items-center justify-center min-h-[90px] p-4 hover:shadow-xl transition-all mb-2"
            >
            <div className="w-full bg-gray-100/80 rounded-xl px-3 py-2">
              <div className="font-bold text-black text-base mb-0.5">Bills</div>
              <div className="text-gray-500 text-xs">Customer bills</div>
            </div>
            </button>
          <button
            onClick={() => navigate("/customers")}
            className="w-full bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg shadow-black/10 border border-gray-100 border-l-4 border-l-black flex items-center gap-3 min-h-[80px] p-4 hover:shadow-xl transition-all mb-2"
          >
            <div className="w-full bg-gray-100/80 rounded-xl px-3 py-2">
              <div className="font-bold text-black text-base">Customer Ledger</div>
              <div className="text-gray-500 text-xs mt-0.5">Add/View udhaar or paid transactions</div>
            </div>
          </button>
          <button
            onClick={() => navigate("/collections")}
            className="w-full bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg shadow-black/10 border border-gray-100 border-l-4 border-l-black flex items-center gap-3 min-h-[80px] p-4 hover:shadow-xl transition-all mb-2"
          >
            <div className="w-full bg-gray-100/80 rounded-xl px-3 py-2">
              <div className="font-bold text-black text-base">Collection</div>
              <div className="text-gray-500 text-xs mt-0.5">Record customer payments</div>
            </div>
          </button>
          <button
            onClick={() => navigate("/products")}
            className="w-full bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg shadow-black/10 border border-gray-100 border-l-4 border-l-black flex items-center gap-3 min-h-[80px] p-4 hover:shadow-xl transition-all"
          >
            <div className="w-full bg-gray-100/80 rounded-xl px-3 py-2">
              <div className="font-bold text-black text-base">Product Catalog</div>
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