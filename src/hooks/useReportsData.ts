
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

// Defines aggregated stats for the dashboard/report
export interface ReportsData {
  totalSales: number;
  totalCredit: number;
  ordersPending: number;
}

export function useReportsData() {
  const { user } = useSession();

  return useQuery<ReportsData>({
    queryKey: ["reports-summary", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user) throw new Error("Not signed in");

      // Sum all 'paid' transactions for user (totalSales)
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

      // --- Calculate total udhaar/credit as SUM of all (order.total - order.advanceAmount) for orders (pending+delivered) --
      //    Order total = product.price * order.qty
      //    Pending = order total - advance amount

      // Fetch all orders for the user
      let { data: orderData, error: orderErr } = await supabase
        .from("orders")
        .select("id, product_id, qty, advance_amount, status")
        .eq("user_id", user.id);
      if (orderErr) throw orderErr;

      // Fetch all products for the user (for price lookup)
      let { data: products, error: prodErr } = await supabase
        .from("products")
        .select("id, price")
        .eq("user_id", user.id);
      if (prodErr) throw prodErr;

      // Build a price lookup map for fast access
      const priceMap = new Map<string, number>(
        ((products || []) as { id: string; price: number }[]).map((p) => [
          p.id,
          Number(p.price) || 0,
        ])
      );

      // Calculate pending/udhaar for each order (pending for all statuses, including delivered, as per your logic)
      const totalCredit = Array.isArray(orderData)
        ? orderData.reduce((sum: number, o: any) => {
            const price = priceMap.get(o.product_id) || 0;
            const qty = Number(o.qty) || 0;
            const orderTotal = price * qty;
            const advance = Number(o.advance_amount) || 0;
            // Pending is only udhaar if > 0
            const pending = orderTotal - advance;
            return sum + (pending > 0 ? pending : 0);
          }, 0)
        : 0;

      // Count of orders still "pending" status
      let { count: ordersPending, error: pendingCountErr } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending");
      if (pendingCountErr) throw pendingCountErr;

      return {
        totalSales,
        totalCredit,
        ordersPending: ordersPending || 0,
      };
    },
  });
}

