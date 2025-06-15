import { AppLayout } from "@/components/AppLayout";
import { useCollections } from "@/hooks/useCollections";
import { useSession } from "@/hooks/useSession";
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SendReminderModal } from "@/components/SendReminderModal";
import { MessageSquare, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { CollectionEditModal } from "@/components/CollectionEditModal";

interface CustomerWithPending {
  id: string;
  name: string;
  pending: number;
  phone?: string;
}

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
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customer_id: "", amount: "", remarks: "" });

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

    // Aggregate udhaar per customer, only for delivered orders
    const pendingMap = new Map<string, number>();
    Object.values(deliveredOrderUdhaar).forEach(({ customer_id, amount }) => {
      if (amount > 0) {
        const prev = pendingMap.get(customer_id) || 0;
        pendingMap.set(customer_id, prev + amount);
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
  }, [user, collections, customers]);

  useEffect(() => {
    if (customers.length > 0) calculatePending();
    // eslint-disable-next-line
  }, [collections, customers]);

  // Helper for opening Add Collection (can preselect customer)
  const handleOpenForm = (customerId?: string, amount?: number) => {
    setForm({
      customer_id: customerId || "",
      amount: amount ? String(amount) : "",
      remarks: "",
    });
    setShowForm(true);
  };

  // WhatsApp Reminder
  const handleOpenReminderModal = (customer: CustomerWithPending) => {
    setReminderCustomer(customer);
    setReminderModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
    await addCollection({
      customer_id: form.customer_id,
      amount: Number(form.amount),
      remarks: form.remarks,
    });
    toast({ title: "Collection added!" });
    setShowForm(false);
    setForm({ customer_id: "", amount: "", remarks: "" });
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

  return (
    <AppLayout title="Collections">
      <div className="p-4 max-w-lg mx-auto">
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
                  className="flex justify-between items-center bg-white shadow rounded-lg mb-2 px-3 py-2 border"
                >
                  <div>
                    <span className="font-semibold text-blue-900">{c.name}</span>
                    <br />
                    <span className="text-red-700 text-sm">Pending: ₹{c.pending}</span>
                    {c.phone ? (
                      <div className="mt-1 text-xs text-gray-500">Phone: {c.phone}</div>
                    ) : null}
                  </div>
                  <div className="flex flex-row items-center gap-2 mt-2 sm:mt-0">
                    <button
                      className="bg-green-700 text-white px-3 py-1.5 rounded hover:bg-green-800 transition disabled:opacity-60"
                      onClick={() => handleOpenForm(c.id, c.pending)}
                      disabled={isAdding}
                    >
                      Collect
                    </button>
                    <button
                      className="bg-emerald-600 text-white px-3 py-1 flex items-center gap-1 rounded hover:bg-emerald-700 transition text-xs"
                      onClick={() => handleOpenReminderModal(c)}
                    >
                      <MessageSquare size={16} /> Send Reminder
                    </button>
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
        {/* Manual Add Collection as fallback */}
        <div className="mt-6 mb-2">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded mb-1 hover:bg-green-700 transition"
            onClick={() => handleOpenForm()}
          >
            + Add Collection (Manual)
          </button>
        </div>
        {/* Add Collection Modal */}
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
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option value={c.id} key={c.id}>{c.name}</option>
                  ))}
                </select>
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
                />
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
                        Collected: ₹{c.amount} <span className="ml-2 text-xs text-gray-400">{new Date(c.collected_at).toLocaleString()}</span>
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
