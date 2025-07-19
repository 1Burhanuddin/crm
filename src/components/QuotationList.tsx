
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Search, 
  Plus, 
  Calendar, 
  MapPin, 
  User, 
  DollarSign, 
  Package,
  PhoneCall,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronDown,
  FileText,
  Eye,
  Printer,
  Check,
  X,
  X as CloseIcon
} from "lucide-react";
import { AddQuotationModal } from "./AddQuotationModal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { QuotationHtmlPreview } from "./QuotationHtmlPreview";
import html2pdf from "html2pdf.js";

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
}

interface Quotation {
  id: string;
  customer_id: string;
  product_id: string;
  qty: number;
  job_date: string;
  status: string;
  site_address?: string | null;
  remarks?: string | null;
  assigned_to: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  converted_to_order: boolean;
}

export function QuotationList() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredQuotations, setFilteredQuotations] = useState<Quotation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalQuotation, setModalQuotation] = useState<Quotation | null>(null);
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null);
  const [profile, setProfile] = useState<{ name: string | null; shop_name: string | null }>({ name: null, shop_name: null });
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedQuotationForAction, setSelectedQuotationForAction] = useState<Quotation | null>(null);
  const [pdfQuotation, setPdfQuotation] = useState<Quotation | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchQuotations();
      fetchCustomers();
      fetchProducts();
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    filterQuotations();
  }, [quotations, searchTerm]);

  const fetchQuotations = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("quotations")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuotations(data || []);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      toast({ 
        title: "Error", 
        description: "Failed to fetch quotations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user?.id);

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user?.id);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, shop_name")
        .eq("id", user.id)
        .single();
      if (!error && data) {
        setProfile({ name: data.name, shop_name: data.shop_name });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const filterQuotations = () => {
    let filtered = [...quotations];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(quotation => {
        const customer = customers.find(c => c.id === quotation.customer_id);
        const product = products.find(p => p.id === quotation.product_id);
        return (
          customer?.name.toLowerCase().includes(term) ||
          customer?.phone.includes(term) ||
          product?.name.toLowerCase().includes(term) ||
          quotation.site_address?.toLowerCase().includes(term) ||
          quotation.assigned_to?.toLowerCase().includes(term) ||
          quotation.remarks?.toLowerCase().includes(term)
        );
      });
    }

    setFilteredQuotations(filtered);
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || "Unknown Customer";
  };

  const getCustomerPhone = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.phone || "";
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || "Unknown Product";
  };

  const getProductPrice = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.price || 0;
  };

  const calculateQuotationTotal = (quotation: Quotation) => {
    const productPrice = getProductPrice(quotation.product_id);
    return productPrice * quotation.qty;
  };

  const getQuotationsByStatus = (status: string) => {
    return quotations.filter(quotation => quotation.status === status);
  };

  // New component for pending quotations with approve/reject buttons  
  const PendingQuotationCard = ({ quotation }: { quotation: Quotation }) => {
    const customerName = getCustomerName(quotation.customer_id);
    const customerPhone = getCustomerPhone(quotation.customer_id);
    const productName = getProductName(quotation.product_id);
    const quotationTotal = calculateQuotationTotal(quotation);

    return (
      <Card className="hover:shadow-md transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                {customerName}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(quotation.job_date), "MMM dd, yyyy")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <PhoneCall className="h-4 w-4" />
                  <span>{customerPhone}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm pt-2 border-t mb-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">{productName}</span>
            </div>
            <div className="flex items-center gap-1 text-green-600 font-medium">
              <DollarSign className="h-4 w-4" />
              <span>₹{quotationTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-4">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 font-semibold py-3 text-base border-blue-200 hover:bg-blue-50 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                handlePreviewQuotation(quotation);
              }}
            >
              <Eye className="h-5 w-5 mr-2" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1 font-semibold py-3 text-base border-blue-200 hover:bg-blue-50 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                handlePrintQuotation(quotation);
              }}
            >
              <FileText className="h-5 w-5 mr-2" />
              Download
            </Button>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 font-semibold py-3 text-base border-blue-200 hover:bg-blue-50 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setModalQuotation(quotation);
              }}
            >
              <Eye className="h-5 w-5 mr-2" />
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const handleApproveQuotation = async (quotation: Quotation) => {
    try {
      const { error } = await supabase
        .from("quotations")
        .update({ status: "approved" })
        .eq("id", quotation.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Quotation approved successfully",
      });
      
      fetchQuotations();
      setShowApproveDialog(false);
      setSelectedQuotationForAction(null);
      setModalQuotation(null);
    } catch (error) {
      console.error("Error approving quotation:", error);
      toast({
        title: "Error",
        description: "Failed to approve quotation",
        variant: "destructive",
      });
    }
  };

  const handleRejectQuotation = async (quotation: Quotation) => {
    try {
      const { error } = await supabase
        .from("quotations")
        .update({ status: "rejected" })
        .eq("id", quotation.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Quotation rejected successfully",
      });
      
      fetchQuotations();
      setShowRejectDialog(false);
      setSelectedQuotationForAction(null);
      setModalQuotation(null);
    } catch (error) {
      console.error("Error rejecting quotation:", error);
      toast({
        title: "Error",
        description: "Failed to reject quotation",
        variant: "destructive",
      });
    }
  };

  const handlePreviewQuotation = (quotation: Quotation) => {
    setPreviewQuotation(quotation);
  };

  const handlePrintQuotation = async (quotation: Quotation) => {
    const customer = customers.find(c => c.id === quotation.customer_id);
    const product = products.find(p => p.id === quotation.product_id);
    if (!customer || !product) {
      toast({
        title: "Error",
        description: "Unable to find customer or product details",
        variant: "destructive",
      });
      return;
    }
    setPdfQuotation(quotation);
    setTimeout(async () => {
                        if (pdfRef.current) {
        await html2pdf()
                            .set({
                              margin: 0.5,
            filename: `Quotation_${quotation.id.slice(0, 8)}.pdf`,
                              html2canvas: { scale: 2 },
                              jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
                            })
                            .from(pdfRef.current)
                            .save();
        setPdfQuotation(null);
      }
    }, 200);
  };

  const QuotationCard = ({ quotation }: { quotation: Quotation }) => {
    const customerName = getCustomerName(quotation.customer_id);
    const customerPhone = getCustomerPhone(quotation.customer_id);
    const productName = getProductName(quotation.product_id);
    const quotationTotal = calculateQuotationTotal(quotation);
    const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);
    const [advanceAmount, setAdvanceAmount] = useState("");
    const [converting, setConverting] = useState(false);

    const handleConvertToOrder = async () => {
      setConverting(true);
      try {
        const product = products.find(p => p.id === quotation.product_id);
        if (!user || !product) return;
        const advance = advanceAmount === "" ? 0 : Number(advanceAmount);
        const { error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            customer_id: quotation.customer_id,
            job_date: quotation.job_date,
            status: "pending",
            site_address: quotation.site_address,
            remarks: quotation.remarks,
            assigned_to: quotation.assigned_to,
            advance_amount: advance,
            products: [{ productId: quotation.product_id, qty: quotation.qty }]
          });
        if (orderError) throw orderError;
        const { error: quotationError } = await supabase
          .from("quotations")
          .update({ converted_to_order: true })
          .eq("id", quotation.id);
        if (quotationError) throw quotationError;
        toast({ title: "Success", description: "Quotation converted to order successfully" });
        setShowAdvanceDialog(false);
        setAdvanceAmount("");
        fetchQuotations();
      } catch (error) {
        toast({ title: "Error", description: "Failed to convert quotation", variant: "destructive" });
      } finally {
        setConverting(false);
      }
    };

    return (
      <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                {customerName}
                <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-all duration-200 group-hover:animate-pulse" />
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(quotation.job_date), "MMM dd, yyyy")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <PhoneCall className="h-4 w-4" />
                  <span>{customerPhone}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">{productName}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-green-600 font-medium">
                <DollarSign className="h-4 w-4" />
                <span>₹{quotationTotal.toLocaleString()}</span>
              </div>
              {quotation.status === 'pending' && (
                <span className="ml-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">Pending</span>
              )}
              {quotation.converted_to_order && (
                <span className="ml-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">Converted</span>
              )}
            </div>
          </div>
          {/* Convert to Order button for approved quotations */}
          {quotation.status === 'approved' && !quotation.converted_to_order && (
            <div className="mt-4 flex flex-col gap-2">
              {!showAdvanceDialog && (
                  <Button
                  className="bg-green-600 text-white hover:bg-green-700 font-semibold"
                  onClick={() => setShowAdvanceDialog(true)}
                  disabled={converting}
                >
                  {converting ? "Converting..." : "Convert to Order"}
                  </Button>
              )}
              {showAdvanceDialog && (
                <div className="mt-2 p-3 rounded-2xl border bg-white flex flex-col gap-2">
                  <label className="font-medium text-sm mb-1 text-blue-900">Advance Amount (optional)</label>
                  <Input
                    type="number"
                    min={0}
                    value={advanceAmount}
                    onChange={e => {
                      // Only allow numbers and empty string
                      const val = e.target.value;
                      if (/^\d*$/.test(val)) setAdvanceAmount(val);
                    }}
                    placeholder="Enter advance amount"
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3 text-base font-medium text-gray-700 focus:ring-2 focus:ring-blue-200 h-14 min-h-[56px] w-full"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" className="bg-green-600 text-white w-1/2" onClick={handleConvertToOrder} disabled={converting}>
                      Confirm
                    </Button>
                    <Button size="sm" variant="outline" className="w-1/2" onClick={() => setShowAdvanceDialog(false)} disabled={converting}>
                      Cancel
                  </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading quotations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden w-full max-w-full">
      {/* Search and Add Quotation Button */}
      <div className="flex flex-row gap-3 mb-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by customer, phone, product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-full"
          />
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-full flex items-center gap-2 text-base font-semibold hover:bg-blue-700 transition-all shadow-sm flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Quotation
        </Button>
      </div>

      {/* Quotations Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="flex w-full bg-transparent border border-blue-200 rounded-full p-1 mb-4 h-12">
          <TabsTrigger value="pending" className="flex-1 rounded-full h-10 text-base font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-blue-700 data-[state=inactive]:bg-transparent transition-all">
            Pending ({getQuotationsByStatus("pending").length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex-1 rounded-full h-10 text-base font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-blue-700 data-[state=inactive]:bg-transparent transition-all">
            Approved ({getQuotationsByStatus("approved").length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex-1 rounded-full h-10 text-base font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-blue-700 data-[state=inactive]:bg-transparent transition-all">
            Rejected ({getQuotationsByStatus("rejected").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {getQuotationsByStatus("pending").length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No pending quotations
              </h3>
              <p className="text-gray-500">
                Quotations with pending status will appear here
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {getQuotationsByStatus("pending").map((quotation) => (
                <PendingQuotationCard key={quotation.id} quotation={quotation} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          {getQuotationsByStatus("approved").length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No approved quotations
              </h3>
              <p className="text-gray-500">
                Approved quotations will appear here
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {getQuotationsByStatus("approved").map((quotation) => (
                <QuotationCard key={quotation.id} quotation={quotation} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {getQuotationsByStatus("rejected").length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No rejected quotations
              </h3>
              <p className="text-gray-500">
                Rejected quotations will appear here
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {getQuotationsByStatus("rejected").map((quotation) => (
                <QuotationCard key={quotation.id} quotation={quotation} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Modal */}
      <AddQuotationModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onAdd={() => fetchQuotations()}
        customers={customers}
        products={products}
        refreshCustomers={fetchCustomers}
      />

      {/* Quotation Details Modal */}
      {modalQuotation && (
        <QuotationDetailsModal
          quotation={modalQuotation}
          customers={customers}
          products={products}
          onClose={() => setModalQuotation(null)}
          onApprove={(quotation) => {
            setSelectedQuotationForAction(quotation);
            setShowApproveDialog(true);
          }}
          onReject={(quotation) => {
            setSelectedQuotationForAction(quotation);
            setShowRejectDialog(true);
          }}
        />
      )}

      {/* Preview Modal */}
      {previewQuotation && (
        <Dialog open onOpenChange={() => setPreviewQuotation(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Quotation Preview</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handlePrintQuotation(previewQuotation)}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
            {(() => {
              const customer = customers.find(c => c.id === previewQuotation.customer_id);
              const product = products.find(p => p.id === previewQuotation.product_id);
              if (customer && product) {
                return (
                  <QuotationHtmlPreview
                    quotation={previewQuotation}
                    customer={customer}
                    product={product}
                    userName={profile.name || ""}
                    shopName={profile.shop_name || ""}
                  />
                );
              }
              return <div>Unable to load quotation details</div>;
            })()}
          </DialogContent>
        </Dialog>
      )}

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Quotation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this quotation? This action will mark the quotation as approved and allow it to be converted to an order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedQuotationForAction && handleApproveQuotation(selectedQuotationForAction)}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Quotation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this quotation? This action will mark the quotation as rejected and it cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedQuotationForAction && handleRejectQuotation(selectedQuotationForAction)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {pdfQuotation && (() => {
          const customer = customers.find(c => c.id === pdfQuotation.customer_id);
          const product = products.find(p => p.id === pdfQuotation.product_id);
          if (!customer || !product) return null;
          return (
            <div ref={pdfRef}>
              <QuotationHtmlPreview
                quotation={pdfQuotation}
                customer={customer}
                product={product}
                userName={profile.name || ""}
                shopName={profile.shop_name || "Shop Name"}
              />
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function QuotationDetailsModal({ quotation, customers, products, onClose, onApprove, onReject }: {
  quotation: Quotation;
  customers: Customer[];
  products: Product[];
  onClose: () => void;
  onApprove: (quotation: Quotation) => void;
  onReject: (quotation: Quotation) => void;
}) {
  const { user } = useSession();
  const [converting, setConverting] = useState(false);
  const customer = customers.find(c => c.id === quotation.customer_id);
  const product = products.find(p => p.id === quotation.product_id);
  const quotationTotal = product ? product.price * quotation.qty : 0;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  const handleConvertToOrder = async () => {
    if (!user || !product) return;
    
    setConverting(true);
    try {
      // Create order from quotation
      const { error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          customer_id: quotation.customer_id,
          job_date: quotation.job_date,
          status: "pending",
          site_address: quotation.site_address,
          remarks: quotation.remarks,
          assigned_to: quotation.assigned_to,
          advance_amount: 0,
          products: [{
            productId: quotation.product_id,
            qty: quotation.qty
          }]
        });

      if (orderError) throw orderError;

      // Mark quotation as converted
      const { error: quotationError } = await supabase
        .from("quotations")
        .update({ converted_to_order: true })
        .eq("id", quotation.id);

      if (quotationError) throw quotationError;

      toast({
        title: "Success",
        description: "Quotation converted to order successfully",
      });

      onClose();
      // Refresh the quotations list
      window.location.reload();
    } catch (error) {
      console.error("Error converting quotation:", error);
      toast({
        title: "Error",
        description: "Failed to convert quotation to order",
        variant: "destructive",
      });
    } finally {
      setConverting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className={`w-full ${isMobile ? 'max-w-sm mx-auto min-h-[40vh] rounded-2xl p-5 shadow-2xl' : 'max-w-lg'}`}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <CloseIcon className="h-6 w-6 text-gray-400" />
        </button>
        <div className="mb-4 break-words">
          <h2 className="text-xl font-bold mb-1 break-words">{customer?.name || "Unknown Customer"}</h2>
          <div className="text-sm text-gray-600 mb-2 break-words">{quotation.job_date} | {customer?.phone}</div>
          <div className="text-xs text-gray-500 mb-2 break-words">Quotation ID: {quotation.id}</div>
        </div>
        
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Product Details</h4>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">{product?.name || "Unknown Product"}</span>
              <span className="text-sm text-gray-600">Qty: {quotation.qty} {product?.unit || "units"}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-600">Unit Price: ₹{product?.price || 0}</span>
              <span className="font-medium">₹{quotationTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mb-4 flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>₹{quotationTotal.toLocaleString()}</span>
        </div>

        {quotation.assigned_to && (
          <div className="mb-2 text-sm text-gray-700 break-words">
            <span className="font-medium">Assigned to:</span> {quotation.assigned_to}
          </div>
        )}

        {quotation.site_address && (
          <div className="mb-2 text-sm text-gray-700 break-words">
            <span className="font-medium">Site:</span> {quotation.site_address}
          </div>
        )}

        {quotation.remarks && (
          <div className="mb-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-md break-words">
            <span className="font-medium">Remarks:</span> {quotation.remarks}
          </div>
        )}

        <div className="mt-4 flex justify-center gap-2">
          {quotation.status === "approved" && !quotation.converted_to_order && (
            <Button
              onClick={handleConvertToOrder}
              disabled={converting}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700"
            >
              {converting ? "Converting..." : "Convert to Order"}
            </Button>
            )}
          </div>

        {quotation.status === "pending" && (
          <div className="mt-4 flex gap-3">
            <Button 
              onClick={() => onApprove(quotation)}
              className="flex-1 bg-green-600 text-white hover:bg-green-700 font-semibold rounded-full py-3 text-base"
              size="lg"
            >
              <Check className="h-5 w-5 mr-2" />
              Approve
            </Button>
            <Button
              onClick={() => onReject(quotation)}
              className="flex-1 bg-red-600 text-white hover:bg-red-700 font-semibold rounded-full py-3 text-base"
              size="lg"
            >
              <X className="h-5 w-5 mr-2" />
              Reject
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
