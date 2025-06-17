import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";
import { IndianRupee } from "lucide-react";

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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-blue-900">Add Product</DialogTitle>
          <DialogDescription className="text-gray-500">Enter product details below.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4 mt-4" onSubmit={handleFormSubmit}>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Product Name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Apple"
              className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Rate per Unit</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IndianRupee className="h-4 w-4 text-gray-500" />
              </div>
            <Input
              type="number"
              min={0}
                step="0.01"
              value={price}
              onChange={e => setPrice(e.target.value)}
                placeholder="0.00"
                className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 pl-8"
              required
                inputMode="decimal"
                pattern="[0-9]*"
            />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Unit</label>
            <Input
              value={unit}
              onChange={e => setUnit(e.target.value)}
              placeholder="e.g. kg, pc, box"
              className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <DialogFooter className="gap-2 mt-6">
            <DialogClose asChild>
              <Button 
                type="button" 
                variant="outline"
                className="border-gray-200 hover:bg-gray-50"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              Add Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
