import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Filter,
  Eye,
  Edit,
  Trash2,
  FileText,
  PhoneCall,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { AddOrderModal } from "./AddOrderModal";
import { EditOrderModal } from "./EditOrderModal";
import { OrderActionsMenu } from "./OrderActionsMenu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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

interface OrderProduct {
  productId: string;
  qty: number;
}

interface Order {
  id: string;
  customer_id: string;
  job_date: string;
  status: string;
  site_address?: string | null;
  remarks?: string | null;
  assigned_to?: string | null;
  advance_amount: number;
  products: OrderProduct[];
  created_at: string;
  updated_at: string;
  user_id: string;
  photo_url?: string | null;
}

export function OrderList() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchCustomers();
      fetchProducts();
    }
  }, [user]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Order interface  
      const transformedOrders: Order[] = (data || []).map(order => ({
        ...order,
        products: Array.isArray(order.products) 
          ? (order.products as any[]).map((p: any) => ({
              productId: p.productId || p.product_id,
              qty: p.qty
            }))
          : []
      }));
      
      setOrders(transformedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
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

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => {
        const customer = customers.find(c => c.id === order.customer_id);
        return (
          customer?.name.toLowerCase().includes(term) ||
          customer?.phone.includes(term) ||
          order.site_address?.toLowerCase().includes(term) ||
          order.assigned_to?.toLowerCase().includes(term) ||
          order.remarks?.toLowerCase().includes(term)
        );
      });
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || "Unknown Customer";
  };

  const getCustomerPhone = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.phone || "";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "in_progress":
        return <AlertCircle className="h-3 w-3" />;
      case "delivered":
        return <CheckCircle className="h-3 w-3" />;
      case "cancelled":
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const calculateOrderTotal = (orderProducts: OrderProduct[]) => {
    return orderProducts.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product?.price || 0) * item.qty;
    }, 0);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };

  const handleDeleteOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowDeleteDialog(true);
  };

  const confirmDeleteOrder = async () => {
    if (!selectedOrder) return;

    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", selectedOrder.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order deleted successfully",
      });

      fetchOrders();
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setSelectedOrder(null);
    }
  };

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.status === status);
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const customerName = getCustomerName(order.customer_id);
    const customerPhone = getCustomerPhone(order.customer_id);
    const orderTotal = calculateOrderTotal(order.products);

    const handleStatusChange = async (newStatus: string) => {
      try {
        const { error } = await supabase
          .from("orders")
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq("id", order.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: `Order marked as ${newStatus}`,
        });

        fetchOrders();
      } catch (error) {
        console.error("Error updating order status:", error);
        toast({
          title: "Error",
          description: "Failed to update order status",
          variant: "destructive",
        });
      }
    };

    const getProductName = (productId: string) => {
      const product = products.find(p => p.id === productId);
      return product?.name || "Unknown Product";
    };

    const getProductUnit = (productId: string) => {
      const product = products.find(p => p.id === productId);
      return product?.unit || "unit";
    };

    const getProductPrice = (productId: string) => {
      const product = products.find(p => p.id === productId);
      return product?.price || 0;
    };

    return (
      <Card className="hover:shadow-md transition-all duration-200">
        <CardHeader 
          className="pb-3 cursor-pointer" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                {customerName}
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(order.job_date), "MMM dd, yyyy")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <PhoneCall className="h-4 w-4" />
                  <span>{customerPhone}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Select value={order.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue>
                    <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                      {getStatusIcon(order.status)}
                      {order.status === "pending" ? "Pending" : "Completed"}
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      Pending
                    </div>
                  </SelectItem>
                  <SelectItem value="delivered">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3" />
                      Completed
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <OrderActionsMenu
                onEdit={() => handleEditOrder(order)}
                onDelete={() => handleDeleteOrder(order)}
                canMarkDelivered={order.status !== "delivered"}
                onMarkDelivered={() => handleStatusChange("delivered")}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Products Summary */}
            <div className="flex items-center justify-between text-sm pt-2 border-t">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">{order.products.length} items</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-green-600 font-medium">
                  <DollarSign className="h-4 w-4" />
                  <span>₹{orderTotal.toLocaleString()}</span>
                </div>
                {order.advance_amount > 0 && (
                  <div className="text-xs text-gray-500">
                    Advance: ₹{order.advance_amount}
                  </div>
                )}
              </div>
            </div>

            {/* Expandable Product Details */}
            {isExpanded && (
              <div className="animate-accordion-down space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 mb-2">Product Details</h4>
                  <div className="space-y-2">
                    {order.products.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">
                            {getProductName(item.productId)}
                          </span>
                          <span className="text-gray-500 ml-2">
                            (Qty: {item.qty} {getProductUnit(item.productId)})
                          </span>
                        </div>
                        <span className="text-gray-700 font-medium">
                          ₹{(getProductPrice(item.productId) * item.qty).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.site_address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{order.site_address}</span>
                  </div>
                )}

                {order.assigned_to && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">Assigned to: {order.assigned_to}</span>
                  </div>
                )}

                {order.remarks && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-md">
                    <strong>Remarks:</strong> {order.remarks}
                  </div>
                )}
              </div>
            )}
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
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage your customer orders</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Order
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by customer, phone, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="delivered">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            All ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({getOrdersByStatus("pending").length})
          </TabsTrigger>
          <TabsTrigger value="delivered">
            Completed ({getOrdersByStatus("delivered").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "Get started by creating your first order"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Order
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>

        {["pending", "delivered"].map((status) => (
          <TabsContent key={status} value={status} className="mt-6">
            {getOrdersByStatus(status).length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {status === "delivered" ? "completed" : status} orders
                </h3>
                <p className="text-gray-500">
                  Orders with {status === "delivered" ? "completed" : status} status will appear here
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {getOrdersByStatus(status).map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Modals */}
      <AddOrderModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onAdd={() => fetchOrders()}
        customers={customers}
        products={products}
        refreshCustomers={fetchCustomers}
      />

      {selectedOrder && (
        <EditOrderModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
          onOrderUpdated={fetchOrders}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteOrder} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
