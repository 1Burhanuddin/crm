
import { AppLayout } from "@/components/AppLayout";
import { useCollections } from "@/hooks/useCollections";
import { useSession } from "@/hooks/useSession";
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SendReminderModal } from "@/components/SendReminderModal";
import { MessageSquare } from "lucide-react";

interface CustomerWithPending {
  id: string;
  name: string;
  pending: number;
  phone?: string;
}

export default function Collections() {
  const { user } = useSession();
  const { data: collections = [], isLoading, error, addCollection, isAdding } = useCollections();
  const [customers, setCustomers] = useState<{ id: string; name: string; phone?: string }[]>([]);
  const [pendingCustomers, setPendingCustomers] = useState<CustomerWithPending[]>([]);
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customer_id: "", amount: "", remarks: "" });

  // Added: SendReminderModal modal state
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderCustomer, setReminderCustomer] = useState<CustomerWithPending | null>(null);

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

  // Calculate pending payments per customer (all orders minus collections)
  const calculatePending = useCallback(async () => {
    if (!user) return;

    // Fetch all orders for the user
    const { data: orders } = await supabase
      .from("orders")
      .select("id, customer_id, qty, product_id, advance_amount")
      .eq("user_id", user.id);

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

    // Map of orderId -> total
    const orderTotals: { [orderId: string]: { customer_id: string; amount: number } } = {};
    for (const o of orders) {
      const price = priceMap.get(o.product_id) || 0;
      const amt = price * (Number(o.qty) || 0) - (Number(o.advance_amount) || 0);
      if (!orderTotals[o.id]) {
        orderTotals[o.id] = {
          customer_id: o.customer_id,
          amount: 0,
        };
      }
      orderTotals[o.id].amount += amt;
    }

    // Aggregate per customer
    const pendingMap = new Map<string, number>();
    Object.values(orderTotals).forEach(({ customer_id, amount }) => {
      const prev = pendingMap.get(customer_id) || 0;
      pendingMap.set(customer_id, prev + amount);
    });

    // Subtract all collections for each customer
    (collections || []).forEach((c) => {
      if (pendingMap.has(c.customer_id)) {
        const prev = pendingMap.get(c.customer_id) || 0;
        pendingMap.set(
          c.customer_id,
          prev - (Number(c.amount) || 0)
        );
      }
    });

    // Only keep where pending > 0
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
                  <div className="flex flex-col items-end gap-2">
                    <button
                      className="bg-green-700 text-white px-3 py-1.5 rounded hover:bg-green-800 transition disabled:opacity-60"
                      onClick={() => handleOpenForm(c.id, c.pending)}
                      disabled={isAdding}
                    >
                      Collect
                    </button>
                    <button
                      className="bg-blue-700 text-white px-3 py-1 flex items-center gap-1 rounded hover:bg-blue-800 transition text-xs"
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
                <li key={c.id} className="bg-gray-50 shadow rounded-lg mb-3 px-4 py-3">
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
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
