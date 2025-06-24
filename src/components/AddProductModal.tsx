import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddProductModal({ open, onOpenChange, onSuccess }: AddProductModalProps) {
  const { user } = useSession();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) {
      toast({
        title: "Required",
        description: "Please enter product name.",
        variant: "destructive",
      });
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      toast({
        title: "Required",
        description: "Please enter a valid price.",
        variant: "destructive",
      });
      return;
    }
    if (!unit.trim()) {
      toast({
        title: "Required",
        description: "Please enter unit (e.g. pcs, kg, etc).",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("products").insert({
        name: name.trim(),
        price: parseFloat(price),
        unit: unit.trim(),
        user_id: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product added successfully.",
      });
      
      setName("");
      setPrice("");
      setUnit("");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg bg-blue-50 p-0 rounded-2xl shadow-xl border-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between w-full">
            <DialogTitle className="text-2xl font-bold text-blue-900">Add New Product</DialogTitle>
            <button
              type="button"
              className="ml-4 p-2 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-blue-900">Product Name</label>
            <Input
              placeholder="Enter product name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3 text-base font-medium text-gray-700 focus:ring-2 focus:ring-blue-200 h-14 min-h-[56px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-blue-900">Price (₹)</label>
            <Input
              type="number"
              placeholder="Enter price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3 text-base font-medium text-gray-700 focus:ring-2 focus:ring-blue-200 h-14 min-h-[56px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-blue-900">Unit</label>
            <Input
              placeholder="Enter unit (e.g. pcs, kg, etc)"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              maxLength={20}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3 text-base font-medium text-gray-700 focus:ring-2 focus:ring-blue-200 h-14 min-h-[56px]"
            />
          </div>
          <DialogFooter className="gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 px-8 py-4 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-base"
              >
                Cancel
              </Button>
            <Button 
              type="button"
              onClick={handleAdd}
              disabled={submitting}
              className="flex-1 rounded-2xl px-10 py-4 bg-blue-700 hover:bg-blue-800 text-white shadow-lg font-semibold tracking-wide transition-all duration-150 focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:opacity-60 text-base"
            >
              {submitting ? "Adding..." : "Add Product"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
