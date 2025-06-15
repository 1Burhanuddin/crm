import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Customer } from "@/constants/types";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { AddCustomerDialog } from "./AddCustomerDialog";
import { EditCustomerDialog } from "./EditCustomerDialog";
import { DeleteCustomerDialog } from "./DeleteCustomerDialog";
import { Button } from "@/components/ui/button";
import { useAddCustomerFromContacts } from "./hooks/useAddCustomerFromContacts";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

export function CustomerList() {
  const [filter, setFilter] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const navigate = useNavigate();
  const { user, status } = useSession();

  // Fetch customers from Supabase when user logged in
  useEffect(() => {
    async function fetchCustomers() {
      setLoading(true);
      setError(null);
      if (!user) {
        setCustomers([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        setError("Could not fetch customers.");
        setCustomers([]);
      } else if (data) {
        setCustomers(data);
      }
      setLoading(false);
    }
    fetchCustomers();
  }, [user]);

  const displayedCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(filter.toLowerCase())
  );

  async function reloadCustomers() {
    if (!user) return;
    const { data, error } = await supabase
      .from("customers")
      .select("id, name, phone")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setCustomers(data);
  }

  async function handleAddCustomer(name: string, phone: string) {
    if (!user) {
      toast({
        title: "Not signed in",
        description: "Please log in to add customers.",
        variant: "destructive",
      });
      return;
    }
    // Check duplicate name (case-insensitive)
    if (customers.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      toast({
        title: "Customer already exists",
        description: `A customer named "${name}" already exists.`,
        variant: "destructive",
      });
      return;
    }
    const { error } = await supabase
      .from("customers")
      .insert([{ name, phone, user_id: user.id }]);
    if (error) {
      toast({ title: "Error", description: "Could not add customer.", variant: "destructive" });
      return;
    }
    toast({
      title: "Customer Added",
      description: name + " added successfully.",
    });
    await reloadCustomers();
  }

  function handleEditStart(customer: Customer) {
    setSelectedCustomer(customer);
    setEditDialogOpen(true);
  }

  async function handleEditCustomer(id: string, name: string, phone: string) {
    if (!user) return;
    const { error } = await supabase
      .from("customers")
      .update({ name, phone })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) {
      toast({ title: "Error", description: "Could not update customer.", variant: "destructive" });
      return;
    }
    toast({
      title: "Customer Updated",
      description: `${name}'s details updated successfully.`,
    });
    setEditDialogOpen(false);
    await reloadCustomers();
  }

  function handleDeleteStart(customer: Customer) {
    setSelectedCustomer(customer);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteCustomer(id: string) {
    if (!user) return;
    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) {
      toast({ title: "Error", description: "Could not delete customer.", variant: "destructive" });
      return;
    }
    toast({
      title: "Customer Deleted",
      description: "Customer deleted successfully.",
      variant: "destructive"
    });
    setDeleteDialogOpen(false);
    await reloadCustomers();
  }

  // Hook for Add from Contacts (uses new version)
  const addFromContacts = useAddCustomerFromContacts(handleAddCustomer);

  // Show loading and error state
  if (status === "loading" || loading) {
    return <div className="p-6 text-center text-gray-500">Loading customers…</div>;
  }
  if (error) {
    return <div className="p-6 text-center text-red-700">{error}</div>;
  }

  return (
    <div className="p-4 pb-0">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-xl font-semibold text-blue-900">Customers</h2>
        <div className="flex flex-row flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => setAddDialogOpen(true)}
            className="flex-1 sm:flex-initial bg-blue-800 text-white px-3 py-1 rounded flex items-center gap-1 text-sm shadow hover:bg-blue-900 min-w-[110px] justify-center"
          >
            <Plus size={18} /> Add
          </button>
          <button
            onClick={addFromContacts}
            className="flex-1 sm:flex-initial bg-blue-500 text-white px-3 py-1 rounded flex items-center gap-1 text-sm shadow hover:bg-blue-600 min-w-[140px] justify-center"
          >
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
        onAdd={async (name, phone) => {
          await handleAddCustomer(name, phone);
        }}
      />
      <EditCustomerDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        customer={selectedCustomer}
        onEdit={async (id, name, phone) => {
          await handleEditCustomer(id, name, phone);
        }}
      />
      <DeleteCustomerDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        customer={selectedCustomer}
        onDelete={async (id) => {
          await handleDeleteCustomer(id);
        }}
      />
    </div>
  );
}
