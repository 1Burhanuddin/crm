import React, { useState, useEffect, useRef } from "react";
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
  ChevronUp,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { AddOrderModal } from "./AddOrderModal";
import { EditOrderModal } from "./EditOrderModal";
import { OrderActionsMenu } from "./OrderActionsMenu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSwipeable } from "react-swipeable";
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
  const isMobile = useIsMobile();
  const [showSwipeHint, setShowSwipeHint] = useState(isMobile);
  const [swipeFeedback, setSwipeFeedback] = useState("");
  const [modalOrder, setModalOrder] = useState<Order | null>(null);
  const [completionAnimation, setCompletionAnimation] = useState<string | null>(null);

  const handleStatusChange = async (order: Order, newStatus: string) => {
    console.log('handleStatusChange called with:', newStatus, 'current:', order.status);
    
    if (newStatus === "delivered") {
      setCompletionAnimation(order.id);
    }
    
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

      if (newStatus === "delivered" && modalOrder?.id === order.id) {
        setTimeout(() => {
          setModalOrder(null);
        }, 800);
      }

      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
    
    if (isMobile) {
      setSwipeFeedback(newStatus === "delivered" ? "bg-green-100" : "bg-yellow-100");
    }
    
    setTimeout(() => {
      setCompletionAnimation(null);
    }, 1000);
  };

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

  useEffect(() => {
    if (isMobile) {
      setShowSwipeHint(true);
      const timer = setTimeout(() => setShowSwipeHint(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
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
    const customerName = getCustomerName(order.customer_id);
    const customerPhone = getCustomerPhone(order.customer_id);
    const orderTotal = calculateOrderTotal(order.products);
    const isCompleting = completionAnimation === order.id;

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

    const swipeHandlers = useSwipeable({
      onSwipedRight: (eventData) => {
        if (order.status !== "delivered") handleStatusChange(order, "delivered");
      },
      onSwipedLeft: (eventData) => {
        if (order.status !== "pending") handleStatusChange(order, "pending");
      },
      trackMouse: false,
      trackTouch: true,
      delta: 10,
      stopPropagation: false,
    });

    return (
      <div {...(isMobile ? swipeHandlers : {})} className={`relative transition-all duration-500 ${swipeFeedback} ${isCompleting ? 'animate-pulse bg-green-50 shadow-lg' : ''}`}
        style={{ touchAction: isMobile ? 'pan-y' : undefined }}>
        <Card className={`hover:shadow-md transition-all duration-200 cursor-pointer group ${isCompleting ? 'border-green-300 shadow-md' : ''}`} onClick={() => setModalOrder(order)}>
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
                    <span>{format(new Date(order.job_date), "MMM dd, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <PhoneCall className="h-4 w-4" />
                    <span>{customerPhone}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2" style={{ boxShadow: 'none', margin: 0, transform: 'none' }} onClick={e => e.stopPropagation()}>
                <OrderActionsMenu
                  onEdit={() => handleEditOrder(order)}
                  onDelete={() => handleDeleteOrder(order)}
                  canMarkDelivered={order.status !== "delivered"}
                  onMarkDelivered={() => handleStatusChange(order, "delivered")}
                />
              </div>
            </div>
          </CardHeader>

           <CardContent className="pt-0">
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
                {order.status === 'pending' && (
                  <span className="ml-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">Pending</span>
                )}
               </div>
             </div>
           </CardContent>
        </Card>
      </div>
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
    <div className="space-y-6 overflow-x-hidden w-full max-w-full">
      <div className="flex flex-col sm:flex-row gap-4 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by customer, phone, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 text-base font-semibold hover:bg-blue-700 transition-all shadow-sm">
          <Plus className="h-4 w-4" />
          Add Order
        </Button>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
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
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          {getOrdersByStatus("pending").length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No pending orders
              </h3>
              <p className="text-gray-500">
                Orders with pending status will appear here
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {getOrdersByStatus("pending").map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="delivered" className="mt-6">
          {getOrdersByStatus("delivered").length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No completed orders
              </h3>
              <p className="text-gray-500">
                Orders with completed status will appear here
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {getOrdersByStatus("delivered").map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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

      {modalOrder && (
        <OrderDetailsModal
          order={modalOrder}
          customers={customers}
          products={products}
          isMobile={isMobile}
          onClose={() => setModalOrder(null)}
          onStatusChange={(newStatus) => handleStatusChange(modalOrder, newStatus)}
        />
      )}
    </div>
  );
}

function SlideToConfirmButton({ status, onChangeStatus }: { status: string; onChangeStatus: (newStatus: string) => void }) {
  const isPending = status === "pending";
  const nextStatus = isPending ? "delivered" : "pending";
  const buttonText = isPending ? "Slide to Complete" : "Slide to Pending";
  const buttonClass = isPending
    ? "bg-green-600 text-white"
    : "bg-yellow-400 text-yellow-900";
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const [trackWidth, setTrackWidth] = useState(0);
  useEffect(() => {
    if (trackRef.current) {
      setTrackWidth(trackRef.current.offsetWidth);
    }
    const handleResize = () => {
      if (trackRef.current) setTrackWidth(trackRef.current.offsetWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const minDragToConfirm = trackWidth * 0.7;

  function onTouchStart(e: React.TouchEvent) {
    setDragging(true);
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!dragging) return;
    const touch = e.touches[0];
    const trackRect = trackRef.current?.getBoundingClientRect();
    if (!trackRect) return;
    let x = touch.clientX - trackRect.left;
    x = Math.max(0, Math.min(x, trackWidth - 48));
    setDragX(x);
  }
  function onTouchEnd() {
    setDragging(false);
    if (dragX >= minDragToConfirm - 48) {
      setConfirmed(true);
      setTimeout(() => {
        setDragX(0);
        setConfirmed(false);
        onChangeStatus(nextStatus);
      }, 500);
    } else {
      setDragX(0);
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div
        ref={trackRef}
        className={`relative w-full max-w-xs h-12 rounded-full overflow-hidden select-none ${buttonClass} transition-all duration-300`}
        style={{ background: isPending ? '#22c55e22' : '#fde047cc' }}
      >
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-200"
          style={{
            width: `${dragX + 48}px`,
            background: isPending ? '#22c55e' : '#fde047',
            opacity: 0.3,
            zIndex: 1,
          }}
        />
        <div
          className="absolute inset-0 flex items-center justify-center text-base font-semibold pointer-events-none transition-all duration-300"
          style={{ color: isPending ? '#22c55e' : '#b45309', opacity: confirmed ? 0.5 : 1 }}
        >
          {confirmed ? (isPending ? 'Completed!' : 'Marked Pending!') : buttonText}
        </div>
        <div
          className={`absolute top-1 left-1 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center z-10 active:scale-95 transition-all duration-200 border border-gray-200`}
          style={{ transform: `translateX(${dragX}px)` }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <ChevronRight className={`h-6 w-6 ${isPending ? 'text-green-600' : 'text-yellow-700'}`} />
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-1 text-center">Slide the handle to confirm</div>
    </div>
  );
}

function OrderDetailsModal({ order, customers, products, isMobile, onClose, onStatusChange }: {
  order: Order;
  customers: Customer[];
  products: Product[];
  isMobile: boolean;
  onClose: () => void;
  onStatusChange: (newStatus: string) => void;
}) {
  const getProductName = (productId: string) => products.find(p => p.id === productId)?.name || "Unknown Product";
  const getProductUnit = (productId: string) => products.find(p => p.id === productId)?.unit || "unit";
  const getProductPrice = (productId: string) => products.find(p => p.id === productId)?.price || 0;
  const customer = customers.find(c => c.id === order.customer_id);
  const orderTotal = order.products.reduce((total, item) => total + (getProductPrice(item.productId) * item.qty), 0);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className={`w-full ${isMobile ? 'max-w-sm mx-auto min-h-[40vh] rounded-2xl p-5 shadow-2xl' : 'max-w-lg'}`}
      >
        <div className="mb-4 break-words">
          <h2 className="text-xl font-bold mb-1 break-words">{customer?.name || "Unknown Customer"}</h2>
          <div className="text-sm text-gray-600 mb-2 break-words">{order.job_date} | {customer?.phone}</div>
          <div className="text-xs text-gray-500 mb-2 break-words">Order ID: {order.id}</div>
        </div>
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Products</h4>
          <ul className="space-y-2">
            {order.products.map((item, idx) => (
              <li key={idx} className="flex justify-between text-sm break-words">
                <span>{getProductName(item.productId)} (Qty: {item.qty} {getProductUnit(item.productId)})</span>
                <span>₹{(getProductPrice(item.productId) * item.qty).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mb-4 flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>₹{orderTotal.toLocaleString()}</span>
        </div>
        {order.advance_amount > 0 && (
          <div className="mb-2 text-sm text-gray-500">Advance: ₹{order.advance_amount}</div>
        )}
        {order.site_address && (
          <div className="mb-2 text-sm text-gray-700 break-words">Site: {order.site_address}</div>
        )}
        {order.remarks && (
          <div className="mb-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-md break-words">Remarks: {order.remarks}</div>
        )}
        {isMobile ? (
          <div className="mt-4">
            <SlideToConfirmButton status={order.status} onChangeStatus={onStatusChange} />
          </div>
        ) : (
          <div className="mt-4 flex justify-center">
            {order.status === "pending" ? (
              <Button className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-all duration-200" onClick={() => onStatusChange("delivered")}> <CheckCircle className="h-4 w-4 mr-2" /> Mark as Completed </Button>
            ) : (
              <Button className="bg-yellow-400 text-yellow-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-all duration-200" onClick={() => onStatusChange("pending")}> <Clock className="h-4 w-4 mr-2" /> Mark as Pending </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
