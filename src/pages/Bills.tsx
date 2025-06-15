
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { BillCreateModal } from "@/components/BillCreateModal";
import { BillPdfDoc } from "@/components/BillPdf";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { BackButton } from "@/components/BackButton";

type Bill = {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  bill_date: string;
  items: any[];
  total: number;
};

type ProfileInfo = {
  name: string | null;
  shop_name: string | null;
};

export default function Bills() {
  const { user } = useSession();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [profile, setProfile] = useState<ProfileInfo>({ name: null, shop_name: null });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("name,shop_name")
        .eq("id", user.id)
        .single();
      if (!error && data) {
        setProfile({ name: data.name, shop_name: data.shop_name });
      }
    };
    fetchProfile();
  }, [user]);

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
    <AppLayout title="Bills">
      <div className="p-4 max-w-lg w-full mx-auto">
        <div className="mb-2">
          <BackButton toMainScreen />
        </div>
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
          <div className="flex flex-col min-h-[40vh] items-center justify-center text-blue-800 text-lg font-semibold">
            Loading...
          </div>
        ) : bills.length === 0 ? (
          <div className="text-gray-400 text-center mt-10">No bills created yet.</div>
        ) : (
          <div className="space-y-6">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className="bg-white rounded-xl shadow-md border border-gray-200 p-4 w-full max-w-md mx-auto transition-all relative"
              >
                {/* Export PDF top-right */}
                <div className="absolute right-4 top-4">
                  <PDFDownloadLink
                    document={
                      <BillPdfDoc
                        bill={bill}
                        shopName={profile.shop_name || ""}
                        userName={profile.name || ""}
                      />
                    }
                    fileName={`Bill_${bill.id.slice(0, 8)}.pdf`}
                    className="inline-flex"
                  >
                    {({ loading: pdfLoading }) => (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-blue-50 border border-blue-100 text-blue-900 hover:bg-blue-100 hover:text-blue-900 shadow-none font-medium px-3 py-1 rounded-md transition"
                      >
                        <Download size={15} className="mr-1" />
                        {pdfLoading ? "Generating..." : "Export PDF"}
                      </Button>
                    )}
                  </PDFDownloadLink>
                </div>
                {/* Bill Header */}
                <div className="flex flex-col gap-0.5 pr-[130px] min-h-[60px]">
                  <span className="font-bold text-base text-blue-900">INVOICE</span>
                  <span className="font-medium text-[1.02rem] text-zinc-800 truncate">
                    {profile.shop_name || bill.customer_name || "No Name"}
                  </span>
                  <span className="text-sm text-gray-500">
                    {bill.customer_phone}
                  </span>
                </div>
                <div className="mt-2 flex flex-row flex-wrap justify-between items-center text-xs text-gray-700">
                  <div>
                    <div>
                      Date: <span className="font-[500]">{bill.bill_date}</span>
                    </div>
                    <div>
                      Bill #:{" "}
                      <span className="font-mono text-[13px] text-blue-900 underline decoration-blue-200 underline-offset-4">
                        {bill.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Bill Items Table */}
                <div className="mt-3 rounded-lg bg-white border border-gray-200 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-2 font-semibold border-b">Item</th>
                        <th className="text-right p-2 font-semibold border-b">Qty</th>
                        <th className="text-right p-2 font-semibold border-b">Price</th>
                        <th className="text-right p-2 font-semibold border-b">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(bill.items || []).map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-2">{item.name}</td>
                          <td className="p-2 text-right">{item.qty}</td>
                          <td className="p-2 text-right">₹{item.price}</td>
                          <td className="p-2 text-right">₹{Number(item.qty) * Number(item.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Total */}
                <div className="mt-3 flex justify-end items-center">
                  <span className="text-base font-semibold text-blue-900 mr-2">Total:</span>
                  <span className="text-lg font-bold text-blue-900">₹{bill.total}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
