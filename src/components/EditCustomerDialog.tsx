
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Customer } from "@/constants/types";

interface EditCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onEdit: (id: string, name: string, phone: string) => void;
}

export function EditCustomerDialog({ open, onOpenChange, customer, onEdit }: EditCustomerDialogProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
    } else {
      setName("");
      setPhone("");
    }
  }, [customer, open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (customer) {
      onEdit(customer.id, name.trim(), phone.trim());
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium mb-1 text-blue-800">Name</label>
            <input
              className="w-full border px-3 py-2 rounded"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              // autoFocus removed to prevent unwanted keyboard popup
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-blue-800">Phone</label>
            <input
              className="w-full border px-3 py-2 rounded"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              type="tel"
              // autoFocus removed to prevent unwanted keyboard popup
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
