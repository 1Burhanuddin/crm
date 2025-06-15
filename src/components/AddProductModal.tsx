
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";

type AddProductModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (product: { name: string; price: number; unit: string }) => void;
};

export function AddProductModal({ open, onOpenChange, onSubmit }: AddProductModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("");

  // Optionally, you can reset form fields when the dialog closes
  React.useEffect(() => {
    if (!open) {
      setName("");
      setPrice("");
      setUnit("");
    }
  }, [open]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim() || !unit.trim()) return;
    onSubmit?.({
      name: name.trim(),
      price: +price,
      unit: unit.trim(),
    });
    onOpenChange(false); // close modal
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
          <DialogDescription>Enter product details below.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleFormSubmit}>
          <div>
            <label className="block mb-1 font-medium text-sm text-blue-800">Product Name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Apple"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-sm text-blue-800">Price</label>
            <Input
              type="number"
              min={0}
              step="any"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="e.g. 50"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-sm text-blue-800">Unit</label>
            <Input
              value={unit}
              onChange={e => setUnit(e.target.value)}
              placeholder="e.g. kg, pc, box"
              required
            />
          </div>
          <DialogFooter className="gap-2 mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Add Product</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
