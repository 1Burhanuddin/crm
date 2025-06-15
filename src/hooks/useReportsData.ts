import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

// Defines aggregated stats for the dashboard/report
export interface ReportsData {
  totalSales: number;
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

      // SALES (as before)
      let { data: sales, error: salesError } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("type", "paid");
      if (salesError) throw salesError;
      const totalSales =
        Array.isArray(sales)
          ? sales.reduce((a: number, t: any) => a + (Number(t.amount) || 0), 0)
          : 0;

      // Fetch all delivered orders only (for udhaar calculation)
      let { data: deliveredOrders, error: orderErr } = await supabase
        .from("orders")
        .select("id, product_id, qty, advance_amount, status")
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

      // 1st: Calculate udhaar on delivered orders only = SUM(max(orderTotal - advance, 0))
      const orderUdhaarMap: Record<string, number> = {};
      const totalOrderUdhaar = Array.isArray(deliveredOrders)
        ? deliveredOrders.reduce((sum: number, o: any) => {
            const price = priceMap.get(o.product_id) || 0;
            const qty = Number(o.qty) || 0;
            const orderTotal = price * qty;
            const advance = Number(o.advance_amount) || 0;
            const pending = orderTotal - advance;
            const udhaar = pending > 0 ? pending : 0;
            orderUdhaarMap[o.id] = udhaar;
            return sum + udhaar;
          }, 0)
        : 0;

      // Fetch collections for delivered orders only
      let { data: collections, error: collErr } = await supabase
        .from("collections")
        .select("amount, order_id")
        .eq("user_id", user.id);
      if (collErr) throw collErr;

      // Map of order_id -> collections
      const collectionsMap: Record<string, number> = {};
      (collections || []).forEach((c: any) => {
        if (c.order_id && orderUdhaarMap[c.order_id] !== undefined) {
          collectionsMap[c.order_id] =
            (collectionsMap[c.order_id] || 0) + (Number(c.amount) || 0);
        }
      });

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
        totalCredit: totalDeliveredCredit,
        ordersPending: ordersPending || 0,
      };
    },
  });
}
