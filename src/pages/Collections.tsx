
import { AppLayout } from "@/components/AppLayout";
import { useCollections } from "@/hooks/useCollections";
import { useSession } from "@/hooks/useSession";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

function CustomerName({ id }: { id: string }) {
  const [name, setName] = useState<string>("...");
  // Fetch customer name on mount
  useState(() => {
    (async () => {
      const { data } = await supabase
        .from("customers")
        .select("name")
        .eq("id", id)
        .maybeSingle();
      setName(data?.name || "(Unknown)");
    })();
  });
  return <span>{name}</span>;
}

export default function Collections() {
  const { user } = useSession();
  const { data: collections, isLoading, error, addCollection, isAdding } = useCollections();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customer_id: "", amount: "", remarks: "" });
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);

  // Load customers for dropdown when opening form
  const handleOpenForm = async () => {
    setShowForm(true);
    if (customers.length === 0 && user) {
      const { data } = await supabase
        .from("customers")
        .select("id, name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setCustomers(data ?? []);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_id || !form.amount) {
      toast({ title: "Missing info", description: "Please select customer and amount.", variant: "destructive" });
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
        <h2 className="text-xl font-semibold text-blue-900 mb-4">Payment Collections</h2>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded mb-4 hover:bg-green-700 transition"
          onClick={handleOpenForm}
        >
          + Add Collection
        </button>
        {/* Add Collection Modal (simple modal replacement approach) */}
        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center z-30 bg-black/30">
            <div className="bg-white rounded-lg shadow p-6 min-w-[300px] max-w-[90vw]">
              <h3 className="font-semibold text-lg mb-3">Add Collection</h3>
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

        {/* Show all collections */}
        {isLoading ? (
          <div className="text-gray-600 mt-10">Loading...</div>
        ) : error ? (
          <div className="text-red-600 mt-10">Error loading collections.</div>
        ) : (
          <ul>
            {collections!.length === 0 && (
              <div className="text-gray-500 text-center mt-8">No collections yet.</div>
            )}
            {collections!.map((c) => (
              <li key={c.id} className="bg-white shadow rounded-lg mb-4 px-4 py-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-blue-800">
                      <CustomerName id={c.customer_id} />
                    </div>
                    <div className="text-sm text-gray-700">
                      Collected: ₹{c.amount} <span className="ml-2 text-xs text-gray-400">{new Date(c.collected_at).toLocaleString()}</span>
                    </div>
                    {c.remarks && (
                      <div className="text-xs text-gray-500 mt-1">Remarks: {c.remarks}</div>
                    )}
                  </div>
                  {/* You may add edit/delete actions here if needed in future */}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}
