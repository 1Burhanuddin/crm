
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

// Defines aggregated stats for the dashboard/report
export interface ReportsData {
  totalSales: number;
  daySales: number;
  weekSales: number;
  monthSales: number;
  totalCredit: number; // <-- (udhaar after collections)
  ordersPending: number;
}

export function useReportsData() {
  const { user } = useSession();

  return useQuery<ReportsData>({
    queryKey: ["reports-summary", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user) throw new Error("Not signed in");

      // SALES: sum of completed (history) orders (status = delivered, udhaar = 0)
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      // Week starts on Monday
      const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
      const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dayOfWeek);

      // Fetch all delivered orders with new structure
      let { data: deliveredOrders, error: orderErr } = await supabase
        .from("orders")
        .select("id, products, advance_amount, status, job_date")
        .eq("user_id", user.id)
        .eq("status", "delivered");
      if (orderErr) throw orderErr;

      // Fetch all products: price lookup
      let { data: products, error: prodErr } = await supabase
        .from("products")
        .select("id, price")
        .eq("user_id", user.id);
      if (prodErr) throw prodErr;

      const priceMap = new Map<string, number>(
        ((products || []) as { id: string; price: number }[]).map((p) => [
          p.id,
          Number(p.price) || 0,
        ])
      );

      // Fetch collections for delivered orders only
      let { data: collections, error: collErr } = await supabase
        .from("collections")
        .select("amount, order_id")
        .eq("user_id", user.id);
      if (collErr) throw collErr;

      // Map of order_id -> collections
      const collectionsMap: Record<string, number> = {};
      (collections || []).forEach((c: any) => {
        if (c.order_id) {
          collectionsMap[c.order_id] =
            (collectionsMap[c.order_id] || 0) + (Number(c.amount) || 0);
        }
      });

      // Only count orders that are fully settled (udhaar == 0)
      let totalSales = 0, daySales = 0, weekSales = 0, monthSales = 0;
      if (Array.isArray(deliveredOrders)) {
        for (const o of deliveredOrders) {
          // Calculate order total from products array
          let orderTotal = 0;
          const orderProducts = Array.isArray(o.products) ? o.products : [];
          for (const item of orderProducts) {
            const price = priceMap.get(item.productId) || 0;
            const qty = Number(item.qty) || 0;
            orderTotal += price * qty;
          }
          
          const advance = Number(o.advance_amount) || 0;
          const collected = collectionsMap[o.id] || 0;
          const udhaar = Math.max(0, orderTotal - advance - collected);
          
          if (udhaar === 0) {
            // Use job_date for date filtering
            if (!o.job_date) continue;
            const [year, month, day] = o.job_date.split('-').map(Number);
            const orderDate = new Date(year, month - 1, day);
            totalSales += orderTotal;
            if (
              orderDate.getFullYear() === startOfDay.getFullYear() &&
              orderDate.getMonth() === startOfDay.getMonth() &&
              orderDate.getDate() === startOfDay.getDate()
            ) {
              daySales += orderTotal;
            }
            if (orderDate >= startOfWeek) weekSales += orderTotal;
            if (orderDate >= startOfMonth) monthSales += orderTotal;
          }
        }
      }

      // 1st: Calculate udhaar on delivered orders only = SUM(max(orderTotal - advance, 0))
      const orderUdhaarMap: Record<string, number> = {};
      const totalOrderUdhaar = Array.isArray(deliveredOrders)
        ? deliveredOrders.reduce((sum: number, o: any) => {
            // Calculate order total from products array
            let orderTotal = 0;
            const orderProducts = Array.isArray(o.products) ? o.products : [];
            for (const item of orderProducts) {
              const price = priceMap.get(item.productId) || 0;
              const qty = Number(item.qty) || 0;
              orderTotal += price * qty;
            }
            
            const advance = Number(o.advance_amount) || 0;
            const collected = collectionsMap[o.id] || 0;
            const pending = orderTotal - advance - collected;
            const udhaar = pending > 0 ? pending : 0;
            orderUdhaarMap[o.id] = udhaar;
            return sum + udhaar;
          }, 0)
        : 0;

      // Calculate net outstanding udhaar for delivered orders only
      let totalDeliveredCredit = 0;
      Object.keys(orderUdhaarMap).forEach((orderId) => {
        const collected = collectionsMap[orderId] || 0;
        const udhaarLeft = Math.max(0, orderUdhaarMap[orderId] - collected);
        totalDeliveredCredit += udhaarLeft;
      });

      // Pending orders count (status = pending)
      let { count: ordersPending, error: pendingCountErr } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending");
      if (pendingCountErr) throw pendingCountErr;

      return {
        totalSales,
        daySales,
        weekSales,
        monthSales,
        totalCredit: totalDeliveredCredit,
        ordersPending: ordersPending || 0,
      };
    },
  });
}
