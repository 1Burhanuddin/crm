import { useSession } from "@/hooks/useSession";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Order, Product, Customer, OrderProduct } from "@/constants/types";
import { Plus, Edit, Receipt, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { AddOrderModal } from "./AddOrderModal";
import { EditOrderModal } from "./EditOrderModal";
import { BillCreateModal } from "./BillCreateModal";
import React from "react";
import { OrderActionsMenu } from "./OrderActionsMenu";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
  console.log('fetchProducts called with user_id:', user_id);
  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (user_id) {
    query = query.eq("user_id", user_id);
  }
  const { data, error } = await query;
  console.log('fetchProducts result:', { data, error, count: data?.length });
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
      products: Array.isArray(row.products) ? row.products : [],
      status: row.status as "pending" | "delivered",
      jobDate: row.job_date,
      assignedTo: row.assigned_to || "",
      siteAddress: row.site_address || "",
      photoUrl: row.photo_url || "",
      advanceAmount:
        typeof row.advance_amount === "number" && !isNaN(row.advance_amount)
          ? row.advance_amount
          : 0,
      remarks: row.remarks || "",
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

interface ProductListProps {
  products: OrderProduct[];
  allProducts: Product[];
}

const ProductList = ({ products, allProducts }: ProductListProps) => {
  if (!products || products.length === 0) {
    return <div className="text-gray-500 italic">No products</div>;
  }

  return (
    <div className="flex flex-col gap-1">
      {products.map((product, idx) => {
        const productDetails = allProducts.find(p => p.id === product.productId);
        const itemTotal = (productDetails?.price || 0) * product.qty;
        return (
          <div key={idx} className="grid grid-cols-3 items-center text-sm py-0.5">
            <span className="font-medium text-gray-900 truncate">{productDetails?.name}</span>
            <span className="text-gray-500 text-center">x{product.qty} {productDetails?.unit}</span>
            <span className="text-gray-500 text-right">₹{itemTotal.toFixed(2)}</span>
          </div>
        );
      })}
    </div>
  );
};

const OrderCard = ({ order, products, onMarkDelivered }: { order: Order; products: Product[]; onMarkDelivered: (id: string) => void }) => {
  const total = order.products.reduce((sum, item) => {
    const prod = products.find(p => p.id === item.productId);
    return sum + (prod ? prod.price * item.qty : 0);
  }, 0);
  const pending = Math.max(0, total - (order.advanceAmount || 0));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Total:</span>
            <span className="text-sm font-semibold text-blue-700">₹{total.toFixed(2)}</span>
          </div>
          {order.advanceAmount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Advance:</span>
              <span className="text-sm font-semibold text-green-600">₹{order.advanceAmount.toFixed(2)}</span>
            </div>
          )}
          {pending > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Pending:</span>
              <span className="text-sm font-semibold text-amber-600">₹{pending.toFixed(2)}</span>
            </div>
          )}
        </div>
        <div className="border-t border-gray-100 pt-2">
          <ProductList 
            products={order.products}
            allProducts={products}
          />
        </div>
      </div>
      {/* ... rest of the card content ... */}
    </div>
  );
};

