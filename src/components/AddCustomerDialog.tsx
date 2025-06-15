
import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "@/hooks/use-toast";

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string, phone: string) => void;
}

export function AddCustomerDialog({ open, onOpenChange, onAdd }: AddCustomerDialogProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) {
      toast({ title: "Required", description: "Customer name is required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    onAdd(name.trim(), phone.trim());
    setName("");
    setPhone("");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Input
            autoFocus
            placeholder="Customer name"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={50}
          />
          <Input
            placeholder="Phone (optional)"
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/[^0-9+]/g, ""))}
            maxLength={15}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleAdd} disabled={submitting || !name.trim()} className="w-full sm:w-auto">
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
