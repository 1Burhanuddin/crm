import { useSession } from "@/hooks/useSession";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Quotation, Product, Customer } from "@/constants/types";
import { Plus, FileText, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { AddQuotationModal } from "./AddQuotationModal";
import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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

// Helper: fetch quotations for current user (to be implemented with SQL)
const fetchQuotations = async (user_id: string): Promise<Quotation[]> => {
  // TODO: Implement SQL query for quotations
  // const { data, error } = await supabase
  //   .from("quotations")
  //   .select("*")
  //   .eq("user_id", user_id)
  //   .order("created_at", { ascending: false });
  // if (error) throw error;
  // return data || [];
  
  // For now, return empty array until SQL is implemented
  return [];
};

export function QuotationList() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  // Modal state
  const [showAdd, setShowAdd] = useState(false);

  // Expanded quotation state
  const [expandedQuotationId, setExpandedQuotationId] = useState<string | null>(null);

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

  // Fetch quotations (empty for now until SQL is implemented)
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
      // TODO: Implement SQL insert for quotations
      // const { data, error } = await supabase
      //   .from("quotations")
      //   .insert([{ ...quotationData, user_id: user?.id }])
      //   .select()
      //   .single();
      // if (error) throw error;
      // return data;
      
      // For now, just log the data until SQL is implemented
      console.log("Adding quotation:", quotationData);
      return Promise.resolve();
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

  // Refresh customers function
  const refreshCustomers = () => {
    queryClient.invalidateQueries({ queryKey: ["customers", user?.id] });
  };

  // Handle quotation status updates
  const updateQuotationStatus = async (quotationId: string, status: "approved" | "rejected") => {
    // TODO: Implement SQL update for quotation status
    // const { error } = await supabase
    //   .from("quotations")
    //   .update({ status })
    //   .eq("id", quotationId);
    // if (error) throw error;
    
    // For now, just show a toast
    toast({
      title: "Status Updated",
      description: `Quotation ${status} successfully.`,
    });
  };

  // Convert quotation to order
  const convertToOrder = async (quotation: Quotation) => {
    // TODO: Implement conversion logic
    // This should create a new order from the quotation data
    // and potentially update the quotation status
    
    // For now, just show a toast
    toast({
      title: "Convert to Order",
      description: "This will convert the quotation to an order. (SQL implementation needed)",
    });
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
                </div>
              </div>
            </div>
          )}

          {/* Expanded view */}
          {isExpanded && (
            <div className="px-6 py-6 relative">
              <div className="flex items-center justify-between mb-2">
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
              </div>

              <div className="flex gap-2 mb-4 mt-2">
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  q.status === "pending" ? "bg-yellow-200 text-yellow-900" :
                  q.status === "approved" ? "bg-green-200 text-green-900" :
                  "bg-red-200 text-red-900"
                }`}>
                  {q.status === "pending" ? "Pending" : q.status === "approved" ? "Approved" : "Rejected"}
                </span>
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

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Preview quotation in HTML
                    toast({ title: "Preview", description: "HTML preview functionality to be implemented" });
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <FileText size={16} />
                  Preview
                </Button>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Generate PDF and share via WhatsApp
                    toast({ title: "Share PDF", description: "PDF generation and WhatsApp sharing to be implemented" });
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <FileText size={16} />
                  Share PDF
                </Button>

                {q.status === "pending" && (
                  <>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuotationStatus(q.id, "approved");
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Approve
                    </Button>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuotationStatus(q.id, "rejected");
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <XCircle size={16} />
                      Reject
                    </Button>
                  </>
                )}

                {q.status === "approved" && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      convertToOrder(q);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Convert to Order
                  </Button>
                )}
              </div>
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
    </div>
  );
}
