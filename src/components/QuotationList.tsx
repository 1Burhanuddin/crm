import { useSession } from "@/hooks/useSession";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Quotation, Product, Customer } from "@/constants/types";
import { Plus, FileText, CheckCircle, XCircle, Share2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { AddQuotationModal } from "./AddQuotationModal";
import { QuotationHtmlPreview } from "./QuotationHtmlPreview";
import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import html2pdf from "html2pdf.js";

// Helper: fetch customers for current user
const fetchCustomers = async (user_id: string): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((c) => ({ id: c.id, name: c.name, phone: c.phone }));
};

// Helper: fetch products for current user
const fetchProducts = async (user_id?: string): Promise<Product[]> => {
  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (user_id) {
    query = query.eq("user_id", user_id);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Product[];
};

// Helper: fetch quotations for current user
const fetchQuotations = async (user_id: string): Promise<Quotation[]> => {
  const { data, error } = await supabase
    .from("quotations")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((q) => ({
    id: q.id,
    customerId: q.customer_id,
    productId: q.product_id,
    qty: q.qty,
    status: q.status as "pending" | "approved" | "rejected",
    jobDate: q.job_date,
    assignedTo: q.assigned_to,
    siteAddress: q.site_address || "",
    remarks: q.remarks || "",
    validUntil: q.valid_until || "",
    terms: q.terms || "",
    convertedToOrder: q.converted_to_order || false,
  }));
};

export function QuotationList() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  // Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [advanceAmount, setAdvanceAmount] = useState("");

  // Expanded quotation state
  const [expandedQuotationId, setExpandedQuotationId] = useState<string | null>(null);

  // PDF state
  const [pdfQuotation, setPdfQuotation] = useState<Quotation | null>(null);
  const [pdfCustomer, setPdfCustomer] = useState<Customer | null>(null);
  const [pdfProduct, setPdfProduct] = useState<Product | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  // Profile state for real shop name
  const [profile, setProfile] = useState<{ shop_name: string | null } | null>(null);

  useEffect(() => {
    if (user?.id) {
      supabase
        .from("profiles")
        .select("shop_name")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setProfile(data);
        });
    }
  }, [user?.id]);

  // Fetch all required data (quotations, customers, products)
  const {
    data: customers = [],
    isLoading: loadingCustomers,
    error: customerError,
  } = useQuery({
    queryKey: ["customers", user?.id],
    queryFn: () => fetchCustomers(user?.id ?? ""),
    enabled: !!user?.id,
  });

  const {
    data: products = [],
    isLoading: loadingProducts,
    error: productError,
  } = useQuery({
    queryKey: ["products", user?.id],
    queryFn: () => fetchProducts(user?.id ?? ""),
    enabled: !!user?.id,
  });

  // Fetch quotations
  const {
    data: quotations = [],
    isLoading: loadingQuotations,
    error: quotationError,
  } = useQuery({
    queryKey: ["quotations", user?.id],
    queryFn: () => fetchQuotations(user?.id ?? ""),
    enabled: !!user?.id,
  });

  // Add new quotation
  const addQuotationMutation = useMutation({
    mutationFn: async (quotationData: Omit<Quotation, 'id'>) => {
      const { data, error } = await supabase
        .from("quotations")
        .insert([{
          user_id: user?.id,
          customer_id: quotationData.customerId,
          product_id: quotationData.productId,
          qty: quotationData.qty,
          status: quotationData.status,
          job_date: quotationData.jobDate,
          assigned_to: quotationData.assignedTo,
          site_address: quotationData.siteAddress || null,
          remarks: quotationData.remarks || null,
          valid_until: quotationData.validUntil || null,
          terms: quotationData.terms || null,
          converted_to_order: false,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations", user?.id] });
      toast({ title: "Quotation Added", description: "New quotation has been added successfully." });
      setShowAdd(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to add quotation", 
        variant: "destructive" 
      });
    }
  });

  // Update quotation status mutation
  const updateQuotationStatusMutation = useMutation({
    mutationFn: async ({ quotationId, status }: { quotationId: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase
        .from("quotations")
        .update({ status })
        .eq("id", quotationId)
        .eq("user_id", user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations", user?.id] });
      toast({
        title: "Status Updated",
        description: "Quotation status updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update quotation status",
        variant: "destructive"
      });
    }
  });

  // Convert quotation to order mutation
  const convertToOrderMutation = useMutation({
    mutationFn: async ({ quotation, advanceAmount }: { quotation: Quotation; advanceAmount: number }) => {
      const productDetails = products.find(p => p.id === quotation.productId);
      const productPrice = productDetails ? productDetails.price : 0; // Default to 0 if product not found

      if (!productDetails) {
        // This case should ideally not happen if data is consistent
        toast({
          title: "Error",
          description: "Product details not found for the quotation. Cannot convert to order.",
          variant: "destructive",
        });
        throw new Error("Product details not found for the quotation.");
      }

      // Create the order
      const { error: orderError } = await supabase
        .from("orders")
        .insert([{
          user_id: user?.id,
          customer_id: quotation.customerId,
          products: [{
            product_id: quotation.productId,
            qty: quotation.qty,
            price: productPrice // Include the price
          }],
          job_date: quotation.jobDate,
          assigned_to: quotation.assignedTo,
          site_address: quotation.siteAddress || null,
          status: "pending",
          advance_amount: advanceAmount,
        }]);

      if (orderError) throw orderError;

      // Update quotation to mark as converted
      const { error: quotationError } = await supabase
        .from("quotations")
        .update({ 
          status: "approved",
          converted_to_order: true 
        })
        .eq("id", quotation.id)
        .eq("user_id", user?.id);

      if (quotationError) throw quotationError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["orders", user?.id] });
      toast({
        title: "Order Created",
        description: "Quotation has been converted to an order successfully.",
      });
      setShowAdvanceModal(false);
      setSelectedQuotation(null);
      setAdvanceAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to convert quotation to order",
        variant: "destructive"
      });
    }
  });

  // Refresh customers function
  const refreshCustomers = () => {
    queryClient.invalidateQueries({ queryKey: ["customers", user?.id] });
  };

  // Handle quotation status updates
  const updateQuotationStatus = async (quotationId: string, status: "approved" | "rejected") => {
    updateQuotationStatusMutation.mutate({ quotationId, status });
  };

  // Handle convert to order with advance amount
  const handleConvertToOrder = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setShowAdvanceModal(true);
  };

  // Confirm convert to order
  const confirmConvertToOrder = () => {
    if (!selectedQuotation) return;
    
    const advance = parseFloat(advanceAmount) || 0;
    const product = products.find((p) => p.id === selectedQuotation.productId);
    const total = product ? product.price * selectedQuotation.qty : 0;
    
    if (advance > total) {
      toast({
        title: "Invalid Amount",
        description: "Advance amount cannot exceed total order amount.",
        variant: "destructive"
      });
      return;
    }

    convertToOrderMutation.mutate({ quotation: selectedQuotation, advanceAmount: advance });
  };

  // Helper functions
  function customerName(id: string) {
    const customer = customers.find((c) => c.id === id);
    return customer ? customer.name : "Unknown Customer";
  }

  function productName(id: string) {
    const product = products.find((p) => p.id === id);
    return product ? product.name : "Unknown Product";
  }

  function handleAddQuotation(quotationData: Omit<Quotation, 'id'>) {
    addQuotationMutation.mutate(quotationData);
  }

  // Filter quotations by status
  const pendingQuotations = quotations.filter(q => q.status === "pending");
  const approvedQuotations = quotations.filter(q => q.status === "approved");
  const rejectedQuotations = quotations.filter(q => q.status === "rejected");

  // Show loading and error state
  if (loadingCustomers || loadingProducts || loadingQuotations) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-blue-900/70 flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
          <span>Loading quotations…</span>
        </div>
      </div>
    );
  }

  if (customerError || productError || quotationError) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-red-600 flex flex-col items-center gap-2">
          <span className="text-lg">⚠️ Error loading data</span>
        </div>
      </div>
    );
  }

  // Helper to render a single quotation card
  function renderQuotationCard(q: Quotation) {
    const missingCustomer = !customers.find((c) => c.id === q.customerId);
    const missingProduct = !products.find((p) => p.id === q.productId);
    const cardError =
      missingCustomer || missingProduct
        ? "bg-yellow-50 border-yellow-300"
        : "bg-white";
    const isExpanded = expandedQuotationId === q.id;
    const product = products.find((p) => p.id === q.productId);
    const total = product ? product.price * q.qty : 0;

    return (
      <li
        key={q.id}
        className={`mb-6 ${cardError} rounded-xl px-0 py-0 shadow-lg border hover:shadow-xl transition-all duration-200 relative cursor-pointer`}
        onClick={() => setExpandedQuotationId(isExpanded ? null : q.id)}
      >
        {/* Card container */}
        <div className={`rounded-xl bg-white transition-all duration-200 ${isExpanded ? "shadow-2xl border-2 border-blue-200" : "border border-gray-100"} relative`}>
          {/* Collapsed view */}
          {!isExpanded && (
            <div className="px-4 py-3 flex flex-col gap-1 relative">
              <div className="font-bold text-blue-900 text-base truncate">
                {customerName(q.customerId)}
                {missingCustomer && (
                  <span className="ml-2 text-xs text-yellow-700">(not found)</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 truncate">
                  {productName(q.productId)}
                  {missingProduct && (
                    <span className="ml-2 text-xs text-yellow-700">(not found)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-50 text-blue-800 font-bold text-sm rounded-lg px-2 py-0.5">
                    ₹{total}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                    q.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                    q.status === "approved" ? "bg-green-100 text-green-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {q.status === "pending" ? "Pending" : q.status === "approved" ? "Approved" : "Rejected"}
                  </span>
                  {q.convertedToOrder && (
                    <span className="bg-purple-100 text-purple-700 text-xs font-semibold rounded-full px-2 py-0.5">
                      Converted
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Expanded view */}
          {isExpanded && (
            <div className="px-6 py-6 relative">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold text-blue-900 text-xl">
                    {customerName(q.customerId)}
                    {missingCustomer && (
                      <span className="ml-2 text-xs text-yellow-700">(not found)</span>
                    )}
                  </div>
                  <div className="text-base text-gray-700 mt-1">
                    {productName(q.productId)}
                    {missingProduct && (
                      <span className="ml-2 text-xs text-yellow-700">(not found)</span>
                    )}
                  </div>
                </div>
                {/* Top right icon buttons */}
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedQuotation(q);
                      setShowPreviewModal(true);
                    }}
                    className="rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700"
                    aria-label="Preview"
                  >
                    <FileText size={20} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async e => {
                      e.stopPropagation();
                      // Prepare data for PDF
                      const customer = customers.find(c => c.id === q.customerId);
                      const product = products.find(p => p.id === q.productId);
                      setPdfQuotation(q);
                      setPdfCustomer(customer || null);
                      setPdfProduct(product || null);
                      setTimeout(() => {
                        if (pdfRef.current) {
                          html2pdf()
                            .set({
                              margin: 0.5,
                              filename: `Quotation_${q.id.slice(0,8)}.pdf`,
                              html2canvas: { scale: 2 },
                              jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
                            })
                            .from(pdfRef.current)
                            .save();
                        }
                      }, 100);
                    }}
                    className="rounded-full bg-green-100 hover:bg-green-200 text-green-700"
                    aria-label="Share PDF"
                  >
                    <Share2 size={20} />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 mb-4 mt-2">
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  q.status === "pending" ? "bg-yellow-200 text-yellow-900" :
                  q.status === "approved" ? "bg-green-200 text-green-900" :
                  "bg-red-200 text-red-900"
                }`}>
                  {q.status === "pending" ? "Pending" : q.status === "approved" ? "Approved" : "Rejected"}
                </span>
                {q.convertedToOrder && (
                  <span className="bg-purple-200 text-purple-900 text-xs px-3 py-1 rounded-full font-semibold">
                    Converted to Order
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-2 bg-blue-50 rounded-lg p-4">
                  <span className="text-xs text-gray-500">Total</span>
                  <span className="text-blue-900 font-bold text-lg">₹{total}</span>
                </div>
                <div className="flex flex-col gap-2 bg-gray-50 rounded-lg p-4">
                  <span className="text-xs text-gray-500">Quantity</span>
                  <span className="text-gray-700 font-bold text-lg">{q.qty}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-sm bg-gray-100 px-3 py-1.5 rounded-lg font-medium">
                  Qty: {q.qty}
                </span>
                {q.assignedTo && (
                  <span className="text-sm text-gray-700 font-medium">
                    Assigned to: {q.assignedTo}
                  </span>
                )}
                <span className="text-gray-500 text-sm">Job: {q.jobDate}</span>
              </div>

              {q.siteAddress && (
                <div className="mb-4">
                  <span className="text-sm text-gray-500">Site Address:</span>
                  <div className="text-sm text-gray-700 mt-1">{q.siteAddress}</div>
                </div>
              )}

              {q.remarks && (
                <div className="mb-4">
                  <span className="text-sm text-gray-500">Remarks:</span>
                  <div className="text-sm text-gray-700 mt-1">{q.remarks}</div>
                </div>
              )}

              {/* Action buttons (bottom) */}
              {q.status === "pending" && (
                <div className="flex flex-col sm:flex-row gap-2 mt-6 w-full">
                  <Button
                    onClick={e => {
                      e.stopPropagation();
                      updateQuotationStatus(q.id, "approved");
                    }}
                    className="w-full sm:w-auto sm:flex-1 h-12 text-center bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2 text-base font-semibold"
                  >
                    <CheckCircle size={18} />
                    Approve
                  </Button>
                  <Button
                    onClick={e => {
                      e.stopPropagation();
                      updateQuotationStatus(q.id, "rejected");
                    }}
                    className="w-full sm:w-auto sm:flex-1 h-12 text-center bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2 text-base font-semibold"
                  >
                    <XCircle size={18} />
                    Reject
                  </Button>
                </div>
              )}
              {q.status === "approved" && !q.convertedToOrder && (
                <div className="flex mt-6">
                  <Button
                    onClick={e => {
                      e.stopPropagation();
                      handleConvertToOrder(q);
                    }}
                    className="w-full sm:w-auto sm:flex-1 h-12 text-center bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center gap-2 text-base font-semibold"
                  >
                    <Plus size={18} />
                    Convert to Order
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </li>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-blue-100/60 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-blue-100 p-2 rounded-lg">
            <FileText className="h-5 w-5 text-blue-700" />
          </div>
          <h2 className="text-xl font-semibold text-blue-900">Quotations</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
            <div className="text-2xl font-bold text-blue-900">{pendingQuotations.length}</div>
            <div className="text-gray-500 text-sm">Pending</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
            <div className="text-2xl font-bold text-blue-900">{approvedQuotations.length}</div>
            <div className="text-gray-500 text-sm">Approved</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
            <div className="text-2xl font-bold text-blue-900">{rejectedQuotations.length}</div>
            <div className="text-gray-500 text-sm">Rejected</div>
          </div>
        </div>
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 text-base font-semibold hover:bg-blue-700 transition-all shadow-sm"
        >
          <Plus size={20} />
          Add Quotation
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <ul>
            {pendingQuotations.map((q) => renderQuotationCard(q))}
          </ul>
          {pendingQuotations.length === 0 && (
            <div className="text-gray-500 mt-10 text-center">No pending quotations found.</div>
          )}
        </TabsContent>

        <TabsContent value="approved">
          <ul>
            {approvedQuotations.map((q) => renderQuotationCard(q))}
          </ul>
          {approvedQuotations.length === 0 && (
            <div className="text-gray-500 mt-10 text-center">No approved quotations found.</div>
          )}
        </TabsContent>

        <TabsContent value="rejected">
          <ul>
            {rejectedQuotations.map((q) => renderQuotationCard(q))}
          </ul>
          {rejectedQuotations.length === 0 && (
            <div className="text-gray-500 mt-10 text-center">No rejected quotations found.</div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddQuotationModal
        open={showAdd}
        onOpenChange={setShowAdd}
        onAdd={handleAddQuotation}
        customers={customers}
        products={products}
        refreshCustomers={refreshCustomers}
      />

      {/* Advance Amount Modal */}
      <Dialog open={showAdvanceModal} onOpenChange={setShowAdvanceModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Convert to Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {selectedQuotation && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Quotation Details:</div>
                <div className="text-sm">
                  <div><strong>Customer:</strong> {customerName(selectedQuotation.customerId)}</div>
                  <div><strong>Product:</strong> {productName(selectedQuotation.productId)}</div>
                  <div><strong>Quantity:</strong> {selectedQuotation.qty}</div>
                  <div><strong>Total:</strong> ₹{products.find(p => p.id === selectedQuotation.productId)?.price * selectedQuotation.qty || 0}</div>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Advance Amount (₹)</label>
              <Input
                type="number"
                placeholder="Enter advance amount"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                min="0"
                max={selectedQuotation ? (products.find(p => p.id === selectedQuotation.productId)?.price * selectedQuotation.qty || 0) : 0}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty or enter 0 for no advance payment
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={confirmConvertToOrder}
              disabled={convertToOrderMutation.isPending}
            >
              {convertToOrderMutation.isPending ? "Converting..." : "Convert to Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quotation Preview</DialogTitle>
          </DialogHeader>
          <div className="pt-4" id="printable-quotation">
            {selectedQuotation && (
              <QuotationHtmlPreview
                quotation={selectedQuotation}
                customer={customers.find(c => c.id === selectedQuotation.customerId) || { id: '', name: 'Unknown Customer', phone: '' }}
                product={products.find(p => p.id === selectedQuotation.productId) || { id: '', name: 'Unknown Product', price: 0, unit: '' }}
                userName={user?.user_metadata?.full_name || 'User'}
                shopName={profile?.shop_name || 'Company Name'}
              />
            )}
          </div>
          <DialogFooter className="pt-4 sm:justify-between">
            <Button 
              type="button" 
              onClick={() => {
                const printContents = document.getElementById('printable-quotation')?.innerHTML;
                const originalContents = document.body.innerHTML;
                if (printContents) {
                  document.body.innerHTML = printContents;
                  window.print();
                  document.body.innerHTML = originalContents;
                  window.location.reload(); // Reload to restore event listeners
                }
              }}
            >
              Print
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close Preview
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden PDF preview for html2pdf */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {pdfQuotation && pdfCustomer && pdfProduct && (
          <div ref={pdfRef}>
            <QuotationHtmlPreview
              quotation={pdfQuotation}
              customer={pdfCustomer}
              product={pdfProduct}
              userName={user?.user_metadata?.full_name || 'User'}
              shopName={profile?.shop_name || 'Company Name'}
            />
          </div>
        )}
      </div>
    </div>
  );
}
 