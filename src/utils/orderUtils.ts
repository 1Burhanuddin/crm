
import { supabase } from "@/integrations/supabase/client";

export interface OrderProduct {
  productId: string;
  qty: number;
}

export const getCustomerNameById = async (customerId: string, userId: string): Promise<string> => {
  const { data: customer } = await supabase
    .from("customers")
    .select("name")
    .eq("id", customerId)
    .eq("user_id", userId)
    .maybeSingle();
  
  return customer?.name || "Unknown Customer";
};

export const calculateOrderTotal = (products: OrderProduct[], priceMap: Map<string, number>): number => {
  let total = 0;
  products.forEach((item) => {
    const price = priceMap.get(item.productId) || 0;
    const qty = Number(item.qty) || 0;
    total += price * qty;
  });
  return total;
};