export function OrderList() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  console.log('OrderList render:', { user: user?.id, userEmail: user?.email });

  // Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Bill generation state
  const [showBillModal, setShowBillModal] = useState(false);
  const [billInitialData, setBillInitialData] = useState<any>(null);

  // Expanded order state
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

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

  console.log('Products query state:', { 
    products: products.length, 
    loadingProducts, 
    productError, 
    userExists: !!user?.id 
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
      const { error } = await supabase.from("orders").insert({
        user_id: user.id,
        customer_id: orderData.customerId,
        products: orderData.products as any, // Cast to match JSONB type
        status: orderData.status,
        job_date: orderData.jobDate,
        assigned_to: orderData.assignedTo,
        site_address: orderData.siteAddress,
        photo_url: orderData.photoUrl || "",
        advance_amount: orderData.advanceAmount || 0,
        remarks: orderData.remarks || "",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", user?.id] });
      toast({ title: "Order Added", description: "New order has been added successfully." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to add order", 
        variant: "destructive" 
      });
    }
  });

  // Refresh customers function
  const refreshCustomers = () => {
    queryClient.invalidateQueries({ queryKey: ["customers", user?.id] });
  };

  // Edit existing order
  const editOrderMutation = useMutation({
    mutationFn: async (updatedOrder: Order) => {
      if (!user) throw new Error('User not authenticated');
      const { error } = await supabase.from("orders")
        .update({
          customer_id: updatedOrder.customerId,
          products: updatedOrder.products as any, // Cast to match JSONB type
          status: updatedOrder.status,
          job_date: updatedOrder.jobDate,
          assigned_to: updatedOrder.assignedTo,
          site_address: updatedOrder.siteAddress,
          photo_url: updatedOrder.photoUrl || "",
          updated_at: new Date().toISOString(),
          advance_amount: updatedOrder.advanceAmount || 0,
          remarks: updatedOrder.remarks || "",
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
    if (!order.products || order.products.length === 0) {
      toast({ title: "No Products", description: "This order has no products to generate a bill.", variant: "destructive" });
      return;
    }
    
    setBillInitialData({
      customerName: customerName(order.customerId),
      customerPhone: customerPhone(order.customerId),
      items: order.products.map((item) => {
        const prodInfo = productUnitAndPrice(item.productId);
        return {
          name: productName(item.productId),
          qty: item.qty,
          price: prodInfo.price,
        };
      })
    });
    setShowBillModal(true);
  }

  // Always pass {} not null/undefined
  const safeInitialData = billInitialData && typeof billInitialData === "object" ? billInitialData : {};

  // Helper for calculating order total & pending/udhaar
  function orderTotals(order: Order) {
    let total = 0;
    if (Array.isArray(order.products)) {
      for (const item of order.products) {
        const product = products.find(p => p.id === item.productId);
        total += product ? product.price * item.qty : 0;
      }
    }
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

  // Filtered orders for each tab
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const deliveredUdhaarOrders = orders.filter((o) => {
    if (o.status !== "delivered") return false;
    const { udhaar } = orderTotals(o);
    return udhaar > 0;
  });
  const historyOrders = orders.filter((o) => {
    if (o.status !== "delivered") return false;
    const { udhaar } = orderTotals(o);
    return udhaar === 0;
  });

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
    <div className="p-0 pb-24">
      <div className="flex items-center justify-between mb-5 px-4 pt-4">
        <h2 className="text-xl font-semibold text-blue-900">Orders</h2>
        <Button
          onClick={() => setShowAdd(true)}
          className="bg-primary text-white px-6 py-3 rounded-lg flex items-center gap-2 text-base font-semibold shadow-lg hover:bg-primary/90 min-w-[135px] justify-center transition"
          size="lg"
        >
          <Plus size={22} strokeWidth={2.2} />
          Add
        </Button>
      </div>
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="inline-flex w-full h-10 items-center justify-center rounded-md bg-muted text-muted-foreground mb-4 overflow-hidden">
          <TabsTrigger value="pending" className="flex-1 min-w-0">Pending</TabsTrigger>
          <TabsTrigger value="udhaar" className="flex-1 min-w-0">Credit/Udhaar</TabsTrigger>
          <TabsTrigger value="history" className="flex-1 min-w-0">History</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
      <ul>
            {pendingOrders.map((o) => renderOrderCard(o))}
          </ul>
          {pendingOrders.length === 0 && (
            <div className="text-gray-500 mt-10 text-center">No pending orders found.</div>
          )}
        </TabsContent>
        <TabsContent value="udhaar">
          <ul>
            {deliveredUdhaarOrders.map((o) => renderOrderCard(o))}
          </ul>
          {deliveredUdhaarOrders.length === 0 && (
            <div className="text-gray-500 mt-10 text-center">No delivered orders with udhaar found.</div>
          )}
        </TabsContent>
        <TabsContent value="history">
          <ul>
            {historyOrders.map((o) => renderOrderCard(o))}
          </ul>
          {historyOrders.length === 0 && (
            <div className="text-gray-500 mt-10 text-center">No completed orders found.</div>
          )}
        </TabsContent>
      </Tabs>
      {/* Modals */}
      <AddOrderModal
        open={showAdd}
        onOpenChange={setShowAdd}
        onAdd={handleAddOrder}
        customers={customers}
        products={products}
        refreshCustomers={refreshCustomers}
      />
      <EditOrderModal
        open={showEdit}
        onOpenChange={setShowEdit}
        onEdit={handleEditOrder}
        order={editingOrder}
        customers={customers}
        products={products}
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

  // Helper to render a single order card (moved from map inline)
  function renderOrderCard(o: Order) {
    const { total, pending, udhaar, collected } = orderTotals(o);
    const missingCustomer = !customers.find((c) => c.id === o.customerId);
    const isExpanded = expandedOrderId === o.id;
    return (
      <li
        key={o.id}
        className={`mb-6 rounded-xl px-0 py-0 shadow-lg border hover:shadow-xl transition-all duration-200 relative cursor-pointer`}
        onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
      >
        <div className={`rounded-xl bg-white transition-all duration-200 ${isExpanded ? "shadow-2xl border-2 border-blue-200" : "border border-gray-100"} relative`}>
          {/* Collapsed view */}
          {!isExpanded && (
            <div className="px-4 py-3 flex flex-col gap-1 relative">
              <div className="font-bold text-blue-900 text-base truncate">
                {customerName(o.customerId)}
                {missingCustomer && (
                  <span className="ml-2 text-xs text-yellow-700">(not found)</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 truncate">
                  <div className="flex flex-col gap-1">
                    {o.products && o.products.length > 0 ? (
                      <>
                        <div className="flex flex-col gap-1">
                          {o.products.map((product, idx) => {
                            const productDetails = products.find(p => p.id === product.productId);
                            const itemTotal = (productDetails?.price || 0) * product.qty;
                            return (
                              <div key={idx} className="grid grid-cols-3 items-center text-sm py-0.5">
                                <span className="font-medium text-gray-900 truncate">{productDetails?.name}</span>
                                <span className="text-gray-500 text-center">x{product.qty} {productDetails?.unit}</span>
                                <span className="text-gray-500 text-right">₹{itemTotal.toFixed(2)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-500 italic">No products</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-50 text-blue-800 font-bold text-sm rounded-lg px-2 py-0.5">
                    ₹{total.toFixed(2)}
                  </span>
                  {pending === 0 && udhaar === 0 && (
                    <span className="inline-flex items-center bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs font-semibold">
                      Paid
                    </span>
                  )}
                  {o.status === "pending" && pending > 0 && (
                    <span className="inline-flex items-center bg-yellow-100 text-yellow-800 rounded-full px-2 py-0.5 text-xs font-semibold">
                      Pending: ₹{pending.toFixed(2)}
                    </span>
                  )}
                  {o.status === "delivered" && udhaar > 0 && (
                    <span className="inline-flex items-center bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-xs font-semibold">
                      Udhaar: ₹{udhaar.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Expanded view */}
          {isExpanded && (
            <div className="px-6 py-6 relative">
              <div className="absolute top-3 right-3 z-10">
                <OrderActionsMenu
                  onEdit={() => openEditModal(o)}
                  onDelete={() => handleDeleteOrder(o.id)}
                  canMarkDelivered={o.status === "pending"}
                  onMarkDelivered={o.status === "pending" ? () => handleMarkDelivered(o) : undefined}
                />
              </div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-bold text-blue-900 text-xl">
                    {customerName(o.customerId)}
                    {missingCustomer && (
                      <span className="ml-2 text-xs text-yellow-700">(not found)</span>
                    )}
                  </div>
                  <div className="text-base text-gray-700 mt-1">
                    <div className="flex flex-col gap-1">
                      {o.products && o.products.length > 0 ? (
                        <>
                          <div className="flex flex-col gap-1">
                            {o.products.map((product, idx) => {
                              const productDetails = products.find(p => p.id === product.productId);
                              const itemTotal = (productDetails?.price || 0) * product.qty;
                              return (
                                <div key={idx} className="grid grid-cols-3 items-center text-sm py-0.5">
                                  <span className="font-medium text-gray-900 truncate">{productDetails?.name}</span>
                                  <span className="text-gray-500 text-center">x{product.qty} {productDetails?.unit}</span>
                                  <span className="text-gray-500 text-right">₹{itemTotal.toFixed(2)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-500 italic">No products</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mb-4 mt-2">
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${o.status === "pending" ? "bg-yellow-200 text-yellow-900" : "bg-green-200 text-green-900"}`}>
                  {o.status === "pending" ? "Pending" : "Delivered"}
                </span>
                {pending === 0 && udhaar === 0 && (
                  <span className="inline-flex items-center bg-green-100 text-green-700 rounded-full px-3 py-1 text-xs font-semibold shadow-sm">
                    Paid
                  </span>
                )}
                {o.status === "pending" && pending > 0 && (
                  <span className="inline-flex items-center bg-yellow-100 text-yellow-800 rounded-full px-3 py-1 text-xs font-semibold shadow-sm">
                    Pending: ₹{pending.toFixed(2)}
                  </span>
                )}
                {o.status === "delivered" && udhaar > 0 && (
                  <span className="inline-flex items-center bg-red-100 text-red-700 rounded-full px-3 py-1 text-xs font-semibold shadow-sm">
                    Udhaar: ₹{udhaar.toFixed(2)}
                  </span>
                )}
              </div>
              {/* Pending: Only show total and advance, and a message */}
              {o.status === "pending" ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex flex-col gap-2 bg-blue-50 rounded-lg p-4">
                      <span className="text-xs text-gray-500">Total</span>
                      <span className="text-blue-900 font-bold text-lg">₹{total.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col gap-2 bg-green-50 rounded-lg p-4">
                      <span className="text-xs text-gray-500">Advance</span>
                      <span className="text-green-700 font-bold text-lg">₹{o.advanceAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="w-full mb-2">
                    <button
                      className="w-full flex items-center justify-center gap-2 px-0 py-3 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 font-semibold text-base transition-all focus:outline-none focus:ring-2 focus:ring-green-400"
                      onClick={e => { e.stopPropagation(); handleMarkDelivered(o); }}
                      title="Mark this order as delivered"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"><path stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      Mark as Delivered
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex flex-col gap-2 bg-blue-50 rounded-lg p-4">
                      <span className="text-xs text-gray-500">Total</span>
                      <span className="text-blue-900 font-bold text-lg">₹{total.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col gap-2 bg-green-50 rounded-lg p-4">
                      <span className="text-xs text-gray-500">Advance</span>
                      <span className="text-green-700 font-bold text-lg">₹{o.advanceAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col gap-2 bg-gray-50 rounded-lg p-4">
                      <span className="text-xs text-gray-500">Collected</span>
                      <span className="text-emerald-700 font-bold text-lg">₹{collected.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col gap-2 bg-yellow-50 rounded-lg p-4">
                      <span className="text-xs text-gray-500">Pending</span>
                      <span className="text-yellow-700 font-bold text-lg">₹{pending.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col gap-2 bg-red-50 rounded-lg p-4 col-span-2">
                      <span className="text-xs text-gray-500">Udhaar</span>
                      <span className="text-red-700 font-bold text-lg">₹{udhaar.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="text-sm bg-gray-100 px-3 py-1.5 rounded-lg font-medium">
                      Qty: {o.products.reduce((sum, item) => sum + item.qty, 0)}
                    </span>
                    {o.assignedTo && (
                      <span className="text-sm text-gray-700 font-medium">
                        Assigned to: {o.assignedTo}
                      </span>
                    )}
                    <span className="text-gray-500 text-sm">{o.jobDate}</span>
                  </div>
                  {o.status === "delivered" && (
                    <button
                      className="border border-green-200 text-green-700 hover:bg-green-50 px-4 py-2 rounded-lg text-sm flex items-center gap-2 font-medium transition-all shadow-sm hover:shadow"
                      onClick={e => { e.stopPropagation(); openBillModalFromOrder(o); }}
                      title="Generate Bill"
                    >
                      <Receipt size={16} /> Generate Bill
                    </button>
                  )}
                </>
              )}
              {missingCustomer && (
                <div className="mt-3 text-sm text-yellow-800 italic bg-yellow-50 px-4 py-2 rounded-lg">
                  Warning: This order references a deleted/missing customer. You may need to edit or delete this order.
                </div>
              )}
            </div>
          )}
        </div>
      </li>
    );
  }
}
