
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

  return useQuery({
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
          ? sales.reduce((a: number, t: any) => a + (typeof t.amount === "number" ? t.amount : 0), 0)
          : 0;

      // Sum all 'udhaar' transactions for user (totalCredit)
      let { data: credit, error: creditError } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("type", "udhaar");
      if (creditError) throw creditError;
      const totalCredit =
        Array.isArray(credit)
          ? credit.reduce((a: number, t: any) => a + (typeof t.amount === "number" ? t.amount : 0), 0)
          : 0;

      // Count orders with status "pending" for user
      let { count: ordersPending, error: orderErr } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending");
      if (orderErr) throw orderErr;

      // Don't use any type assertion or ReportsData here
      return {
        totalSales,
        totalCredit,
        ordersPending: ordersPending || 0,
      };
    },
  });
}
