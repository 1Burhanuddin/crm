
import React, { useState, useEffect } from "react";
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
  Eye
} from "lucide-react";
import { AddQuotationModal } from "./AddQuotationModal";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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

  useEffect(() => {
    if (user) {
      fetchQuotations();
      fetchCustomers();
      fetchProducts();
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

  const QuotationCard = ({ quotation }: { quotation: Quotation }) => {
    const customerName = getCustomerName(quotation.customer_id);
    const customerPhone = getCustomerPhone(quotation.customer_id);
    const productName = getProductName(quotation.product_id);
    const quotationTotal = calculateQuotationTotal(quotation);

    return (
      <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group" onClick={() => setModalQuotation(quotation)}>
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
      <div className="flex flex-col sm:flex-row gap-4 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by customer, phone, product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 text-base font-semibold hover:bg-blue-700 transition-all shadow-sm">
          <Plus className="h-4 w-4" />
          Add Quotation
        </Button>
      </div>

      {/* Quotations Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            Pending ({getQuotationsByStatus("pending").length})
          </TabsTrigger>
          <TabsTrigger value="converted">
            Converted ({quotations.filter(q => q.converted_to_order).length})
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
                <QuotationCard key={quotation.id} quotation={quotation} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="converted" className="mt-6">
          {quotations.filter(q => q.converted_to_order).length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No converted quotations
              </h3>
              <p className="text-gray-500">
                Quotations converted to orders will appear here
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {quotations.filter(q => q.converted_to_order).map((quotation) => (
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
        />
      )}
    </div>
  );
}

function QuotationDetailsModal({ quotation, customers, products, onClose }: {
  quotation: Quotation;
  customers: Customer[];
  products: Product[];
  onClose: () => void;
}) {
  const customer = customers.find(c => c.id === quotation.customer_id);
  const product = products.find(p => p.id === quotation.product_id);
  const quotationTotal = product ? product.price * quotation.qty : 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="w-full max-w-lg rounded-2xl p-5 shadow-2xl">
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

        <div className="mt-4 flex justify-center">
          <Button
            onClick={() => {
              // Navigate to quotation details page
              window.open(`/quotations/${quotation.id}`, '_blank');
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
