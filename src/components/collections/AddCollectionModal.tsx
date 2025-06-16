import React from "react";
import { Button } from "@/components/ui/button";
import { format, addDays } from "date-fns";

type DeliveredOrder = { id: string; amount: number };

export function AddCollectionModal({
  open,
  setOpen,
  form,
  setForm,
  handleSubmit,
  customers,
  customerDeliveredOrders,
  displayDate,
  isAdding,
  handleOrderIdChange,
  handleFormChange
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  customers: { id: string; name: string }[];
  customerDeliveredOrders: Record<string, DeliveredOrder[]>;
  displayDate: (date: Date) => string;
  isAdding: boolean;
  handleOrderIdChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) {
  if (!open) return null;

  const selectedCustomer = customers.find(c => c.id === form.customer_id);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-30 bg-black/30">
      <div className="bg-white rounded-lg shadow p-6 min-w-[300px] max-w-[90vw]">
        <h3 className="font-semibold text-lg mb-3">
          Add Collection
        </h3>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2 text-sm font-medium">Customer</label>
          <div className="w-full border px-2 py-2 rounded mb-3 bg-gray-100 text-gray-700">
            {selectedCustomer?.name || 'No customer selected'}
          </div>

          {/* Hidden input to ensure customer_id is submitted */}
          <input
            type="hidden"
            name="customer_id"
            value={form.customer_id}
          />

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
          />

          {/* Hidden input to ensure amount is submitted */}
          <input
            type="hidden"
            name="amount_hidden"
            value={form.amount}
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
              onClick={() => setOpen(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium px-6 py-2.5 rounded-lg transition w-full sm:w-auto text-base shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAdding || !form.customer_id || !form.amount}
              className="bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition w-full sm:w-auto text-base shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isAdding ? "Saving..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
