import { useNavigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { useReportsData } from "@/hooks/useReportsData";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/ui/BottomNav";
import { format } from 'date-fns';
import { ResponsiveBar } from '@nivo/bar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { AppLayout } from '@/components/AppLayout';
import { useIsMobile } from "@/hooks/use-mobile";

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useSession();
  const { data: reportData, isLoading } = useReportsData();
  const [salesHistory, setSalesHistory] = useState<{ x: string; y: number }[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentQuotations, setRecentQuotations] = useState<any[]>([]);
  const [profile, setProfile] = useState<{ name: string | null; profile_image_url: string | null; email: string } | null>(null);
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
        ticks.push(salesHistory[index].x);
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
        .eq("status", "delivered");
      if (!orders) return;

      const { data: products } = await supabase
        .from("products")
        .select("id, price")
        .eq("user_id", user.id);
      
      const priceMap = new Map();
      (products || []).forEach((p) => {
        priceMap.set(p.id, Number(p.price) || 0);
      });

      const salesByDate: { [key: string]: number } = {};
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
        .select("id, customer_id, job_date, status, product_id, qty")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentQuotations(quotations || []);
    }
    fetchRecent();
  }, []);

  return (
    <AppLayout title="Dashboard">
      <div className="p-4 bg-gray-50 min-h-screen">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 5, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>
              Welcome, {profile?.name || 'User'}!
            </Typography>
          </Box>
        </Box>
        
        <Card className="mb-4 shadow-lg rounded-2xl">
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#1e3a8a' }}>
                Sales Trend
              </Typography>
            </Box>
            <Box sx={{ height: 250, position: 'relative' }}>
              {salesHistory.length > 0 ? (
                <ResponsiveBar
                  data={salesHistory}
                  keys={['y']}
                  indexBy="x"
                  margin={{ top: 20, right: 20, bottom: 60, left: 50 }}
                  padding={0.3}
                  valueScale={{ type: 'linear' }}
                  indexScale={{ type: 'band', round: true }}
                  colors={['#1e3a8a']}
                  axisTop={null}
                  axisRight={null}
                  axisBottom={isMobile ? {
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Date',
                    legendPosition: 'middle',
                    legendOffset: 35,
                    format: (value) => format(new Date(value), 'dd/MM'),
                    tickValues: mobileTickValues,
                  } : {
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45,
                    legend: 'Date',
                    legendPosition: 'middle',
                    legendOffset: 50,
                    format: (value) => format(new Date(value), 'MMM dd'),
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Sales (₹)',
                    legendPosition: 'middle',
                    legendOffset: -40,
                    format: (value) => {
                      if (value >= 100000) return `${(value/100000).toFixed(1)}L`;
                      if (value >= 1000) return `${(value/1000).toFixed(0)}K`;
                      return value;
                    },
                    tickValues: 5 // Limit to 5 ticks
                  }}
                  enableLabel={false}
                  animate={true}
                  motionConfig="wobbly"
                  tooltip={({ id, value, color }) => (
                    <div
                      style={{
                        padding: '5px 9px',
                        background: '#fff',
                        color: '#333',
                        fontSize: '12px',
                        borderRadius: '6px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      }}
                    >
                      <strong style={{ color }}>{id}:</strong> ₹{value}
                    </div>
                  )}
                  theme={{
                    tooltip: {
                      container: {
                        background: '#fff',
                        color: '#333',
                        fontSize: '12px',
                        borderRadius: '6px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        padding: '5px 9px',
                      },
                    }
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Typography variant="body2" color="text.secondary">
                    No sales data to display a chart.
                  </Typography>
                </div>
              )}
            </Box>
          </CardContent>
        </Card>

        {reportData?.totalCredit > 0 && (
          <div className="mb-8 cursor-pointer" onClick={() => navigate('/collections')}>
            <div className="text-lg font-semibold text-red-800 mb-2 flex items-center gap-2">
              Pending Collections
        </div>
            <div className="bg-white rounded-2xl shadow p-4 border border-red-100">
              <div className="text-2xl font-bold text-red-600 mb-2">₹{reportData.totalCredit.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Tap to view and collect udhaar</div>
        </div>
          </div>
        )}

        {/* Recent Orders */}
        <Card className="mb-4 shadow-lg rounded-2xl">
          <CardContent>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#1e3a8a', mb: 2 }}>
              Recent Orders
            </Typography>
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100" onClick={() => navigate(`/orders/${order.id}`)}>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Order #{order.id}</div>
                        <div className="text-xs text-gray-500">{format(new Date(order.job_date), 'MMM dd, yyyy')}</div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${
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

        {/* Recent Quotations */}
        <Card className="mb-4 shadow-lg rounded-2xl">
          <CardContent>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: '#1e3a8a', mb: 2 }}>
              Recent Quotations
            </Typography>
            {recentQuotations.length > 0 ? (
              <div className="space-y-4">
                {recentQuotations.map((quotation) => (
                  <div key={quotation.id} className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100" onClick={() => navigate(`/quotations/${quotation.id}`)}>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Quotation #{quotation.id}</div>
                        <div className="text-xs text-gray-500">{format(new Date(quotation.job_date), 'MMM dd, yyyy')}</div>
            </div>
                      <div className={`px-2 py-1 rounded text-xs ${
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
      <FloatingActionButton />
      <BottomNav />
    </AppLayout>
  );
}
