import { useState, useEffect } from "react";
import * as React from "react";
import { Plus, Search, Pencil, Trash2, UserPlus, Users } from "lucide-react";
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
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, status } = useSession();
  const addFromContacts = useAddCustomerFromContacts(handleAddCustomer);

  // Filter customers based on search input
  const displayedCustomers = React.useMemo(() => {
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [customers, filter]);

  // Handle card click to toggle active state
  const handleCardClick = (customerId: string) => {
    setActiveCardId(activeCardId === customerId ? null : customerId);
  };

  // Handle click outside to close active card
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.customer-card')) {
        setActiveCardId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch customers from Supabase
  useEffect(() => {
    if (user) {
      fetchCustomers();
    }
  }, [user]);

  async function fetchCustomers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Error fetching customers",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Add new customer
  async function handleAddCustomer(name: string, phone: string) {
    try {
      const { data, error } = await supabase
        .from("customers")
        .insert([{ name, phone, user_id: user?.id }])
        .select()
        .single();

      if (error) throw error;

      setCustomers((prev) => [data, ...prev]);
      toast({
        title: "Success",
        description: "Customer added successfully",
      });
      setAddDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error adding customer",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  // Edit customer
  async function handleEditCustomer(id: string, name: string, phone: string) {
    try {
      const { data, error } = await supabase
        .from("customers")
        .update({ name, phone })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name, phone } : c))
      );
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      setEditDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error updating customer",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  // Delete customer
  async function handleDeleteCustomer(id: string) {
    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setCustomers((prev) => prev.filter((c) => c.id !== id));
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
      setDeleteDialogOpen(false);
      setActiveCardId(null);
    } catch (error: any) {
      toast({
        title: "Error deleting customer",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  function handleEditStart(customer: Customer) {
    setSelectedCustomer(customer);
    setEditDialogOpen(true);
  }

  function handleDeleteStart(customer: Customer) {
    setSelectedCustomer(customer);
    setDeleteDialogOpen(true);
  }

  // Show loading and error state
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-blue-900/70 flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
          <span>Loading customers…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-red-600 flex flex-col items-center gap-2">
          <span className="text-lg">⚠️ {error}</span>
          <button 
            onClick={fetchCustomers}
            className="text-sm text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-blue-100/60 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Users className="h-5 w-5 text-blue-700" />
          </div>
          <h2 className="text-xl font-semibold text-blue-900">Customers</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
            <div className="text-2xl font-bold text-blue-900">{customers.length}</div>
            <div className="text-gray-500 text-sm">Total Customers</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
            <div className="text-2xl font-bold text-blue-900">{displayedCustomers.length}</div>
            <div className="text-gray-500 text-sm">Showing Now</div>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            placeholder="Search customers by name…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setAddDialogOpen(true)}
            className="flex-1 sm:flex-initial bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 text-base font-semibold hover:bg-blue-700 min-w-[120px] justify-center transition-all shadow-sm"
          >
            <Plus size={20} />
            Add
          </Button>
          <Button
            onClick={addFromContacts}
            className="flex-1 sm:flex-initial bg-blue-100 text-blue-700 px-6 py-2.5 rounded-xl flex items-center gap-2 text-base font-semibold hover:bg-blue-200 min-w-[180px] justify-center transition-all"
            variant="secondary"
            type="button"
            disabled={loading}
          >
            <UserPlus size={20} />
            Add From Contacts
          </Button>
        </div>
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="text-center py-12 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
          <div className="text-gray-500">Loading customers...</div>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-red-50/50 rounded-2xl border-2 border-dashed border-red-200">
          <div className="text-red-500">{error}</div>
        </div>
      ) : displayedCustomers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
          <div className="text-gray-500">
            {filter ? "No customers found matching your search" : "No customers found"}
          </div>
          <button
            onClick={() => setAddDialogOpen(true)}
            className="mt-2 text-blue-600 hover:underline"
          >
            Add your first customer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {displayedCustomers.map((c) => (
            <div
              key={c.id}
              className="customer-card group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-200 p-4 relative cursor-pointer"
              onClick={() => handleCardClick(c.id)}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-blue-900 text-lg truncate group-hover:text-blue-700 transition-colors">
                      {c.name}
                    </h3>
                    {c.phone && (
                      <p className="text-gray-500 text-sm mt-0.5 truncate">
                        {c.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions - Shown when card is active */}
              <div 
                className={`absolute inset-0 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center gap-3 transition-all duration-200
                  ${activeCardId === c.id ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
              >
                <Button
                  size="default"
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg h-10 flex items-center gap-2 font-medium shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditStart(c);
                  }}
                >
                  <Pencil size={18} />
                  Edit
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-sm transition-transform hover:scale-105"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteStart(c);
                  }}
                  title="Delete customer"
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddCustomerDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddCustomer}
      />
      {selectedCustomer && (
        <>
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
        </>
      )}
    </div>
  );
}

// NOTE: This file is now getting quite large (250+ lines). Consider refactoring it into smaller files/components after this!
