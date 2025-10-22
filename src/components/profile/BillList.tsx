import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { EnhancedBillCreateModal } from "@/components/EnhancedBillCreateModal";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import html2pdf from "html2pdf.js";
import { BillHtmlPreview } from "@/components/BillHtmlPreview";
import { useRef } from "react";

type Bill = {
  id: string;
  bill_number?: string;
  customer_name: string;
  customer_phone: string | null;
  bill_date: string;
  due_date?: string;
  items: any[];
  subtotal?: number;
  discount_amount?: number;
  tax_rate?: number;
  tax_amount?: number;
  total: number;
  payment_terms?: string;
  notes?: string;
};

// type for profile info
type ProfileInfo = {
  name: string | null;
  shop_name: string | null;
  business_address?: string | null;
  gst_number?: string | null;
  pan_number?: string | null;
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
        .select("name, shop_name, business_address, gst_number, pan_number")
        .eq("id", user.id)
        .maybeSingle();
      if (!error && data) {
        setProfile({ 
          name: data.name, 
          shop_name: data.shop_name,
          business_address: data.business_address,
          gst_number: data.gst_number,
          pan_number: data.pan_number
        });
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
        {showCreate && (
          <EnhancedBillCreateModal
            open={showCreate}
            setOpen={setShowCreate}
            onBillCreated={fetchBills}
          />
        )}
      {loading ? (
        <div>Loading...</div>
      ) : bills.length === 0 ? (
        <div className="text-gray-400 text-center mt-10">No bills created yet.</div>
      ) : (
        <div className="space-y-8">
          {bills.map((bill) => (
            <div key={bill.id} className="bg-white rounded-lg shadow p-6 border">
              {/* Bill Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-4 border-b">
                <div>
                  <div className="font-bold text-xl text-blue-900 mb-1">TAX INVOICE</div>
                  <div className="font-semibold text-lg">{bill.customer_name || "No Name"}</div>
                  <div className="text-sm text-gray-600 mb-1">📞 {bill.customer_phone}</div>
                </div>
                <div className="mt-2 sm:mt-0 text-sm text-right text-gray-700">
                  <div className="mb-1">
                    <span className="font-semibold">Bill No:</span> 
                    <span className="font-mono ml-1 text-blue-700">{bill.bill_number || bill.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="mb-1"><span className="font-semibold">Date:</span> {bill.bill_date}</div>
                  {bill.due_date && <div className="mb-2"><span className="font-semibold">Due:</span> {bill.due_date}</div>}
                  {/* PDF Export Button */}
                  <div className="mt-2">
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
                                filename: `Bill_${bill.bill_number || bill.id.slice(0,8)}.pdf`,
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
                <table className="w-full text-sm border border-gray-200">
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="text-left p-3 font-semibold border-b text-blue-900">Item</th>
                      <th className="text-center p-3 font-semibold border-b text-blue-900">Qty</th>
                      <th className="text-right p-3 font-semibold border-b text-blue-900">Price</th>
                      <th className="text-right p-3 font-semibold border-b text-blue-900">Tax %</th>
                      <th className="text-right p-3 font-semibold border-b text-blue-900">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(bill.items || []).map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50 border-b">
                        <td className="p-3">{item.name}</td>
                        <td className="p-3 text-center">{item.qty}</td>
                        <td className="p-3 text-right">₹{Number(item.price).toFixed(2)}</td>
                        <td className="p-3 text-center">{item.tax_rate || bill.tax_rate || 0}%</td>
                        <td className="p-3 text-right font-medium">₹{(Number(item.qty) * Number(item.price)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Summary */}
                <div className="mt-4 space-y-2 ml-auto max-w-xs">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₹{(bill.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {bill.discount_amount && bill.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount:</span>
                      <span className="font-medium">-₹{bill.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax ({bill.tax_rate || 0}%):</span>
                    <span className="font-medium">₹{(bill.tax_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t-2 border-blue-900">
                    <span className="text-lg font-bold text-blue-900">Total:</span>
                    <span className="text-xl font-bold text-blue-900">₹{bill.total.toFixed(2)}</span>
                  </div>
                </div>
                {/* Payment Terms & Notes */}
                {(bill.payment_terms || bill.notes) && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                    {bill.payment_terms && (
                      <div>
                        <span className="font-semibold text-gray-700">Payment Terms:</span>
                        <span className="ml-2 text-gray-600">{bill.payment_terms}</span>
                      </div>
                    )}
                    {bill.notes && (
                      <div>
                        <span className="font-semibold text-gray-700">Notes:</span>
                        <span className="ml-2 text-gray-600">{bill.notes}</span>
                      </div>
                    )}
                  </div>
                )}
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
              businessAddress={profile.business_address || ""}
              gstNumber={profile.gst_number || ""}
              panNumber={profile.pan_number || ""}
            />
          </div>
        )}
      </div>
    </div>
  );
}
