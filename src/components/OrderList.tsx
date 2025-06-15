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
const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Product[];
};

// Helper: fetch orders for current user
const fetchOrders = async (user_id: string): Promise<Order[]> => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  // Cast for compatibility: Supabase returns snake_case, our UI expects camelCase
  return (data || []).map((o) => ({
    id: o.id,
    customerId: o.customer_id,
    productId: o.product_id,
    qty: o.qty,
    status: o.status as "pending" | "delivered",  // Cast string to OrderStatus
    jobDate: o.job_date,
    assignedTo: o.assigned_to || "",
    siteAddress: o.site_address || "",
    photoUrl: o.photo_url || "",
  }));
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
    queryKey: ["products"],
    queryFn: fetchProducts,
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

  // Data helpers
  function customerName(id: string) {
    const c = customers.find((c) => c.id === id);
    return c ? c.name : id;
  }

  function customerPhone(id: string) {
    const c = customers.find((c) => c.id === id);
    return c ? c.phone : "";
  }

  function productName(id: string) {
    const product = products.find(p => p.id === id);
    return product ? product.name : id;
  }

  function productUnitAndPrice(id: string) {
    const product = products.find(p => p.id === id);
    if (product) {
      return { unit: product.unit, price: product.price };
    }
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
        {orders.map((o) => (
          <li
            key={o.id}
            className="mb-4 bg-white rounded-lg px-4 py-3 shadow border"
          >
            {/* Title and Product/Customer */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-bold text-blue-900 text-base">{customerName(o.customerId)}</div>
                <div className="text-sm text-gray-700">{productName(o.productId)}</div>
              </div>
              {/* Actions: Edit/Delete/Bill (move to own row for mobile) */}
              <div className="flex gap-2 mt-2 sm:mt-0">
                <button
                  onClick={() => openEditModal(o)}
                  className="text-blue-600 hover:text-blue-800 bg-transparent p-1.5 rounded transition-colors"
                  title="Edit order"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDeleteOrder(o.id)}
                  className="text-red-600 hover:text-red-800 bg-transparent p-1.5 rounded transition-colors"
                  title="Delete order"
                >
                  <Trash2 size={16} />
                </button>
                {o.status === "delivered" && (
                  <button
                    className="border border-green-200 text-green-700 hover:bg-green-50 px-3 py-1 rounded text-xs flex items-center gap-1 font-medium transition-all"
                    onClick={() => openBillModalFromOrder(o)}
                    title="Generate Bill"
                  >
                    <Receipt size={14} /> Generate Bill
                  </button>
                )}
              </div>
            </div>
            {/* Row: ID - Can place here for debugging */}
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
                <span className="text-xs text-gray-700">Assigned to: {o.assignedTo}</span>
              )}
              <span className="text-gray-400 text-xs">{o.jobDate}</span>
            </div>
          </li>
        ))}
      </ul>
      {orders.length === 0 && (
        <div className="text-gray-500 mt-10 text-center">No orders found.</div>
      )}
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
