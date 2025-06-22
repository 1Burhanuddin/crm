import React, { useState } from "react";
import { useSession } from "@/hooks/useSession";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Order, Product, Customer } from "@/constants/types";
import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Helper: fetch customers for current user
const fetchCustomers = async (user_id: string): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((c) => ({ id: c.id, name: c.name, phone: c.phone }));
};

// Helper: fetch products for current user
const fetchProducts = async (user_id?: string): Promise<Product[]> => {
  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (user_id) {
    query = query.eq("user_id", user_id);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Product[];
};

// Helper: fetch orders for current user
const fetchOrders = async (user_id: string): Promise<Order[]> => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((o) => {
    const row = o as any;
    return {
      id: row.id,
      customerId: row.customer_id,
      productId: row.product_id,
      qty: row.qty,
      status: row.status as "pending" | "delivered",
      jobDate: row.job_date,
      assignedTo: row.assigned_to || "",
      siteAddress: row.site_address || "",
      photoUrl: row.photo_url || "",
      advanceAmount: typeof row.advance_amount === "number" && !isNaN(row.advance_amount) ? row.advance_amount : 0,
    };
  });
};

// Helper: fetch collections for each order of current user
const fetchCollectionsPerOrder = async (user_id: string) => {
  const { data, error } = await supabase
    .from("collections")
    .select("order_id, amount")
    .eq("user_id", user_id);
  if (error) throw error;
  const orderMap: Record<string, number> = {};
  for (const coll of data || []) {
    if (coll.order_id) {
      orderMap[coll.order_id] = (orderMap[coll.order_id] || 0) + Number(coll.amount || 0);
    }
  }
  return orderMap;
};

interface PendingOrdersNotificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PendingOrdersNotification({ open, onOpenChange }: PendingOrdersNotificationProps) {
  const { user } = useSession();

  const { data: customers = [] } = useQuery({
    queryKey: ["customers", user?.id],
    queryFn: () => fetchCustomers(user?.id ?? ""),
    enabled: !!user?.id,
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products", user?.id],
    queryFn: () => fetchProducts(user?.id ?? ""),
    enabled: !!user?.id,
  });
  const { data: orders = [] } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: () => fetchOrders(user?.id ?? ""),
    enabled: !!user?.id,
  });
  const { data: collectionsPerOrder = {} } = useQuery({
    queryKey: ["order-collections", user?.id],
    queryFn: () => user ? fetchCollectionsPerOrder(user.id) : {},
    enabled: !!user?.id,
  });

  // Helper for calculating order total & pending
  function orderTotals(order: Order) {
    const product = products.find(p => p.id === order.productId);
    const total = product ? product.price * order.qty : 0;
    const advance = order.advanceAmount || 0;
    const collected = collectionsPerOrder[order.id] || 0;
    const pending = Math.max(0, total - advance - collected);
    return { total, advance, pending, collected };
  }

  // Filter pending orders
  const pendingOrders = orders.filter((o) => o.status === "pending");

  // Helper to get customer/product names
  function customerName(id: string) {
    const c = customers.find((c) => c.id === id);
    return c ? c.name : "(Unknown customer)";
  }
  function productName(id: string) {
    const p = products.find((p) => p.id === id);
    return p ? p.name : "(Unknown product)";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full p-0 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-bold text-blue-900">Pending Orders</h2>
          <button onClick={() => onOpenChange(false)} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
      </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {pendingOrders.length === 0 ? (
            <div className="text-center text-gray-500 py-10">No pending orders 🎉</div>
          ) : (
            <ul className="flex flex-col gap-4">
              {pendingOrders.map((o) => {
                const { total, pending } = orderTotals(o);
                return (
                  <li key={o.id} className="bg-white rounded-xl shadow border border-blue-100 p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-blue-900 text-base truncate">{customerName(o.customerId)}</div>
                      <span className="bg-blue-50 text-blue-800 font-bold text-sm rounded-lg px-2 py-0.5">₹{total}</span>
                  </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700 truncate">{productName(o.productId)}</div>
                      {pending > 0 && (
                        <span className="inline-flex items-center bg-yellow-100 text-yellow-800 rounded-full px-2 py-0.5 text-xs font-semibold">Pending: ₹{pending}</span>
                      )}
                  </div>
                    <div className="text-xs text-gray-500 mt-1">Job Date: {o.jobDate}</div>
                </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}