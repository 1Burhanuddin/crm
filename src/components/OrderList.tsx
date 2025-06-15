import { useSession } from "@/hooks/useSession";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Order, Product, Customer } from "@/constants/types";
import { Plus, Edit, Receipt, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { AddOrderModal } from "./AddOrderModal";
import { EditOrderModal } from "./EditOrderModal";
import { BillCreateModal } from "./BillCreateModal";
import React from "react";
import { OrderActionsMenu } from "./OrderActionsMenu";

// Helper: fetch customers for current user
const fetchCustomers = async (user_id: string): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  // Map ids to string for consistency (since table uses uuid)
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

// Add this type for correct typing of the fetched Supabase order rows
type SupabaseOrderRow = {
  assigned_to: string | null;
  created_at: string;
  customer_id: string;
  id: string;
  job_date: string;
  photo_url: string | null;
  product_id: string;
  qty: number;
  site_address: string | null;
  status: string;
  updated_at: string;
  user_id: string;
  advance_amount?: number; // <-- allow this as optional (if null or missing)
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
    // Use the Supabase field directly; fallback to zero if missing or null
    const row = o as {
      assigned_to: string | null;
      created_at: string;
      customer_id: string;
      id: string;
      job_date: string;
      photo_url: string | null;
      product_id: string;
      qty: number;
      site_address: string | null;
      status: string;
      updated_at: string;
      user_id: string;
      advance_amount?: number | null;
    };
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
      advanceAmount:
        typeof row.advance_amount === "number" && !isNaN(row.advance_amount)
          ? row.advance_amount
          : 0,
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
  // group collections by order_id
  const orderMap: Record<string, number> = {};
  for (const coll of data || []) {
    if (coll.order_id) {
      orderMap[coll.order_id] = (orderMap[coll.order_id] || 0) + Number(coll.amount || 0);
    }
  }
  return orderMap;
};

export function OrderList() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  // Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Bill generation state
  const [showBillModal, setShowBillModal] = useState(false);
  const [billInitialData, setBillInitialData] = useState<any>(null);

  // Fetch all required data (orders, customers, products)
  const {
    data: customers = [],
    isLoading: loadingCustomers,
    error: customerError,
  } = useQuery({
    queryKey: ["customers", user?.id],
    queryFn: () => fetchCustomers(user?.id ?? ""),
    enabled: !!user?.id,
  });

  const {
    data: products = [],
    isLoading: loadingProducts,
    error: productError,
  } = useQuery({
    queryKey: ["products", user?.id],
    queryFn: () => fetchProducts(user?.id ?? ""), // pass user id for user-specific fetch
    enabled: !!user?.id,
  });

  const {
    data: orders = [],
    isLoading: loadingOrders,
    error: orderError,
  } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: () => fetchOrders(user?.id ?? ""),
    enabled: !!user?.id,
  });

  // Fetch collections per order (as a map: orderId -> sum collected)
  const {
    data: collectionsPerOrder = {},
    isLoading: loadingCollectionsPerOrder,
    error: collectionsPerOrderError,
  } = useQuery({
    queryKey: ["order-collections", user?.id],
    queryFn: () => user ? fetchCollectionsPerOrder(user.id) : {},
    enabled: !!user?.id,
  });

  // Add new order
  const addOrderMutation = useMutation({
    mutationFn: async (orderData: Omit<Order, 'id'>) => {
      if (!user) throw new Error('User not authenticated');
      const { error } = await supabase.from("orders").insert([
        {
          user_id: user.id,
          customer_id: orderData.customerId,
          product_id: orderData.productId,
          qty: orderData.qty,
          status: orderData.status,
          job_date: orderData.jobDate,
          assigned_to: orderData.assignedTo,
          site_address: orderData.siteAddress,
          photo_url: orderData.photoUrl || "",
          advance_amount: orderData.advanceAmount || 0,
        }
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", user?.id] });
      toast({ title: "Order Added", description: "New order has been added successfully." });
      setShowAdd(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Could not add order.", variant: "destructive" });
    },
    meta: { onError: true }
  });

  // Edit existing order
  const editOrderMutation = useMutation({
    mutationFn: async (updatedOrder: Order) => {
      if (!user) throw new Error('User not authenticated');
      const { error } = await supabase.from("orders")
        .update({
          customer_id: updatedOrder.customerId,
          product_id: updatedOrder.productId,
          qty: updatedOrder.qty,
          status: updatedOrder.status,
          job_date: updatedOrder.jobDate,
          assigned_to: updatedOrder.assignedTo,
          site_address: updatedOrder.siteAddress,
          photo_url: updatedOrder.photoUrl || "",
          updated_at: new Date().toISOString(),
          advance_amount: updatedOrder.advanceAmount || 0,
        })
        .eq("id", updatedOrder.id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", user?.id] });
      toast({ title: "Order Updated", description: "Order has been updated successfully." });
      setShowEdit(false);
      setEditingOrder(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Could not update order.", variant: "destructive" });
    },
    meta: { onError: true }
  });

  // Delete order
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      if (!user) throw new Error('User not authenticated');
      const { error } = await supabase.from("orders")
        .delete()
        .eq("id", orderId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", user?.id] });
      toast({ title: "Order Deleted", description: "Order has been deleted successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Could not delete order.", variant: "destructive" });
    },
    meta: { onError: true }
  });

  // Add new handler for marking as delivered
  const markDeliveredMutation = useMutation({
    mutationFn: async (order: Order) => {
      if (!user) throw new Error('User not authenticated');
      const { error } = await supabase.from("orders")
        .update({
          status: "delivered",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", user?.id] });
      toast({ title: "Order marked as delivered." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Could not update order status.", variant: "destructive" });
    },
    meta: { onError: true }
  });

  function handleMarkDelivered(order: Order) {
    markDeliveredMutation.mutate(order);
  }

  // Data helpers: robust lookup that logs missing refs and returns "Unknown" if not found
  function customerName(id: string) {
    const c = customers.find((c) => c.id === id);
    if (!c) {
      console.warn("Missing customer in OrderList:", id);
      return "(Unknown customer)";
    }
    return c.name;
  }

  function customerPhone(id: string) {
    const c = customers.find((c) => c.id === id);
    return c ? c.phone : "";
  }

  function productName(id: string) {
    const product = products.find(p => p.id === id);
    if (!product) {
      console.warn("Missing product in OrderList:", id);
      return "(Unknown product)";
    }
    return product.name;
  }

  function productUnitAndPrice(id: string) {
    const product = products.find(p => p.id === id);
    if (product) {
      return { unit: product.unit, price: product.price };
    }
    console.warn("Missing product in OrderList (unit/price):", id);
    return { unit: "pcs", price: 0 };
  }

  // Handlers
  function handleAddOrder(orderData: Omit<Order, 'id'>) {
    addOrderMutation.mutate(orderData);
  }

  function handleEditOrder(updatedOrder: Order) {
    editOrderMutation.mutate(updatedOrder);
  }

  function openEditModal(order: Order) {
    setEditingOrder(order);
    setShowEdit(true);
  }

  function handleDeleteOrder(orderId: string) {
    // Confirm before delete
    if (window.confirm("Are you sure you want to delete this order?")) {
      deleteOrderMutation.mutate(orderId);
    }
  }

  // === BILL GENERATION ===
  function openBillModalFromOrder(order: Order) {
    const prodInfo = productUnitAndPrice(order.productId);
    setBillInitialData({
      customerName: customerName(order.customerId),
      customerPhone: customerPhone(order.customerId),
      items: [
        {
          name: productName(order.productId),
          qty: order.qty,
          price: prodInfo.price,
        }
      ]
    });
    setShowBillModal(true);
  }

  // Always pass {} not null/undefined
  const safeInitialData = billInitialData && typeof billInitialData === "object" ? billInitialData : {};

  // Helper for calculating order total & pending/udhaar (CHANGED)
  function orderTotals(order: Order) {
    const product = products.find(p => p.id === order.productId);
    const total = product ? product.price * order.qty : 0;
    const advance = order.advanceAmount || 0;
    const collected = collectionsPerOrder[order.id] || 0;
    if (order.status === "pending") {
      // Pending amount while order is not delivered
      const pending = Math.max(0, total - advance - collected);
      return { total, advance, pending, udhaar: 0, collected };
    } else if (order.status === "delivered") {
      // Udhaar after delivered
      const udhaar = Math.max(0, total - advance - collected);
      return { total, advance, pending: 0, udhaar, collected };
    }
    return { total, advance, pending: 0, udhaar: 0, collected };
  }

  // Loading/error UI
  if (loadingCustomers || loadingProducts || loadingOrders) {
    return (
      <div className="flex flex-col min-h-[40vh] justify-center items-center text-blue-800 text-lg font-semibold">
        Loading orders...
      </div>
    );
  }
  if (customerError || productError || orderError) {
    return (
      <div className="p-4 text-red-700">
        Failed to load orders{": "}
        {customerError?.message || productError?.message || orderError?.message}
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-blue-900">Orders</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-700 text-white px-3 py-1 rounded flex items-center gap-1 text-sm shadow hover:bg-blue-800"
        >
          <Plus size={18} /> Add
        </button>
      </div>
      <ul>
        {orders.map((o) => {
          const { total, pending, udhaar, collected } = orderTotals(o);
          // Highlight cards with missing refs
          const missingCustomer = !customers.find((c) => c.id === o.customerId);
          const missingProduct = !products.find((p) => p.id === o.productId);
          const cardError =
            missingCustomer || missingProduct
              ? "bg-yellow-50 border-yellow-300"
              : "bg-white";
          return (
            <li
              key={o.id}
              className={`mb-4 ${cardError} rounded-lg px-4 py-3 shadow border`}
            >
              {/* Reworked flex to put actions menu consistently at the end */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-blue-900 text-base truncate">
                    {customerName(o.customerId)}
                    {missingCustomer && (
                      <span className="ml-2 text-xs text-yellow-700">(not found)</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 truncate">
                    {productName(o.productId)}
                    {missingProduct && (
                      <span className="ml-2 text-xs text-yellow-700">(not found)</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 items-center ml-auto">
                  {/* Show pending credit/udhaar appropriately
                      - Pending status: Pending: ₹pending
                      - Delivered: Udhaar: ₹udhaar (only if >0) */}
                  {o.status === "pending" && pending > 0 && (
                    <span className="inline-flex items-center bg-yellow-100 text-yellow-800 rounded px-2 py-0.5 text-xs font-semibold">
                      Pending: ₹{pending}
                    </span>
                  )}
                  {o.status === "delivered" && udhaar > 0 && (
                    <span className="inline-flex items-center bg-red-100 text-red-700 rounded px-2 py-0.5 text-xs font-semibold">
                      Udhaar: ₹{udhaar}
                    </span>
                  )}
                  {o.status === "delivered" && (
                    <button
                      className="border border-green-200 text-green-700 hover:bg-green-50 px-3 py-1 rounded text-xs flex items-center gap-1 font-medium transition-all"
                      onClick={() => openBillModalFromOrder(o)}
                      title="Generate Bill"
                    >
                      <Receipt size={14} /> Generate Bill
                    </button>
                  )}
                  <OrderActionsMenu
                    onEdit={() => openEditModal(o)}
                    onDelete={() => handleDeleteOrder(o.id)}
                    canMarkDelivered={o.status === "pending"}
                    onMarkDelivered={o.status === "pending" ? () => handleMarkDelivered(o) : undefined}
                  />
                </div>
              </div>
              {/* Row: ID for debugging */}
              <div className="text-xs font-mono my-1 break-all text-gray-600">{o.id}</div>
              {/* Info ROW: Qty, status, assignment, job date */}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  Qty: {o.qty}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    o.status === "pending"
                      ? "bg-yellow-200 text-yellow-900"
                      : "bg-green-200 text-green-900"
                  }`}
                >
                  {o.status === "pending" ? "Pending" : "Delivered"}
                </span>
                {o.assignedTo && (
                  <span className="text-xs text-gray-700">
                    Assigned to: {o.assignedTo}
                  </span>
                )}
                <span className="text-gray-400 text-xs">{o.jobDate}</span>
                {/* always show total/advance if relevant */}
                <span className="text-xs text-blue-700 ml-2">
                  Total: ₹{total}
                </span>
                {o.advanceAmount > 0 && (
                  <span className="text-xs text-green-700 ml-1">
                    Advance: ₹{o.advanceAmount}
                  </span>
                )}
                {/* Optionally display amount collected */}
                {collected > 0 && (
                  <span className="text-xs text-emerald-700 ml-1">
                    Collected: ₹{collected}
                  </span>
                )}
              </div>
              {cardError !== "bg-white" && (
                <div className="mt-2 text-xs text-yellow-800 italic">
                  Warning: This order references a deleted/missing{" "}
                  {missingCustomer && "customer"}
                  {missingCustomer && missingProduct && " and "}
                  {missingProduct && !missingCustomer && "product"}
                  . You may need to edit or delete this order.
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {orders.length === 0 && (
        <div className="text-gray-500 mt-10 text-center">No orders found.</div>
      )}
      {/* Already user-specific from query */}
      <AddOrderModal
        open={showAdd}
        onOpenChange={setShowAdd}
        onAdd={handleAddOrder}
        customers={customers}
        products={products}
      />
      <EditOrderModal
        open={showEdit}
        onOpenChange={setShowEdit}
        onEdit={handleEditOrder}
        order={editingOrder}
      />
      <BillCreateModal
        open={showBillModal}
        setOpen={setShowBillModal}
        onBillCreated={() => {
          setShowBillModal(false);
          toast({ title: "Bill generated!" });
        }}
        initialData={safeInitialData}
      />
    </div>
  );
}
