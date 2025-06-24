import { useNavigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { useReportsData } from "@/hooks/useReportsData";
import { TrendingUp, Wallet2, Clock, Plus, FileText, ClipboardList, Users, Filter } from "lucide-react";
import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/ui/BottomNav";
import { ChevronDown } from "lucide-react";
import { format } from 'date-fns';
import { PendingOrdersNotification } from "@/components/ui/PendingOrdersNotification";
import { ChartContainer } from "@/components/ui/chart";
import { ResponsiveLine } from '@nivo/line';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { deepPurple, blue, green, pink, yellow, red } from '@mui/material/colors';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { AppLayout } from '@/components/AppLayout';
import { PendingCollectionsPanel } from "@/components/collections/PendingCollectionsPanel";
import { useQuery } from "@tanstack/react-query";

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = display;
    let end = value;
    if (start === end) return;
    let frame: number;
    const step = () => {
      start += (end - start) / 8;
      if (Math.abs(end - start) < 1) {
        setDisplay(end);
        return;
      }
      setDisplay(start);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <span>{Math.round(display)}</span>;
}

const KPICard = ({ value, label, icon, color }: { value: string | number; label: string; icon: React.ReactNode; color: string }) => (
  <div className="bg-white rounded-2xl shadow p-4 flex flex-col items-center min-w-[120px] min-h-[80px] border border-gray-100 cursor-default select-none">
    <div className={`mb-2 ${color}`}>{icon}</div>
    <div className="text-2xl font-bold text-blue-900">{value}</div>
    <div className="text-gray-500 text-xs text-center mt-1">{label}</div>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useSession();
  const [salesFilter, setSalesFilter] = useState<'all' | 'day' | 'week' | 'month'>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLButtonElement>(null);
  const { data: reportData, isLoading } = useReportsData();
  const [filteredSales, setFilteredSales] = useState<number>(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [filterCollapsed, setFilterCollapsed] = useState(true);
  const [salesHistory, setSalesHistory] = useState<{ x: string; y: number }[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentQuotations, setRecentQuotations] = useState<any[]>([]);
  const [totalDeliveredSales, setTotalDeliveredSales] = useState<number>(0);
  const [pendingCollections, setPendingCollections] = useState([]);

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

  // Fetch sales history for chart
  useEffect(() => {
    async function fetchSalesHistory() {
      // Fetch all delivered orders
      const { data: orders } = await supabase
        .from("orders")
        .select("job_date, products, advance_amount, status, user_id")
        .eq("status", "delivered");
      if (!orders) return;
      // Fetch all products for the user
      let userId = user?.id;
      let products = [];
      if (userId) {
        const { data: productsData } = await supabase
          .from("products")
          .select("id, price, user_id");
        products = productsData || [];
      }
      // Build price map
      const priceMap = new Map();
      products.forEach((p) => {
        priceMap.set(p.id, Number(p.price) || 0);
      });
      // Calculate sales by date
      const salesByDate = {};
      orders.forEach((o) => {
        let total = 0;
        if (Array.isArray(o.products)) {
          (o.products as any[]).forEach((item) => {
            if (item && typeof item === 'object' && 'productId' in item && 'qty' in item) {
              const price = priceMap.get(item.productId) || 0;
              const qty = Number(item.qty) || 0;
              total += price * qty;
            }
          });
        }
        if (o.job_date) {
          const day = new Date(o.job_date);
          const dayStr = day.toISOString().slice(0, 10);
          salesByDate[dayStr] = (salesByDate[dayStr] || 0) + total;
        }
      });
      const sorted = Object.entries(salesByDate)
        .sort(([a,], [b,]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([date, sales]) => ({ x: date, y: typeof sales === 'number' ? sales : Number(sales) }));
      setSalesHistory(sorted);
    }
    fetchSalesHistory();
  }, [user]);

  // Fetch recent orders and quotations
  useEffect(() => {
    async function fetchRecent() {
      const { data: orders } = await supabase
        .from("orders")
        .select("id, customer_id, job_date, status, products")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentOrders(orders || []);
      const { data: quotations } = await supabase
        .from("quotations")
        .select("id, customer_id, job_date, status, products")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentQuotations(quotations || []);
    }
    fetchRecent();
  }, []);

  // Calculate total delivered sales for display
  useEffect(() => {
    async function fetchTotalDeliveredSales() {
      const { data: orders } = await supabase
        .from("orders")
        .select("products, status, user_id")
        .eq("status", "delivered");
      if (!orders) return setTotalDeliveredSales(0);
      let userId = user?.id;
      let products = [];
      if (userId) {
        const { data: productsData } = await supabase
          .from("products")
          .select("id, price, user_id");
        products = productsData || [];
      }
      const priceMap = new Map();
      products.forEach((p) => {
        priceMap.set(p.id, Number(p.price) || 0);
      });
      let total = 0;
      orders.forEach((o) => {
        if (Array.isArray(o.products)) {
          (o.products as any[]).forEach((item) => {
            if (item && typeof item === 'object' && 'productId' in item && 'qty' in item) {
              const price = priceMap.get(item.productId) || 0;
              const qty = Number(item.qty) || 0;
              total += price * qty;
            }
          });
        }
      });
      setTotalDeliveredSales(total);
    }
    fetchTotalDeliveredSales();
  }, [user]);

  // Fetch pending collections (udhaar) customers
  useEffect(() => {
    async function fetchPendingCollections() {
      if (!user) return setPendingCollections([]);
      // Fetch delivered orders
      const { data: orders } = await supabase
        .from("orders")
        .select("id, customer_id, products, advance_amount, status")
        .eq("user_id", user.id)
        .eq("status", "delivered");
      if (!orders) return setPendingCollections([]);
      // Fetch all products
      const { data: products } = await supabase
        .from("products")
        .select("id, price")
        .eq("user_id", user.id);
      const priceMap = new Map();
      (products || []).forEach((p) => priceMap.set(p.id, Number(p.price) || 0));
      // Fetch collections
      const { data: collections } = await supabase
        .from("collections")
        .select("order_id, amount")
        .eq("user_id", user.id);
      const collectionsMap = {};
      (collections || []).forEach((c) => {
        if (c.order_id) {
          collectionsMap[c.order_id] = (collectionsMap[c.order_id] || 0) + (Number(c.amount) || 0);
        }
      });
      // Group by customer
      const customerPending: Record<string, { id: string; pending: number }> = {};
      (orders || []).forEach((o) => {
        let total = 0;
        if (Array.isArray(o.products)) {
          (o.products as any[]).forEach((item) => {
            if (item && typeof item === 'object' && 'productId' in item && 'qty' in item) {
              const price = priceMap.get(item.productId) || 0;
              const qty = Number(item.qty) || 0;
              total += price * qty;
            }
          });
        }
        const advance = Number(o.advance_amount) || 0;
        const collected = collectionsMap[o.id] || 0;
        const udhaar = Math.max(0, total - advance - collected);
        if (udhaar > 0) {
          if (!customerPending[o.customer_id]) {
            customerPending[o.customer_id] = { id: o.customer_id, pending: 0 };
          }
          customerPending[o.customer_id].pending += udhaar;
        }
      });
      // Fetch customer names
      const { data: customers } = await supabase
        .from("customers")
        .select("id, name, phone")
        .eq("user_id", user.id);
      const pendingCustomers: { id: string; name: string; phone?: string; pending: number }[] = Object.values(customerPending).map((c) => {
        const cust = (customers || []).find((cu: any) => cu.id === c.id);
        return { ...c, name: cust?.name || "Unknown", phone: cust?.phone };
      });
      setPendingCollections(pendingCustomers);
    }
    fetchPendingCollections();
  }, [user]);

  // Modern Unified KPI Panel
  const kpis = [
    {
      value: reportData?.totalSales ?? 0,
      label: "Total Sales",
      icon: <TrendingUp size={28} />,
      color: "text-blue-500",
    },
    {
      value: reportData?.daySales ?? 0,
      label: "Today",
      icon: <TrendingUp size={28} />,
      color: "text-green-500",
    },
    {
      value: reportData?.weekSales ?? 0,
      label: "This Week",
      icon: <TrendingUp size={28} />,
      color: "text-indigo-500",
    },
    {
      value: reportData?.monthSales ?? 0,
      label: "This Month",
      icon: <TrendingUp size={28} />,
      color: "text-pink-500",
    },
    {
      value: reportData?.totalCredit ?? 0,
      label: "Credit (Udhaar)",
      icon: <Wallet2 size={28} />,
      color: "text-red-500",
    },
    {
      value: reportData?.ordersPending ?? 0,
      label: "Pending Orders",
      icon: <Clock size={28} />,
      color: "text-yellow-500",
    },
  ];

  return (
    <AppLayout title="Dashboard">
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 6 }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 1, sm: 3 } }}>
          {/* Welcome Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 5, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ ml: { xs: 2, md: 4 } }}>
              <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' }, ml: { xs: 2, md: 4 } }}>
                Welcome{profile?.name ? `, ${profile.name}` : ''}!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' }, ml: { xs: 2, md: 4 } }}>
                Here's your business at a glance.
              </Typography>
            </Box>
          </Box>
          {/* Sales Trend + Total Sales Card Row */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'stretch', mb: 4 }}>
            <Card elevation={3} sx={{ flex: 1, borderRadius: 4, p: { xs: 1, md: 3 }, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 1, flexWrap: 'nowrap' }}>
                <Typography variant="subtitle1" fontWeight={700} color="primary.main" sx={{ fontSize: { xs: '1rem', md: '1.1rem' }, whiteSpace: 'nowrap' }}>Sales Trend</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, ml: 2, flexShrink: 0, whiteSpace: 'nowrap' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: { xs: '0.85rem', md: '1rem' }, mb: 0, whiteSpace: 'nowrap', mr: 0.5 }}>Total Sales</Typography>
                    <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ fontSize: { xs: '1.1rem', md: '1.3rem' }, lineHeight: 1, whiteSpace: 'nowrap' }}>
                      <AnimatedNumber value={totalDeliveredSales} />
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ height: { xs: 220, md: 300 }, px: { xs: 0, md: 2 } }}>
                <ResponsiveLine
                  data={[{ id: 'Sales', color: blue[500], data: salesHistory }]}
                  margin={{ top: 30, right: 30, bottom: 50, left: 50 }}
                  xScale={{ type: 'point' }}
                  yScale={{ type: 'linear', min: 0, max: 'auto', stacked: false, reverse: false }}
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 8,
                    tickPadding: 8,
                    tickRotation: 0,
                    legend: 'Day',
                    legendOffset: 36,
                    legendPosition: 'middle',
                    format: (value: string) => {
                      const d = new Date(value);
                      return d.toLocaleDateString('en-US', { weekday: 'short' });
                    },
                  }}
                  axisLeft={{ tickSize: 8, tickPadding: 8, tickRotation: 0, legend: 'Sales', legendOffset: -55, legendPosition: 'middle', tickValues: 4 }}
                  colors={[blue[500]]}
                  pointSize={8}
                  pointColor={{ theme: 'background' }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: 'serieColor' }}
                  pointLabelYOffset={-12}
                  useMesh={true}
                  enableArea={true}
                  areaOpacity={0.15}
                  enableGridX={false}
                  enableGridY={false}
                  tooltip={({ point }) => (
                    <Box sx={{ bgcolor: 'white', p: 1, borderRadius: 1, boxShadow: 2 }}>
                      <Typography variant="body2" color="primary.main">{point.data.xFormatted}</Typography>
                      <Typography variant="body2" color="text.secondary">₹{point.data.yFormatted}</Typography>
                    </Box>
                  )}
                />
              </Box>
            </Card>
          </Box>
          {/* Pending Collections Panel */}
          {reportData?.totalCredit > 0 && pendingCollections.length > 0 && (
            <div className="mb-8 cursor-pointer" onClick={() => navigate('/collections')}>
              <div className="text-lg font-semibold text-red-800 mb-2 flex items-center gap-2">
                <Wallet2 className="w-5 h-5" /> Pending Collections
              </div>
              <div className="bg-white rounded-2xl shadow p-4 border border-red-100">
                <ul>
                  {pendingCollections.map((c) => (
                    <li key={c.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <span className="font-medium text-gray-800">{c.name}</span>
                      <span className="text-red-600 font-bold">₹{c.pending}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-xs text-gray-500 mt-2">Tap to view and collect udhaar</div>
              </div>
            </div>
          )}
          {/* Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
              <div className="text-lg font-semibold text-blue-900 mb-4">Recent Orders</div>
              <ul className="divide-y divide-gray-100">
                {recentOrders.length === 0 && <li className="text-gray-400 text-sm">No recent orders.</li>}
                {recentOrders.map((o) => (
                  <li key={o.id} className="py-2 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">Order #{o.id.slice(-5)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${o.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700'}`}>{o.status}</span>
                    </div>
                    <div className="text-xs text-gray-500">{o.job_date}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
              <div className="text-lg font-semibold text-blue-900 mb-4">Recent Quotations</div>
              <ul className="divide-y divide-gray-100">
                {recentQuotations.length === 0 && <li className="text-gray-400 text-sm">No recent quotations.</li>}
                {recentQuotations.map((q) => (
                  <li key={q.id} className="py-2 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">Quotation #{q.id.slice(-5)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${q.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : q.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{q.status}</span>
                    </div>
                    <div className="text-xs text-gray-500">{q.job_date}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Box>
      </Box>
      {/* Floating action button for mobile only, always visible and outside main container */}
      <div className="md:hidden">
        <FloatingActionButton />
      </div>
    </AppLayout>
  );
}
