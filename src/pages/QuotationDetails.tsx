import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useSession } from "@/hooks/useSession";
import { format } from "date-fns";
import { DollarSign, Calendar, Phone, User, Package, MapPin, FileText } from "lucide-react";

export default function QuotationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const [collectionForm, setCollectionForm] = useState({
    amount: "",
    remarks: "",
  });
  const [isCollecting, setIsCollecting] = useState(false);

  useEffect(() => {
    async function fetchQuotation() {
      setLoading(true);
      const { data, error } = await supabase
        .from("quotations")
        .select("*, customers(name, phone), products(*)")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        setError("Quotation not found");
        setQuotation(null);
      } else {
        setQuotation(data);
        setError(null);
        // Fetch collections for this quotation (if it has been converted to order)
        if (data.converted_to_order) {
          fetchCollections(data.customer_id);
        }
      }
      setLoading(false);
    }
    if (id) fetchQuotation();
  }, [id]);

  const fetchCollections = async (customerId: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", user.id)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });
      
      if (!error && data) {
        setCollections(data);
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
    }
  };

  const calculateQuotationTotal = () => {
    if (!quotation?.products || !quotation.qty) return 0;
    return quotation.products.price * quotation.qty;
  };

  const calculateTotalCollected = () => {
    return collections.reduce((sum, collection) => sum + Number(collection.amount), 0);
  };

  const calculatePendingAmount = () => {
    const total = calculateQuotationTotal();
    const collected = calculateTotalCollected();
    return Math.max(0, total - collected);
  };

  const handleCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !quotation || !collectionForm.amount) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    const pendingAmount = calculatePendingAmount();
    const collectionAmount = Number(collectionForm.amount);

    if (collectionAmount > pendingAmount) {
      toast({
        title: "Error",
        description: `Collection amount cannot exceed pending amount of ₹${pendingAmount}`,
        variant: "destructive",
      });
      return;
    }

    setIsCollecting(true);
    try {
      const { error } = await supabase
        .from("collections")
        .insert({
          user_id: user.id,
          customer_id: quotation.customer_id,
          amount: collectionAmount,
          remarks: collectionForm.remarks,
          collection_date: format(new Date(), "yyyy-MM-dd"),
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Collection added successfully",
      });

      // Reset form and refresh collections
      setCollectionForm({ amount: "", remarks: "" });
      fetchCollections(quotation.customer_id);
    } catch (error) {
      console.error("Error adding collection:", error);
      toast({
        title: "Error",
        description: "Failed to add collection",
        variant: "destructive",
      });
    } finally {
      setIsCollecting(false);
    }
  };

  if (loading) return <AppLayout title="Quotation Details"><div className="p-8 text-center">Loading...</div></AppLayout>;
  if (error) return <AppLayout title="Quotation Details"><div className="p-8 text-center text-red-600">{error}</div></AppLayout>;
  if (!quotation) return null;

  const quotationTotal = calculateQuotationTotal();
  const totalCollected = calculateTotalCollected();
  const pendingAmount = calculatePendingAmount();

  return (
    <AppLayout title="Quotation Details">
      <div className="p-4 max-w-4xl mx-auto">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">Back</Button>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quotation Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Quotation #{quotation.id.slice(0, 8).toUpperCase()}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Customer</div>
                      <div className="font-medium">{quotation.customers?.name || "Unknown Customer"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Phone</div>
                      <div className="font-medium">{quotation.customers?.phone || "-"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Job Date</div>
                      <div className="font-medium">{format(new Date(quotation.job_date), "MMM dd, yyyy")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">Status</div>
                      <div className={`font-medium capitalize ${
                        quotation.status === 'approved' ? 'text-green-600' :
                        quotation.status === 'rejected' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {quotation.status}
                      </div>
                    </div>
                  </div>
                </div>

                {quotation.site_address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                    <div>
                      <div className="text-sm text-gray-500">Site Address</div>
                      <div className="font-medium">{quotation.site_address}</div>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Product Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{quotation.products?.name || "Unknown Product"}</span>
                      <span className="text-sm text-gray-600">Qty: {quotation.qty} {quotation.products?.unit || "units"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Unit Price: ₹{quotation.products?.price || 0}</span>
                      <span className="font-bold text-lg">₹{quotationTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {quotation.remarks && (
                  <div className="border-t pt-4">
                    <div className="text-sm text-gray-500">Remarks</div>
                    <div className="font-medium">{quotation.remarks}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Collections Panel - Only show for approved quotations that have been converted to orders */}
          <div className="lg:col-span-1">
            {quotation.status === 'approved' && quotation.converted_to_order ? (
              <Tabs defaultValue="collect" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="collect">Collect</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="collect">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Payment Collection</CardTitle>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Amount:</span>
                          <span className="font-bold">₹{quotationTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Collected:</span>
                          <span className="text-green-600">₹{totalCollected.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span>Pending:</span>
                          <span className="font-bold text-red-600">₹{pendingAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardHeader>
                    {pendingAmount > 0 && (
                      <CardContent>
                        <form onSubmit={handleCollectionSubmit} className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Collection Amount</label>
                            <Input
                              type="number"
                              value={collectionForm.amount}
                              onChange={(e) => setCollectionForm(prev => ({ ...prev, amount: e.target.value }))}
                              placeholder="Enter amount"
                              max={pendingAmount}
                              required
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Remarks (Optional)</label>
                            <Textarea
                              value={collectionForm.remarks}
                              onChange={(e) => setCollectionForm(prev => ({ ...prev, remarks: e.target.value }))}
                              placeholder="Add remarks..."
                              rows={2}
                            />
                          </div>
                          <Button type="submit" disabled={isCollecting} className="w-full">
                            {isCollecting ? "Adding..." : "Add Collection"}
                          </Button>
                        </form>
                      </CardContent>
                    )}
                  </Card>
                </TabsContent>

                <TabsContent value="history">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Collection History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {collections.length === 0 ? (
                        <div className="text-center text-gray-500 py-4">
                          No collections yet
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {collections.map((collection) => (
                            <div key={collection.id} className="border-b pb-3 last:border-b-0">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-green-600" />
                                  <span className="font-medium">₹{Number(collection.amount).toLocaleString()}</span>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {format(new Date(collection.collected_at || collection.created_at), "MMM dd, yyyy")}
                                </span>
                              </div>
                              {collection.remarks && (
                                <div className="text-sm text-gray-600 mt-1">{collection.remarks}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Collections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-gray-500 py-4">
                    {quotation.status !== 'approved' ? (
                      "Collections available after quotation approval"
                    ) : !quotation.converted_to_order ? (
                      "Convert quotation to order to enable collections"
                    ) : (
                      "No collections available"
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}