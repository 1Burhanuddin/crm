
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

      // 1. SALES (as before)
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

      // --- Credit: sum pending on orders minus collections ---
      // Fetch all orders:
      let { data: orderData, error: orderErr } = await supabase
        .from("orders")
        .select("id, product_id, qty, advance_amount, status")
        .eq("user_id", user.id);
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

      // 1st: Calculate total udhaar on orders = SUM(max(orderTotal - advance, 0))
      const totalOrderUdhaar = Array.isArray(orderData)
        ? orderData.reduce((sum: number, o: any) => {
            const price = priceMap.get(o.product_id) || 0;
            const qty = Number(o.qty) || 0;
            const orderTotal = price * qty;
            const advance = Number(o.advance_amount) || 0;
            const pending = orderTotal - advance;
            return sum + (pending > 0 ? pending : 0);
          }, 0)
        : 0;

      // 2nd: Fetch total amount collected (collections table)
      let { data: collections, error: collErr } = await supabase
        .from("collections")
        .select("amount")
        .eq("user_id", user.id);
      if (collErr) throw collErr;
      const totalCollections =
        Array.isArray(collections)
          ? collections.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)
          : 0;

      // 3rd: Net credit = udhaar (all orders) - collections
      const totalCredit = Math.max(0, totalOrderUdhaar - totalCollections);

      // Pending orders count (status = pending)
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
