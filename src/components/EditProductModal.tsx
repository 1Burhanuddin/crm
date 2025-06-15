
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState, useEffect } from "react";

type EditProductModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (product: { id: string; name: string; price: number; unit: string }) => void;
  initialProduct: { id: string; name: string; price: number; unit: string } | null;
};

export function EditProductModal({ open, onOpenChange, onSubmit, initialProduct }: EditProductModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("");

  useEffect(() => {
    if (open && initialProduct) {
      setName(initialProduct.name);
      setPrice(initialProduct.price?.toString() || "");
      setUnit(initialProduct.unit);
    } else if (!open) {
      setName("");
      setPrice("");
      setUnit("");
    }
  }, [open, initialProduct]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim() || !unit.trim() || !initialProduct) return;
    onSubmit({
      id: initialProduct.id,
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
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>Modify product details below.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleFormSubmit}>
          <div>
            <label className="block mb-1 font-medium text-sm text-blue-800">Product Name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Apple"
              autoFocus
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
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
