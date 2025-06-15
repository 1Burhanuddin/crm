
import { useState } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { DEMO_SUPPLIERS } from "@/constants/supplierData";
import { Supplier } from "@/constants/types";
import { toast } from "@/hooks/use-toast";
import { AddSupplierDialog } from "./AddSupplierDialog";
import { EditSupplierDialog } from "./EditSupplierDialog";
import { DeleteSupplierDialog } from "./DeleteSupplierDialog";
import { Button } from "@/components/ui/button";

export function SupplierList() {
  const [filter, setFilter] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>(DEMO_SUPPLIERS);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const displayedSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(filter.toLowerCase())
  );

  function handleAddSupplier(name: string, phone: string) {
    if (suppliers.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      toast({
        title: "Supplier already exists",
        description: `A supplier named "${name}" already exists.`,
        variant: "destructive",
      });
      return;
    }
    setSuppliers((prev) => [
      ...prev,
      { id: "s" + (prev.length + 1), name, phone },
    ]);
    toast({
      title: "Supplier Added",
      description: name + " added successfully.",
    });
  }

  function handleEditStart(supplier: Supplier) {
    setSelectedSupplier(supplier);
    setEditDialogOpen(true);
  }

  function handleEditSupplier(id: string, name: string, phone: string) {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name, phone } : s))
    );
    toast({
      title: "Supplier Updated",
      description: `${name}'s details updated successfully.`,
    });
    setEditDialogOpen(false);
  }

  function handleDeleteStart(supplier: Supplier) {
    setSelectedSupplier(supplier);
    setDeleteDialogOpen(true);
  }

  function handleDeleteSupplier(id: string) {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    toast({
      title: "Supplier Deleted",
      description: "Supplier deleted successfully.",
      variant: "destructive"
    });
    setDeleteDialogOpen(false);
  }

  return (
    <div className="p-4 pb-24">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-blue-900">Suppliers</h2>
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
      {displayedSuppliers.length === 0 && (
        <div className="text-center text-gray-500 mt-8">No suppliers found.</div>
      )}
      <ul>
        {displayedSuppliers.map((s) => (
          <li
            key={s.id}
            className="bg-white shadow rounded-lg mb-3 px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center cursor-pointer hover:bg-blue-50 border transition group"
          >
            <div className="flex-1">
              <span className="font-medium text-blue-900">{s.name}</span>
              {s.phone && <span className="block text-gray-500 text-xs">{s.phone}</span>}
            </div>
            <div className="flex gap-1 mt-2 sm:mt-0 opacity-70 group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="text-blue-600"
                onClick={e => { e.stopPropagation(); handleEditStart(s); }}
                aria-label="Edit"
              >
                <Edit size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-600"
                onClick={e => { e.stopPropagation(); handleDeleteStart(s); }}
                aria-label="Delete"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <AddSupplierDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddSupplier}
      />
      <EditSupplierDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        supplier={selectedSupplier}
        onEdit={handleEditSupplier}
      />
      <DeleteSupplierDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        supplier={selectedSupplier}
        onDelete={handleDeleteSupplier}
      />
    </div>
  );
}
