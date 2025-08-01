import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { BillCreateModal } from "@/components/BillCreateModal";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import html2pdf from "html2pdf.js";
import { BillHtmlPreview } from "@/components/BillHtmlPreview";
import { useRef } from "react";

type Bill = {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  bill_date: string;
  items: any[];
  total: number;
};

// type for profile info
type ProfileInfo = {
  name: string | null;
  shop_name: string | null;
};

export function BillList() {
  const { user } = useSession();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [profile, setProfile] = useState<ProfileInfo>({ name: null, shop_name: null });
  const [pdfBill, setPdfBill] = useState<Bill | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  // Fetch profile info for user
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
    <div className="w-full">
      <div className="mb-2">
        <BackButton />
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
        <div>Loading...</div>
      ) : bills.length === 0 ? (
        <div className="text-gray-400 text-center mt-10">No bills created yet.</div>
      ) : (
        <div className="space-y-8">
          {bills.map((bill) => (
            <div key={bill.id} className="bg-white rounded-lg shadow p-6 border">
              {/* Bill Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                <div>
                  <div className="font-bold text-lg text-blue-900">INVOICE</div>
                  <div className="font-medium">{bill.customer_name || "No Name"}</div>
                  <div className="text-xs text-gray-500 mb-1">{bill.customer_phone}</div>
                </div>
                <div className="mt-2 sm:mt-0 text-xs text-right text-gray-700">
                  <div>Date: {bill.bill_date}</div>
                  <div>Bill #: <span className="font-mono">{bill.id.slice(0, 8).toUpperCase()}</span></div>
                  {/* PDF Export Button */}
                  <div className="mt-2 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex gap-1 items-center"
                      onClick={async () => {
                        setPdfBill(bill);
                        setTimeout(() => {
                          if (pdfRef.current) {
                            html2pdf()
                              .set({
                                margin: 0.5,
                                filename: `Bill_${bill.id.slice(0,8)}.pdf`,
                                html2canvas: { scale: 2 },
                                jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
                              })
                              .from(pdfRef.current)
                              .save();
                          }
                        }, 100);
                      }}
                    >
                          <Download size={15} />
                      Export PDF
                        </Button>
                  </div>
                </div>
              </div>
              {/* Bill Items Table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm border">
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
                {/* Total */}
                <div className="mt-3 flex justify-end items-center">
                  <span className="text-base font-semibold text-blue-900 mr-2">Total:</span>
                  <span className="text-lg font-bold text-blue-900">₹{bill.total}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Hidden PDF preview for html2pdf */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {pdfBill && (
          <div ref={pdfRef}>
            <BillHtmlPreview
              bill={pdfBill}
              userName={profile.name || ""}
              shopName={profile.shop_name || "Company Name"}
            />
          </div>
        )}
      </div>
    </div>
  );
}
