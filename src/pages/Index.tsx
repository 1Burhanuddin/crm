import { useNavigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { useReportsData } from "@/hooks/useReportsData";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/ui/BottomNav";
import { format } from 'date-fns';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { AppLayout } from '@/components/AppLayout';
import { useIsMobile } from "@/hooks/use-mobile";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, AlertCircle, BarChart3 } from 'lucide-react';
import Avatar from '@mui/material/Avatar';
import { generateColorFromString } from "@/lib/utils";
import { PendingCollectionsTab } from '@/components/PendingCollectionsTab';

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3 min-w-[120px]">
        <p className="text-sm text-gray-600 mb-1">{format(new Date(label), 'MMM dd, yyyy')}</p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"></div>
          <p className="font-semibold text-gray-800">₹{payload[0].value.toLocaleString()}</p>
        </div>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useSession();
  const { data: reportData, isLoading } = useReportsData();
  const [salesHistory, setSalesHistory] = useState<{ date: string; sales: number; orders: number }[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentQuotations, setRecentQuotations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [pendingCollections, setPendingCollections] = useState<any[]>([]);
  const [profile, setProfile] = useState<{ name: string | null; profile_image_url: string | null; email: string } | null>(null);
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    growthRate: 0
  });
  const isMobile = useIsMobile();

  const mobileTickValues = useMemo(() => {
    if (!isMobile || salesHistory.length <= 5) {
      return undefined;
    }
    const ticks = [];
    const numTicks = 4;
    const step = (salesHistory.length - 1) / (numTicks - 1);
    for (let i = 0; i < numTicks; i++) {
      const index = Math.round(i * step);
      if (salesHistory[index]) {
        ticks.push(salesHistory[index].date);
      }
    }
    return ticks;
  }, [salesHistory, isMobile]);

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

  useEffect(() => {
    async function fetchSalesHistory() {
      if (!user) return;
      
      const { data: orders } = await supabase
        .from("orders")
        .select("job_date, products, advance_amount, status")
        .eq("user_id", user.id)
        .eq("status", "delivered")
        .order("job_date", { ascending: true });
      
      if (!orders) return;

      const { data: products } = await supabase
        .from("products")
        .select("id, price")
        .eq("user_id", user.id);
      
      const priceMap = new Map();
      (products || []).forEach((p) => {
        priceMap.set(p.id, Number(p.price) || 0);
      });

      const salesByDate: { [key: string]: { sales: number; orders: number } } = {};
      let totalRevenue = 0;
      let totalOrderCount = 0;
      
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
          const dayStr = o.job_date;
          if (!salesByDate[dayStr]) {
            salesByDate[dayStr] = { sales: 0, orders: 0 };
          }
          salesByDate[dayStr].sales += total;
          salesByDate[dayStr].orders += 1;
          totalRevenue += total;
          totalOrderCount += 1;
        }
      });

      // Generate last 30 days of data for better visualization
      const last30Days = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().slice(0, 10);
        last30Days.push({
          date: dateStr,
          sales: salesByDate[dateStr]?.sales || 0,
          orders: salesByDate[dateStr]?.orders || 0
        });
      }

      setSalesHistory(last30Days);
      
      // Calculate analytics
      const avgOrderValue = totalOrderCount > 0 ? totalRevenue / totalOrderCount : 0;
      const recentSales = last30Days.slice(-7).reduce((sum, day) => sum + day.sales, 0);
      const previousWeekSales = last30Days.slice(-14, -7).reduce((sum, day) => sum + day.sales, 0);
      const growthRate = previousWeekSales > 0 ? ((recentSales - previousWeekSales) / previousWeekSales) * 100 : 0;
      
      setAnalytics({
        totalRevenue,
        totalOrders: totalOrderCount,
        avgOrderValue,
        growthRate
      });
    }
    fetchSalesHistory();
  }, [user]);

  useEffect(() => {
    async function fetchCustomers() {
      if (!user) return;
      const { data: customersData } = await supabase
        .from("customers")
        .select("id, name")
        .eq("user_id", user.id);
      if (customersData) {
        setCustomers(customersData);
      }
    }
    fetchCustomers();
  }, [user]);

  useEffect(() => {
    async function fetchRecent() {
      if (!user) return;
      const { data: orders } = await supabase
        .from("orders")
        .select("id, customer_id, job_date, status, products")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentOrders(orders || []);
      
      const { data: quotations } = await supabase
        .from("quotations")
        .select("id, customer_id, job_date, status, product_id, qty")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentQuotations(quotations || []);
    }
    fetchRecent();
  }, [user]);

  useEffect(() => {
    async function fetchPendingCollections() {
      if (!user) return;
      
      // Get all delivered orders to calculate pending amounts
      const { data: orders } = await supabase
        .from("orders")
        .select("id, customer_id, products, advance_amount")
        .eq("user_id", user.id)
        .eq("status", "delivered");

      if (!orders) return;

      // Get product prices
      const { data: products } = await supabase
        .from("products")
        .select("id, price")
        .eq("user_id", user.id);

      const priceMap = new Map();
      (products || []).forEach((p) => {
        priceMap.set(p.id, Number(p.price) || 0);
      });

      // Get all collections with dates
      const { data: collections } = await supabase
        .from("collections")
        .select("customer_id, amount, collection_date")
        .eq("user_id", user.id);

      const collectionsByCustomer = new Map();
      (collections || []).forEach((c) => {
        const existing = collectionsByCustomer.get(c.customer_id) || 0;
        collectionsByCustomer.set(c.customer_id, existing + Number(c.amount));
      });

      // Calculate pending amounts with collection dates
      const pendingByCustomer = new Map<string, { amount: number; collection_date?: string }>();
      
      orders.forEach((order) => {
        let orderTotal = 0;
        if (Array.isArray(order.products)) {
          (order.products as any[]).forEach((item) => {
            if (item && typeof item === 'object' && 'productId' in item && 'qty' in item) {
              const price = priceMap.get(item.productId) || 0;
              const qty = Number(item.qty) || 0;
              orderTotal += price * qty;
            }
          });
        }
        
        const totalDue = orderTotal - Number(order.advance_amount || 0);
        const collected = collectionsByCustomer.get(order.customer_id) || 0;
        const pending = totalDue - collected;
        
        if (pending > 0) {
          const existing = pendingByCustomer.get(order.customer_id);
          if (existing) {
            existing.amount += pending;
          } else {
            // Find the earliest collection date for this customer
            const customerCollections = collections?.filter(c => c.customer_id === order.customer_id) || [];
            const earliestCollectionDate = customerCollections
              .filter(c => c.collection_date)
              .sort((a, b) => new Date(a.collection_date!).getTime() - new Date(b.collection_date!).getTime())[0]?.collection_date;
            
            pendingByCustomer.set(order.customer_id, {
              amount: pending,
              collection_date: earliestCollectionDate || undefined
            });
          }
        }
      });

      const pendingArray = Array.from(pendingByCustomer.entries()).map(([customer_id, data]) => ({
        customer_id,
        amount: data.amount,
        collection_date: data.collection_date
      }));

      setPendingCollections(pendingArray);
    }
    fetchPendingCollections();
  }, [user]);

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || "Unknown Customer";
  };

  const formatCurrency = (value: number) => {
    if (value >= 100000) return `₹${(value/100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value/1000).toFixed(0)}K`;
    return `₹${value}`;
  };

  return (
    <AppLayout title="Dashboard">
      <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen">
        {/* Welcome Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <div style={{ marginLeft: 12 }}>
              <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1 }}>
                Welcome back,
              </Typography>
              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>
                {profile?.name || 'User'}!
              </Typography>
            </div>
          </Box>
        </Box>
        
        {/* Enhanced Sales Chart */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Sales Analytics</h3>
                  <p className="text-sm text-gray-600">Revenue trends over the last 30 days</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"></div>
                    <span className="text-gray-600">Sales</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="">
              <div className="h-80">
                {salesHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesHistory} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={{ stroke: '#e2e8f0' }}
                        interval="preserveStartEnd"
                        tickCount={4}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickFormatter={formatCurrency}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={{ stroke: '#e2e8f0' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="url(#salesGradient)"
                        strokeWidth={3}
                        fill="url(#salesGradient)"
                        dot={false}
                        activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <AlertCircle className="h-12 w-12 mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">No sales data available</p>
                    <p className="text-sm text-center">Complete some orders to see your sales analytics</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pending Collections */}
        {pendingCollections.length > 0 && (
          <div className="mb-6">
            <PendingCollectionsTab 
              pendingCollections={pendingCollections}
              customers={customers}
              onCollectionUpdate={() => {
                // Refresh data after collection is added
                window.location.reload();
              }}
            />
          </div>
        )}

        {/* Recent Orders & Quotations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-lg rounded-2xl border-gray-100">
            <CardContent className="p-6">
              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#1e3a8a', mb: 3 }}>
                Recent Orders
              </Typography>
              {recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors border border-gray-100" onClick={() => navigate('/orders')}>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{getCustomerName(order.customer_id)}</div>
                          <div className="text-xs text-gray-500">{format(new Date(order.job_date), 'MMM dd, yyyy')}</div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Typography variant="body2" color="text.secondary">No recent orders</Typography>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg rounded-2xl border-gray-100">
            <CardContent className="p-6">
              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#1e3a8a', mb: 3 }}>
                Recent Quotations
              </Typography>
              {recentQuotations.length > 0 ? (
                <div className="space-y-4">
                  {recentQuotations.map((quotation) => (
                    <div key={quotation.id} className="p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors border border-gray-100" onClick={() => navigate('/quotations')}>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{getCustomerName(quotation.customer_id)}</div>
                          <div className="text-xs text-gray-500">{format(new Date(quotation.job_date), 'MMM dd, yyyy')}</div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          quotation.status === 'converted' ? 'bg-green-100 text-green-800' :
                          quotation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Typography variant="body2" color="text.secondary">No recent quotations</Typography>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
      <FloatingActionButton />
      <BottomNav />
    </AppLayout>
  );
}
