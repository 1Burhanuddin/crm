
import { useParams } from "react-router-dom";
import { DEMO_CUSTOMERS, DEMO_TRANSACTIONS } from "@/constants/demoData";
import { Transaction } from "@/constants/types";
import { Plus } from "lucide-react";
import { useState } from "react";

export function CustomerLedger() {
  const { id } = useParams();
  const customer = DEMO_CUSTOMERS.find((c) => c.id === id);
  const transactions = DEMO_TRANSACTIONS.filter((t) => t.customerId === id);

  const balance =
    transactions.reduce(
      (sum, t) => sum + (t.type === "udhaar" ? t.amount : -t.amount),
      0
    ) ?? 0;

  const [showAdd, setShowAdd] = useState(false);

  if (!customer) return <div className="p-6 text-center">Customer not found.</div>;

  return (
    <div className="p-4 pb-24">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-xl font-bold text-blue-900">{customer.name}</h2>
          <div className="text-xs text-gray-500">{customer.phone}</div>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-green-600 text-white rounded px-3 py-2 flex items-center gap-1 text-sm shadow hover:bg-green-700">
          <Plus size={18} /> Add Entry
        </button>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <span className="font-bold text-lg text-blue-800">Balance: </span>
        <span className={`font-bold text-lg ${balance >= 0 ? "text-red-600" : "text-green-600"}`}>
          ₹{Math.abs(balance)}
        </span>
        <span className="text-xs ml-2">{balance >= 0 ? "Due (Udhaar)" : "Advance"}</span>
      </div>

      <ul>
        {transactions.map((t) => (
          <li
            key={t.id}
            className={`mb-3 rounded shadow px-4 py-3 flex flex-col border-l-4 ${
              t.type === "udhaar" ? "border-red-500 bg-white" : "border-green-500 bg-green-50"
            }`}
          >
            <span className="font-semibold text-blue-900">
              {t.type === "udhaar" ? "Given" : "Received"}: ₹{t.amount}
            </span>
            <span className="text-gray-500 text-xs">{t.date} - {t.note}</span>
          </li>
        ))}
      </ul>
      {transactions.length === 0 && <div className="text-gray-500 my-8 text-center">No transactions yet.</div>}
      {/* AddTransactionModal can be wired up here */}
      {/* {showAdd && <AddTransactionModal />} */}
    </div>
  );
}
