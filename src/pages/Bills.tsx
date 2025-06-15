
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { BillCreateModal } from "@/components/BillCreateModal";

type Bill = {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  bill_date: string;
  items: any[];
  total: number;
};

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
      const typedBills: Bill[] = (data || []).map(bill => ({
        ...bill,
        items: Array.isArray(bill.items) ? bill.items : [],
      }));
      setBills(typedBills);
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
      <BillCreateModal
        open={showCreate}
        setOpen={setShowCreate}
        onBillCreated={fetchBills}
      />
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
