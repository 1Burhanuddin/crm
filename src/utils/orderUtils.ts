
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

// Helper to convert OrderProduct[] to Json for database storage
export const orderProductsToJson = (products: OrderProduct[]): any => {
  return products.map(p => ({
    productId: p.productId,
    qty: p.qty
  }));
};

// Helper to convert Json to OrderProduct[]
export const jsonToOrderProducts = (json: any): OrderProduct[] => {
  if (!Array.isArray(json)) return [];
  return json.map(item => ({
    productId: item.productId || '',
    qty: Number(item.qty) || 0
  }));
};
