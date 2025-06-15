import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

type Item = { name: string; qty: number; price: number };
type InitialData = {
  customerName?: string;
  customerPhone?: string;
  items?: Item[];
};

export function BillCreateModal({
  open,
  setOpen,
  onBillCreated,
  initialData = {}
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  onBillCreated: () => void;
  initialData?: InitialData;
}) {
  const { user } = useSession();
  // Only initialize with a default item if there are NO valid initialData.items
  const [customerName, setCustomerName] = useState(initialData.customerName || "");
  const [customerPhone, setCustomerPhone] = useState(initialData.customerPhone || "");
  // New logic: Check if initialData.items exists, has length, and at least one item has a non-empty name
  const hasValidItems = Array.isArray(initialData.items)
    && initialData.items.length > 0
    && initialData.items.some(it => it && it.name);
  const [items, setItems] = useState<Item[]>(
    hasValidItems
      ? initialData.items!
      : [{ name: "", qty: 1, price: 0 }]
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Re-fill form if modal is opened with different order data
    if (open) {
      setCustomerName(initialData.customerName || "");
      setCustomerPhone(initialData.customerPhone || "");
      const valid = Array.isArray(initialData.items)
        && initialData.items.length > 0
        && initialData.items.some(it => it && it.name);
      setItems(
        valid
          ? initialData.items!
          : [{ name: "", qty: 1, price: 0 }]
      );
    }
    // eslint-disable-next-line
  }, [open, initialData.customerName, initialData.customerPhone, JSON.stringify(initialData.items)]);

  const handleAddItem = () => setItems([...items, { name: "", qty: 1, price: 0 }]);
  const handleItemChange = (i: number, key: string, value: any) => {
    const newItems = [...items];
    newItems[i][key] = value;
    setItems(newItems);
  };
  const removeItem = (i: number) => {
    setItems(items.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!customerName.trim()) {
      toast({ title: "Customer name required", variant: "destructive" });
      return;
    }
    if (!items.length || items.some(it => !it.name || it.qty <= 0)) {
      toast({ title: "All items must have a name and quantity > 0", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("bills").insert([{
      user_id: user.id,
      customer_name: customerName,
      customer_phone: customerPhone,
      bill_date: new Date().toISOString().slice(0,10),
      items: items.map(it => ({ ...it, qty: Number(it.qty), price: Number(it.price) })),
      total: items.reduce((sum, it) => sum + Number(it.qty) * Number(it.price), 0)
    }]);
    setLoading(false);
    if (error) {
      toast({ title: "Error saving bill", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Bill created" });
      setCustomerName("");
      setCustomerPhone("");
      setItems([{ name: "", qty: 1, price: 0 }]);
      setOpen(false);
      onBillCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Bill</DialogTitle>
          <DialogDescription>Enter customer and items below.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
          <Input placeholder="Customer Phone (optional)" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
          <div>
            <div className="font-semibold mb-2">Items</div>
            <div className="flex flex-col gap-2">
              {items.map((it, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input className="flex-1" placeholder="Item name" value={it.name} onChange={e => handleItemChange(i, "name", e.target.value)} required />
                  <Input className="w-16" type="number" min={1} placeholder="Qty" value={it.qty} onChange={e => handleItemChange(i, "qty", e.target.value)} required />
                  <Input className="w-20" type="number" min={0} step={0.01} placeholder="Price" value={it.price} onChange={e => handleItemChange(i, "price", e.target.value)} required />
                  {items.length > 1 && (
                    <Button type="button" size="icon" variant="destructive" onClick={() => removeItem(i)}>-</Button>
                  )}
                </div>
              ))}
              <Button type="button" size="sm" variant="outline" onClick={handleAddItem}>+ Add Item</Button>
            </div>
          </div>
          <Button type="submit" className="w-full">{loading ? "Saving..." : "Create Bill"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
