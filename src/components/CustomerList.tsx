
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { DEMO_CUSTOMERS } from "@/constants/demoData";
import { Customer } from "@/constants/types";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { AddCustomerDialog } from "./AddCustomerDialog";

export function CustomerList() {
  const [filter, setFilter] = useState("");
  const [customers, setCustomers] = useState<Customer[]>(DEMO_CUSTOMERS);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const navigate = useNavigate();

  const displayedCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(filter.toLowerCase())
  );

  function handleAddCustomer(name: string, phone: string) {
    // Basic uniqueness by name (case-insensitive)
    if (customers.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      toast({
        title: "Customer already exists",
        description: `A customer named "${name}" already exists.`,
        variant: "destructive",
      });
      return;
    }
    setCustomers((prev) => [
      ...prev,
      { id: "c" + (prev.length + 1), name, phone },
    ]);
    toast({
      title: "Customer Added",
      description: name + " added successfully.",
    });
  }

  return (
    <div className="p-4 pb-24">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-blue-900">Customers</h2>
        <button
          onClick={() => setAddDialogOpen(true)}
          className="bg-blue-800 text-white px-3 py-1 rounded flex items-center gap-1 text-sm shadow hover:bg-blue-900"
        >
          <Plus size={18} /> Add
        </button>
      </div>
      <div className="mb-3 flex items-center gap-2">
        <Search size={18} className="text-gray-400" />
        <input
          type="text"
          className="flex-1 border-b border-blue-100 focus:outline-none px-2 py-1 text-base"
          placeholder="Search by name…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
        {displayedCustomers.length === 0 && (
          <div className="text-center text-gray-500 mt-8">No customers found.</div>
        )}
      <ul>
        {displayedCustomers.map((c) => (
          <li
            key={c.id}
            className="bg-white shadow rounded-lg mb-3 px-4 py-3 flex flex-col cursor-pointer hover:bg-blue-50 border transition"
            onClick={() => navigate(`/customers/${c.id}`)}
          >
            <span className="font-medium text-blue-900">{c.name}</span>
            {c.phone && <span className="text-gray-500 text-xs">{c.phone}</span>}
          </li>
        ))}
      </ul>
      <AddCustomerDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddCustomer}
      />
    </div>
  );
}
