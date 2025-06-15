
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface EditModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (values: { amount: number; remarks: string }) => Promise<void>;
  initial: { amount: number; remarks: string };
  loading: boolean;
}

export function CollectionEditModal({ open, onClose, onSave, initial, loading }: EditModalProps) {
  const [amount, setAmount] = useState(initial.amount);
  const [remarks, setRemarks] = useState(initial.remarks);

  useEffect(() => {
    // Reset fields when opening
    if (open) {
      setAmount(initial.amount);
      setRemarks(initial.remarks);
    }
  }, [open, initial.amount, initial.remarks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ amount, remarks });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Collection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2 text-sm font-medium">Amount</label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full border px-2 py-1 rounded mb-3"
            required
          />
          <label className="block mb-2 text-sm font-medium">Remarks</label>
          <input
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full border px-2 py-1 rounded mb-3"
            placeholder="optional"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
