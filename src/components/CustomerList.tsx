
import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { DEMO_CUSTOMERS } from "@/constants/demoData";
import { Customer } from "@/constants/types";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { AddCustomerDialog } from "./AddCustomerDialog";
import { EditCustomerDialog } from "./EditCustomerDialog";
import { DeleteCustomerDialog } from "./DeleteCustomerDialog";
import { Button } from "@/components/ui/button";
import { useAddCustomerFromContacts } from "./hooks/useAddCustomerFromContacts";

const LOCAL_STORAGE_KEY = "customers_v1";

export function CustomerList() {
  const [filter, setFilter] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const navigate = useNavigate();

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        setCustomers(JSON.parse(stored) as Customer[]);
      } catch {
        setCustomers(DEMO_CUSTOMERS);
      }
    } else {
      setCustomers(DEMO_CUSTOMERS);
    }
  }, []);

  // Save to localStorage when customers change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customers));
  }, [customers]);

  const displayedCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(filter.toLowerCase())
  );

  function handleAddCustomer(name: string, phone: string) {
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

  function handleEditStart(customer: Customer) {
    setSelectedCustomer(customer);
    setEditDialogOpen(true);
  }

  function handleEditCustomer(id: string, name: string, phone: string) {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name, phone } : c))
    );
    toast({
      title: "Customer Updated",
      description: `${name}'s details updated successfully.`,
    });
    setEditDialogOpen(false);
  }

  function handleDeleteStart(customer: Customer) {
    setSelectedCustomer(customer);
    setDeleteDialogOpen(true);
  }

  function handleDeleteCustomer(id: string) {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    toast({
      title: "Customer Deleted",
      description: "Customer deleted successfully.",
      variant: "destructive"
    });
    setDeleteDialogOpen(false);
  }

  const addFromContacts = useAddCustomerFromContacts(handleAddCustomer);

  return (
    <div className="p-4 pb-24">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-blue-900">Customers</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setAddDialogOpen(true)}
            className="bg-blue-800 text-white px-3 py-1 rounded flex items-center gap-1 text-sm shadow hover:bg-blue-900"
          >
            <Plus size={18} /> Add
          </button>
          <button
            onClick={addFromContacts}
            className="bg-blue-500 text-white px-3 py-1 rounded flex items-center gap-1 text-sm shadow hover:bg-blue-600"
          >
            {/* Only allowed Lucide icon: "contact" */}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="7" r="4"/><path d="M18 21v-2a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v2"/></svg> Add From Contacts
          </button>
        </div>
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
            className="bg-white shadow rounded-lg mb-3 px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center cursor-pointer hover:bg-blue-50 border transition group"
            onClick={() => navigate(`/customers/${c.id}`)}
          >
            <div className="flex-1">
              <span className="font-medium text-blue-900">{c.name}</span>
              {c.phone && <span className="block text-gray-500 text-xs">{c.phone}</span>}
            </div>
            <div className="flex gap-1 mt-2 sm:mt-0 opacity-70 group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="text-blue-600"
                onClick={e => { e.stopPropagation(); handleEditStart(c); }}
                aria-label="Edit"
              >
                <Edit size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-600"
                onClick={e => { e.stopPropagation(); handleDeleteStart(c); }}
                aria-label="Delete"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <AddCustomerDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddCustomer}
      />
      <EditCustomerDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        customer={selectedCustomer}
        onEdit={handleEditCustomer}
      />
      <DeleteCustomerDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        customer={selectedCustomer}
        onDelete={handleDeleteCustomer}
      />
    </div>
  );
}

