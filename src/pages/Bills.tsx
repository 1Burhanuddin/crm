import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { BillCreateModal } from "@/components/BillCreateModal";
import { BillHtmlPreview } from "@/components/BillHtmlPreview";
import { AppLayout } from "@/components/AppLayout";
import html2pdf from "html2pdf.js";
import { ChevronDown, ChevronUp, Eye, Download, Share, Printer } from "lucide-react";

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
  const [previewBill, setPreviewBill] = useState<Bill | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [pdfBill, setPdfBill] = useState<Bill | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  const toggleCard = (billId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [billId]: !prev[billId]
    }));
  };

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

  // Generate PDF and notify for WhatsApp sharing
  async function handleWhatsAppShare(bill: Bill) {
    try {
      // Show loading toast
      toast({
        title: "Generating PDF...",
        description: "Please wait while we generate your invoice.",
      });

      // Generate PDF blob
      const blob = await pdf(
        <BillPdfDoc
          bill={bill}
          userName={profile.name || ""}
          shopName={profile.shop_name || ""}
        />
      ).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${bill.id.slice(0, 8)}.pdf`;
      
      // Trigger download
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);

      // Show success notification with instructions
      toast({
        title: "PDF Generated Successfully!",
        description: "The PDF has been downloaded. You can now share it via WhatsApp manually.",
        duration: 5000,
      });
    } catch (error) {
      console.error('PDF Generation Error:', error);  // Add error logging
      toast({
        title: "Error Generating PDF",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  }

  // Handle print preview
  const handlePrintPreview = (bill: Bill) => {
    setPreviewBill(bill);
  };

  // Handle download PDF
  const handleDownloadPdf = async (bill: Bill) => {
    try {
      toast({
        title: "Generating PDF...",
        description: "Please wait while we generate your invoice.",
      });
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
      toast({
        title: "PDF Downloaded Successfully!",
        duration: 3000,
      });
    } catch (error) {
      console.error('PDF Download Error:', error);
      toast({
        title: "Error Downloading PDF",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Bills</h1>
          <Button onClick={() => setShowCreate(true)}>Create Bill</Button>
        </div>

        {loading ? (
          <div className="text-center">Loading...</div>
        ) : bills.length === 0 ? (
          <div className="text-gray-400 text-center mt-10">No bills created yet.</div>
        ) : (
          <div className="space-y-4">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className="bg-white rounded-xl shadow-lg border hover:shadow-xl transition-all duration-200 relative overflow-hidden"
              >
                {/* Collapsed View */}
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => toggleCard(bill.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-blue-900">
                        {bill.customer_name}
                      </h3>
                      {bill.customer_phone && (
                        <p className="text-sm text-gray-600 mt-1">{bill.customer_phone}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xl font-bold text-blue-600">
                          ₹{bill.total}
                        </div>
                        <div className="text-sm text-gray-500">Bill #{bill.id.slice(0, 8)}</div>
                      </div>
                      <div className="text-gray-400">
                        {expandedCards[bill.id] ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bill Items Table */}
                <div className="px-4 pb-4">
                  <div className="overflow-x-auto">
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
                  </div>

                  {/* Expanded View - Only for Action Buttons */}
                  {expandedCards[bill.id] && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                          onClick={() => handlePrintPreview(bill)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 justify-center bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                          onClick={() => handleDownloadPdf(bill)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BillCreateModal
        open={showCreate}
        setOpen={setShowCreate}
        onBillCreated={fetchBills}
      />

      {/* Print Preview Modal */}
      {previewBill && (
        <div className="fixed inset-0 bg-white z-50">
          <div className="container mx-auto p-4">
            <div className="flex justify-between mb-4">
              <Button
                variant="outline"
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button
                variant="outline"
                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                onClick={() => setPreviewBill(null)}
              >
                Close Preview
              </Button>
            </div>
            <BillHtmlPreview
              bill={previewBill}
              userName={profile.name || ""}
              shopName={profile.shop_name || ""}
            />
          </div>
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
    </AppLayout>
  );
}
