
import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, UserPlus, MoreHorizontal } from "lucide-react";
import { Customer } from "@/constants/types";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { AddCustomerDialog } from "./AddCustomerDialog";
import { EditCustomerDialog } from "./EditCustomerDialog";
import { DeleteCustomerDialog } from "./DeleteCustomerDialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
    setOpenMenuId(null);
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
    setOpenMenuId(null);
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
        <div className="flex flex-row flex-wrap gap-3 w-full sm:w-auto">
          <Button
            onClick={() => setAddDialogOpen(true)}
            className="flex-1 sm:flex-initial bg-primary text-white px-6 py-3 rounded-lg flex items-center gap-2 text-base font-semibold shadow-lg hover:bg-primary/90 min-w-[135px] justify-center transition"
            size="lg"
          >
            <Plus size={22} strokeWidth={2.2} />
            Add
          </Button>
          <Button
            onClick={addFromContacts}
            className="flex-1 sm:flex-initial bg-blue-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 text-base font-semibold shadow-lg hover:bg-blue-600 min-w-[180px] justify-center transition"
            size="lg"
            variant="secondary"
            type="button"
          >
            <UserPlus size={22} strokeWidth={2.2} />
            Add From Contacts
          </Button>
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
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
        {displayedCustomers.map((c) => (
          <li
            key={c.id}
            className="bg-white shadow-sm border border-blue-100 rounded-xl px-5 py-4 flex flex-col min-h-[105px] relative transition hover:shadow-md hover:scale-[1.01] hover:bg-blue-50/30 duration-150 group"
            onClick={() => navigate(`/customers/${c.id}`)}
            tabIndex={0}
            aria-label={`View details for ${c.name}`}
            style={{ cursor: "pointer" }}
          >
            {/* Three dot menu in top-right */}
            <div className="absolute right-2 top-2 z-10">
              <DropdownMenu open={openMenuId === c.id} onOpenChange={(open) => setOpenMenuId(open ? c.id : null)}>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-1.5 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 border transition"
                    onClick={e => { e.stopPropagation(); setOpenMenuId(c.id); }}
                    aria-label="Customer actions"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-30 min-w-[130px] bg-white border shadow-lg rounded-md py-1">
                  <DropdownMenuItem
                    onSelect={e => {
                      e.preventDefault();
                      handleEditStart(c);
                    }}
                    className="flex items-center gap-2 text-blue-900 hover:bg-blue-50 cursor-pointer"
                  >
                    <Edit size={16} /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={e => {
                      e.preventDefault();
                      handleDeleteStart(c);
                    }}
                    className="flex items-center gap-2 text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 size={16} /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <span className="font-semibold text-blue-900 text-lg">{c.name}</span>
              {c.phone && <span className="block text-gray-500 text-sm mt-1">{c.phone}</span>}
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

// NOTE: This file is now getting quite large (250+ lines). Consider refactoring it into smaller files/components after this!

