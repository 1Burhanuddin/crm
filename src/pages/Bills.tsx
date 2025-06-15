
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

type Bill = {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  bill_date: string;
  items: any[];
  total: number;
};

function BillCreateModal({ open, setOpen, onBillCreated }: { open: boolean, setOpen: (o: boolean) => void, onBillCreated: () => void }) {
  const { user } = useSession();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState([{ name: "", qty: 1, price: 0 }]);
  const [loading, setLoading] = useState(false);

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

export default function Bills() {
  const { user } = useSession();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchBills = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("bills")
      .select("*")
      .eq("user_id", user.id)
      .order("bill_date", { ascending: false });
    if (error) {
      toast({ title: "Error fetching bills", description: error.message, variant: "destructive" });
      setBills([]);
    } else {
      setBills(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBills();
    // eslint-disable-next-line
  }, [user]);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="text-xl font-bold text-blue-900">Bills</div>
        <Button onClick={() => setShowCreate(true)}>+ New Bill</Button>
      </div>
      <BillCreateModal open={showCreate} setOpen={setShowCreate} onBillCreated={fetchBills} />
      {loading ? (
        <div>Loading...</div>
      ) : bills.length === 0 ? (
        <div className="text-gray-400 text-center mt-10">No bills created yet.</div>
      ) : (
        <div className="space-y-4">
          {bills.map((bill) => (
            <div key={bill.id} className="bg-white rounded-lg shadow p-4 border">
              <div className="font-medium">{bill.customer_name || "No Name"}</div>
              <div className="text-xs text-gray-500 mb-1">{bill.customer_phone}</div>
              <div className="text-sm">Date: {bill.bill_date}</div>
              <div className="mt-2">
                <table className="w-full text-sm mb-2">
                  <thead>
                    <tr>
                      <th className="text-left">Item</th>
                      <th className="text-right">Qty</th>
                      <th className="text-right">Price</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(bill.items || []).map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td>{item.name}</td>
                        <td className="text-right">{item.qty}</td>
                        <td className="text-right">{item.price}</td>
                        <td className="text-right">{Number(item.qty) * Number(item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-right font-semibold text-blue-900">
                  Total: ₹{bill.total}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
