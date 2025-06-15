import { DEMO_ORDERS, DEMO_CUSTOMERS, DEMO_PRODUCTS } from "@/constants/demoData";
import { Order } from "@/constants/types";
import { Plus, Edit, Receipt } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { AddOrderModal } from "./AddOrderModal";
import { EditOrderModal } from "./EditOrderModal";
import { BillCreateModal } from "./BillCreateModal";

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>(DEMO_ORDERS);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Bill generation state
  const [showBillModal, setShowBillModal] = useState(false);
  const [billInitialData, setBillInitialData] = useState<any>(null);

  function customerName(id: string) {
    const c = DEMO_CUSTOMERS.find((c) => c.id === id);
    return c ? c.name : id;
  }

  function customerPhone(id: string) {
    const c = DEMO_CUSTOMERS.find((c) => c.id === id);
    return c ? c.phone : "";
  }

  function productName(id: string) {
    const product = DEMO_PRODUCTS.find(p => p.id === id);
    if (product) {
      return product.name;
    }

    // Handle legacy custom product ID format from the enhanced selection
    if (id.includes('-')) {
      const parts = id.split('-');
      const category = parts[0];
      const type = parts[1];
      const specs = parts[2];

      if (category === 'glass') {
        if (type === 'mirror') {
          return `Mirror ${specs}`;
        } else if (type === 'plain') {
          return `Float Glass ${specs}`;
        }
      } else if (category === 'aluminum') {
        return `Aluminum Frame (${specs})`;
      }
    }

    // Fallback
    return id;
  }

  function productUnitAndPrice(id: string) {
    const product = DEMO_PRODUCTS.find(p => p.id === id);
    if (product) {
      return { unit: product.unit, price: product.price };
    }
    // Fallback for custom products (assume unit as "pcs" and price 0)
    return { unit: "pcs", price: 0 };
  }

  function handleAddOrder(orderData: Omit<Order, 'id'>) {
    const newOrder: Order = {
      ...orderData,
      id: "o" + (orders.length + 1)
    };

    setOrders(prev => [newOrder, ...prev]);
    toast({
      title: "Order Added",
      description: "New order has been added successfully.",
    });
  }

  function handleEditOrder(updatedOrder: Order) {
    setOrders(prev => prev.map(order =>
      order.id === updatedOrder.id ? updatedOrder : order
    ));
    toast({
      title: "Order Updated",
      description: "Order has been updated successfully.",
    });
  }

  function openEditModal(order: Order) {
    setEditingOrder(order);
    setShowEdit(true);
  }

  // === BILL GENERATION ===
  function openBillModalFromOrder(order: Order) {
    // Get customer and product info to fill the modal
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

  // Ensure BillCreateModal always gets {} (not null/undefined)
  const safeInitialData = billInitialData && typeof billInitialData === "object" ? billInitialData : {};

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
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-blue-900">{customerName(o.customerId)}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(o)}
                  className="text-blue-600 hover:text-blue-800 p-1"
                  title="Edit order"
                >
                  <Edit size={16} />
                </button>
                {o.status === "delivered" && (
                  <button
                    className="text-green-700 hover:bg-green-50 border border-green-200 px-2 py-1 rounded text-xs flex items-center gap-1"
                    onClick={() => openBillModalFromOrder(o)}
                    title="Generate Bill"
                  >
                    <Receipt size={14} /> Generate Bill
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-sm text-gray-700">{productName(o.productId)}</span>
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
              <span className="text-gray-400 text-xs">{o.jobDate}</span>
            </div>
            {o.assignedTo && (
              <div className="text-xs text-gray-600 mb-1">Assigned to: {o.assignedTo}</div>
            )}
            {o.siteAddress && (
              <div className="text-xs text-gray-500">{o.siteAddress}</div>
            )}
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
      />
      <EditOrderModal
        open={showEdit}
        onOpenChange={setShowEdit}
        onEdit={handleEditOrder}
        order={editingOrder}
      />
      {/* Only render BillCreateModal when showBillModal is true:
           Always pass safeInitialData; prevent null from ever being passed. */}
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
