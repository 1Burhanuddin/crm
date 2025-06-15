import { AppLayout } from "@/components/AppLayout";
import { useCollections } from "@/hooks/useCollections";
import { useSession } from "@/hooks/useSession";
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SendReminderModal } from "@/components/SendReminderModal";
import { MessageSquare, MoreHorizontal, Edit, Trash2, CalendarIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { CollectionEditModal } from "@/components/CollectionEditModal";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { format, parseISO, isToday, isAfter, isBefore, addDays } from "date-fns";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface CustomerWithPending {
  id: string;
  name: string;
  pending: number;
  phone?: string;
}

// NEW: Type for delivered orders for a customer
type DeliveredOrder = {
  id: string;
  amount: number;
};

export default function Collections() {
  const { user } = useSession();
  const {
    data: collections = [],
    isLoading,
    error,
    addCollection,
    isAdding,
    editCollection,
    isEditing,
    deleteCollection,
    isDeleting
  } = useCollections();
  const [customers, setCustomers] = useState<{ id: string; name: string; phone?: string }[]>([]);
  const [pendingCustomers, setPendingCustomers] = useState<CustomerWithPending[]>([]);
  // Map: customerId => list of delivered orders (with outstanding udhaar)
  const [customerDeliveredOrders, setCustomerDeliveredOrders] = useState<
    Record<string, DeliveredOrder[]>
  >({});

  // --- Add per-customer collection date state ---
  const [customerDates, setCustomerDates] = useState<Record<string, Date>>({});
  // For menu popovers controlling which one is open
  const [dateMenuOpen, setDateMenuOpen] = useState<{ [id: string]: boolean }>({});

  // Form state, now includes order_id
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customer_id: "",
    amount: "",
    remarks: "",
    order_id: "",
    collection_date: new Date(), // not actually needed in the modal if date managed outside!
  });

  // Added: SendReminderModal modal state
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderCustomer, setReminderCustomer] = useState<CustomerWithPending | null>(null);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<null | {
    id: string;
    amount: number;
    remarks: string;
  }>(null);

  // Delete modal state
  const [deleteDialog, setDeleteDialog] = useState<null | {
    id: string;
    name: string;
  }>(null);

  // Load all customers on mount (for dropdowns, pending calc)
  useEffect(() => {
    if (!user) return;
    async function loadCustomers() {
      const { data } = await supabase
        .from("customers")
        .select("id,name,phone")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setCustomers(data ?? []);
    }
    loadCustomers();
  }, [user]);

  // Calculate pending payments per customer (only for UDHAAR on delivered orders)
  // Also map: customerId -> delivered orders (with outstanding udhaar), for use in Collect button
  const calculatePending = useCallback(async () => {
    if (!user) return;

    // Fetch all delivered orders for the user
    const { data: orders } = await supabase
      .from("orders")
      .select("id, customer_id, qty, product_id, advance_amount, status")
      .eq("user_id", user.id)
      .eq("status", "delivered");

    if (!orders) {
      setPendingCustomers([]);
      setCustomerDeliveredOrders({});
      return;
    }

    // Fetch all products to get unit prices
    const { data: products } = await supabase
      .from("products")
      .select("id, price")
      .eq("user_id", user.id);
    const priceMap = new Map<string, number>(
      (products || []).map((p: any) => [p.id, Number(p.price) || 0])
    );

    // Map of orderId -> { customer_id, udhaar }
    const deliveredOrderUdhaar: { [orderId: string]: { customer_id: string; amount: number } } = {};
    for (const o of orders) {
      const price = priceMap.get(o.product_id) || 0;
      const amt = price * (Number(o.qty) || 0) - (Number(o.advance_amount) || 0);
      deliveredOrderUdhaar[o.id] = {
        customer_id: o.customer_id,
        amount: amt > 0 ? amt : 0 // only positive udhaar
      };
    }

    // Sum collections for delivered orders only
    const { data: collectionsData } = await supabase
      .from("collections")
      .select("id, order_id, customer_id, amount")
      .eq("user_id", user.id);

    // Subtract collections from each delivered order
    (collectionsData || []).forEach((c: any) => {
      if (c.order_id && deliveredOrderUdhaar[c.order_id]) {
        deliveredOrderUdhaar[c.order_id].amount -= Number(c.amount) || 0;
        if (deliveredOrderUdhaar[c.order_id].amount < 0) deliveredOrderUdhaar[c.order_id].amount = 0;
      }
    });

    // Aggregate udhaar per customer, and collect their delivered orders that are pending
    const pendingMap = new Map<string, number>();
    const deliveredOrdersMap: Record<string, DeliveredOrder[]> = {};

    Object.entries(deliveredOrderUdhaar).forEach(([orderId, { customer_id, amount }]) => {
      if (amount > 0) {
        const prev = pendingMap.get(customer_id) || 0;
        pendingMap.set(customer_id, prev + amount);

        if (!deliveredOrdersMap[customer_id]) deliveredOrdersMap[customer_id] = [];
        deliveredOrdersMap[customer_id].push({ id: orderId, amount: Math.round(amount) });
      }
    });

    // Only keep where udhaar > 0 and customer exists
    const result: CustomerWithPending[] = [];
    for (const [id, pending] of pendingMap.entries()) {
      if (pending > 0 && customers.some((c) => c.id === id)) {
        const cust = customers.find((c) => c.id === id);
        result.push({
          id,
          name: cust?.name || "(Unknown)",
          pending: Math.round(pending),
          phone: cust?.phone || "",
        });
      }
    }
    setPendingCustomers(result.sort((a, b) => b.pending - a.pending));
    setCustomerDeliveredOrders(deliveredOrdersMap);
  }, [user, collections, customers]);

  // Calculate per-customer collection date: set once when pendingCustomers is calculated.
  // Default: today + 1 day
  useEffect(() => {
    if (pendingCustomers.length > 0) {
      setCustomerDates(prev => {
        const next: Record<string, Date> = { ...prev };
        pendingCustomers.forEach((c) => {
          // Only set if not already selected, so don't stomp user-chosen date
          if (!next[c.id]) {
            next[c.id] = addDays(new Date(), 1);
          }
        });
        // Remove entries for customers no longer visible
        Object.keys(next).forEach((id) => {
          if (!pendingCustomers.some((c) => c.id === id)) {
            delete next[id];
          }
        });
        return next;
      });
    }
  }, [pendingCustomers]);

  useEffect(() => {
    if (customers.length > 0) calculatePending();
    // eslint-disable-next-line
  }, [collections, customers]);

  // Helper for opening Add Collection (can preselect customer)
  // CHANGED: now optionally takes the order_id if there is exactly one matching delivered order
  const handleOpenForm = (customerId?: string, amount?: number) => {
    let order_id = "";
    if (customerId && customerDeliveredOrders[customerId] && customerDeliveredOrders[customerId].length === 1) {
      order_id = customerDeliveredOrders[customerId][0].id;
    }
    setForm({
      customer_id: customerId || "",
      amount: amount ? String(amount) : "",
      remarks: "",
      order_id,
      // Use the selected date for the customer, or today+1 by default
      collection_date: customerId ? (customerDates[customerId] ?? addDays(new Date(), 1)) : addDays(new Date(), 1),
    });
    setShowForm(true);
  };

  // WhatsApp Reminder
  const handleOpenReminderModal = (customer: CustomerWithPending) => {
    setReminderCustomer(customer);
    setReminderModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // If customer_id changes and there is exactly one delivered order for that customer, auto-fill order_id
    if (name === "customer_id") {
      const orders = customerDeliveredOrders[value];
      setForm(f => ({
        ...f,
        customer_id: value,
        order_id: orders && orders.length === 1 ? orders[0].id : "",
      }));
    }
  };

  // NEW: For select order id if there are multiple delivered orders pending (edge case UI)
  const handleOrderIdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm({ ...form, order_id: e.target.value });
  };

  // --- Handler for changing a customer's target collection date ---
  const handleDateChangeForCustomer = (customerId: string, date: Date) => {
    setCustomerDates(prev => ({
      ...prev,
      [customerId]: date,
    }));
    setDateMenuOpen(prev => ({ ...prev, [customerId]: false }));
  };

  // --- Handler for opening/closing the date menu ---
  const openDateMenu = (customerId: string) => {
    setDateMenuOpen(prev => ({ ...prev, [customerId]: true }));
  };
  const closeDateMenu = (customerId: string) => {
    setDateMenuOpen(prev => ({ ...prev, [customerId]: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_id || !form.amount) {
      toast({
        title: "Missing info",
        description: "Please select customer and amount.",
        variant: "destructive"
      });
      return;
    }
    // If opened from the pending list, "form.collection_date" is already the correct one.
    // Still, format and submit
    const collectionDate = form.collection_date
      ? format(form.collection_date as Date, "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd");
    await addCollection({
      customer_id: form.customer_id,
      amount: Number(form.amount),
      remarks: form.remarks,
      order_id: form.order_id || null,
      collection_date: collectionDate,
    });
    toast({ title: "Collection added!" });
    setShowForm(false);
    setForm({
      customer_id: "",
      amount: "",
      remarks: "",
      order_id: "",
      collection_date: addDays(new Date(), 1),
    });
  };

  // Edit handler
  const handleEditCollection = (collection: { id: string; amount: number; remarks: string; }) => {
    setEditingCollection({
      id: collection.id,
      amount: collection.amount,
      remarks: collection.remarks || "",
    });
    setEditModalOpen(true);
  };

  // Delete handler
  const handleDeleteCollection = (collection: { id: string; name: string }) => {
    setDeleteDialog({
      id: collection.id,
      name: collection.name,
    });
  };

  const performDelete = async () => {
    if (!deleteDialog) return;
    await deleteCollection(deleteDialog.id);
    toast({ title: "Collection deleted." });
    setDeleteDialog(null);
  };

  // Save edit changes
  const saveEditCollection = async (val: { amount: number; remarks: string }) => {
    if (!editingCollection) return;
    await editCollection({
      id: editingCollection.id,
      amount: val.amount,
      remarks: val.remarks,
    });
    toast({ title: "Collection updated." });
    setEditModalOpen(false);
    setEditingCollection(null);
  };

  // For tracking today's due collections
  const dueToday = collections.filter(
    (c) =>
      c.collection_date &&
      isToday(parseISO(c.collection_date))
  );

  // Helper: format date nicely for display (eg "Jun 15, 2025")
  const displayDate = (date: Date) => {
    return format(date, "PPP");
  };

  return (
    <AppLayout title="Collections">
      <div className="p-4 max-w-lg mx-auto">
        <div className="mb-2">
          <BackButton />
        </div>
        <h2 className="text-xl font-semibold text-blue-900 mb-4">Collections - Pending Payments</h2>
        {/* Pending section */}
        <div>
          <div className="mb-2 text-blue-800 font-bold">Pending Collections</div>
          {pendingCustomers.length === 0 ? (
            <div className="text-gray-500 mb-4">No pending collections! All customers are up to date 🎉</div>
          ) : (
            <ul>
              {pendingCustomers.map((c) => (
                <li
                  key={c.id}
                  className="bg-white shadow rounded-lg mb-2 px-3 py-2 border"
                  style={{ overflow: 'hidden' }}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-stretch w-full gap-2 sm:gap-0">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-blue-900 break-words">{c.name}</div>
                      <div className="text-red-700 text-sm font-medium break-words">
                        Pending: ₹{c.pending}
                      </div>
                      {c.phone ? (
                        <div className="mt-1 text-xs text-gray-500 break-all">Phone: {c.phone}</div>
                      ) : null}
                      {/* Collection date row */}
                      <div className="mt-1 flex items-center gap-2 text-xs text-blue-900 flex-wrap">
                        <CalendarIcon size={16} className="inline mr-1 min-w-[16px]" />
                        Collect on:&nbsp;
                        <span className="font-semibold">
                          {customerDates[c.id] ? displayDate(customerDates[c.id]) : displayDate(addDays(new Date(), 1))}
                        </span>
                        <Popover open={!!dateMenuOpen[c.id]} onOpenChange={(open) => setDateMenuOpen((prev) => ({ ...prev, [c.id]: open }))}>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="ml-1 rounded-full p-1 border hover:bg-gray-200"
                              aria-label="Change date"
                              onClick={e => { e.stopPropagation(); openDateMenu(c.id); }}
                            >
                              <MoreHorizontal size={16} />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 z-50" align="start" side="bottom">
                            <Calendar
                              mode="single"
                              selected={customerDates[c.id] || addDays(new Date(), 1)}
                              onSelect={(date) => {
                                if (date) handleDateChangeForCustomer(c.id, date);
                              }}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    {/* Actions - On mobile, stack vertically; desktop, show horizontally */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-end min-w-[120px] mt-2 sm:mt-0 w-full sm:w-auto">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-blue-700 hover:bg-blue-800 focus:bg-blue-800 text-white font-medium px-4 py-2 rounded transition w-full sm:w-auto"
                        onClick={() => {
                          setForm({
                            customer_id: c.id,
                            amount: c.pending ? String(c.pending) : "",
                            remarks: "",
                            order_id:
                              customerDeliveredOrders[c.id] && customerDeliveredOrders[c.id].length === 1
                                ? customerDeliveredOrders[c.id][0].id
                                : "",
                            collection_date: customerDates[c.id] ?? addDays(new Date(), 1),
                          });
                          setShowForm(true);
                        }}
                        disabled={isAdding}
                      >
                        Collect
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600 focus:bg-amber-600 text-white font-medium flex items-center gap-1 px-3 py-2 rounded transition text-xs w-full sm:w-auto"
                        onClick={() => handleOpenReminderModal(c)}
                      >
                        <MessageSquare size={16} /> Send Reminder
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Reminder Modal */}
        <SendReminderModal
          open={reminderModalOpen}
          onOpenChange={(open) => setReminderModalOpen(open)}
          customer={reminderCustomer}
        />
        {/* Add Collection Modal (disabled date when coming from pending list, so not shown) */}
        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center z-30 bg-black/30">
            <div className="bg-white rounded-lg shadow p-6 min-w-[300px] max-w-[90vw]">
              <h3 className="font-semibold text-lg mb-3">
                Add Collection
              </h3>
              <form onSubmit={handleSubmit}>
                <label className="block mb-2 text-sm font-medium">Customer</label>
                <select
                  name="customer_id"
                  value={form.customer_id}
                  onChange={handleFormChange}
                  className="w-full border px-2 py-1 rounded mb-3"
                  required
                  disabled // Disable changing customer when coming from pending
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option value={c.id} key={c.id}>{c.name}</option>
                  ))}
                </select>
                {/* If there are multiple delivered orders for this customer, show order selection */}
                {form.customer_id &&
                  customerDeliveredOrders[form.customer_id] &&
                  customerDeliveredOrders[form.customer_id].length > 1 && (
                    <div className="mb-3">
                      <label className="block mb-2 text-sm font-medium">Order (optional)</label>
                      <select
                        name="order_id"
                        value={form.order_id}
                        onChange={handleOrderIdChange}
                        className="w-full border px-2 py-1 rounded"
                      >
                        <option value="">Do not link to order</option>
                        {customerDeliveredOrders[form.customer_id]?.map((order) => (
                          <option value={order.id} key={order.id}>
                            Order #{order.id.slice(-5)} : Pending ₹{order.amount}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                <label className="block mb-2 text-sm font-medium">Amount</label>
                <input
                  name="amount"
                  type="number"
                  step="1"
                  min="1"
                  value={form.amount}
                  onChange={handleFormChange}
                  className="w-full border px-2 py-1 rounded mb-3"
                  required
                  disabled // Disable changing amount to keep pending accurate
                />

                {/* Show the chosen collection date for info only (not editable here) */}
                <div className="mb-3">
                  <label className="block mb-2 text-sm font-medium">Collection Date</label>
                  <div className="w-full border px-2 py-2 rounded bg-gray-100 text-blue-900">
                    {displayDate(form.collection_date as Date)}
                  </div>
                </div>
                <label className="block mb-2 text-sm font-medium">Remarks</label>
                <input
                  name="remarks"
                  value={form.remarks}
                  onChange={handleFormChange}
                  className="w-full border px-2 py-1 rounded mb-3"
                  placeholder="optional"
                />
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="bg-gray-300 hover:bg-gray-400 py-2 px-4 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="bg-green-700 text-white py-2 px-4 rounded hover:bg-green-800"
                  >
                    {isAdding ? "Saving..." : "Add"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Notification/Reminder: show yellow alert if a collection is due today */}
        {dueToday.length > 0 && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 p-4 mb-6 rounded shadow flex items-center gap-2">
            <CalendarIcon className="text-yellow-600 mr-2" size={20} />
            <span>
              Reminder: You have <b>{dueToday.length}</b> collection{dueToday.length > 1 ? "s" : ""} due today!
            </span>
          </div>
        )}

        {/* Recent Collections Section */}
        <div className="mt-10">
          <h3 className="font-semibold text-lg mb-3 text-blue-900">Recent Collections</h3>
          {isLoading ? (
            <div className="text-gray-600">Loading...</div>
          ) : error ? (
            <div className="text-red-600">Error loading collections.</div>
          ) : (
            <ul>
              {collections.length === 0 && (
                <div className="text-gray-500 text-center mt-4">No collections yet.</div>
              )}
              {collections.map((c) => (
                <li key={c.id} className="bg-gray-50 shadow rounded-lg mb-3 px-4 py-3 relative group">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-blue-800">
                        {customers.find((cu) => cu.id === c.customer_id)?.name || "(Unknown)"}
                      </div>
                      <div className="text-sm text-gray-700">
                        Collected: ₹{c.amount}
                        <span className="ml-2 text-xs text-gray-400">{new Date(c.collected_at).toLocaleString()}</span>
                        {c.collection_date && (
                          <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs">
                            Date: {format(parseISO(c.collection_date), "PPP")}
                          </span>
                        )}
                      </div>
                      {c.remarks && (
                        <div className="text-xs text-gray-500 mt-1">Remarks: {c.remarks}</div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded hover:bg-gray-200">
                          <MoreHorizontal size={18} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            handleEditCollection({ id: c.id, amount: c.amount, remarks: c.remarks || "" })
                          }
                        >
                          <Edit size={16} className="mr-1" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleDeleteCollection({
                              id: c.id,
                              name: customers.find((cu) => cu.id === c.customer_id)?.name || "(Unknown)",
                            })
                          }
                        >
                          <Trash2 size={16} className="mr-1" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Edit Collection Modal */}
      <CollectionEditModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingCollection(null);
        }}
        initial={{
          amount: editingCollection?.amount || 1,
          remarks: editingCollection?.remarks || "",
        }}
        onSave={saveEditCollection}
        loading={isEditing}
      />

      {/* Delete confirmation dialog */}
      <div
        className={`fixed inset-0 z-40 flex items-center justify-center bg-black/30 ${deleteDialog ? "" : "hidden"}`}
        aria-modal="true"
        role="dialog"
      >
        <div className="bg-white rounded-lg shadow p-6 min-w-[320px] max-w-[90vw]">
          <h3 className="font-semibold text-lg mb-3">Delete Collection</h3>
          <p>
            Are you sure you want to delete the collection for{" "}
            <span className="font-bold">{deleteDialog?.name}</span>?
          </p>
          <div className="flex gap-3 justify-end mt-5">
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded"
              onClick={() => setDeleteDialog(null)}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              onClick={performDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>

      {/* Reminder Modal */}
      <SendReminderModal
        open={reminderModalOpen}
        onOpenChange={(open) => setReminderModalOpen(open)}
        customer={reminderCustomer}
      />
    </AppLayout>
  );
}
