import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Phone, MessageSquare } from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { getDueDateInfo } from "@/utils/dueDateUtils";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useCollections } from "@/hooks/useCollections";
import { toast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  name: string;
  phone?: string;
}

interface DeliveredOrder {
  id: string;
  amount: number;
}

interface DashboardCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: {
    id: string;
    name: string;
    pending: number;
    phone?: string;
  } | null;
  customers: Customer[];
  onCollectionAdded: () => void;
}

export function DashboardCollectionModal({
  open,
  onOpenChange,
  customer,
  customers,
  onCollectionAdded,
}: DashboardCollectionModalProps) {
  const { user } = useSession();
  const { addCollection, isAdding } = useCollections();
  const [collectionDate, setCollectionDate] = useState<Date>(addDays(new Date(), 1));
  const [amount, setAmount] = useState("");
  const [showReminder, setShowReminder] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");
  const [deliveredOrders, setDeliveredOrders] = useState<DeliveredOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");

  useEffect(() => {
    if (customer && open) {
      setAmount(customer.pending.toString());
      setCollectionDate(addDays(new Date(), 1));
      setShowReminder(false);
      setReminderMessage(`Hi ${customer.name}, this is a friendly reminder about your pending payment of ₹${customer.pending}. Please let us know when you can make the payment. Thank you!`);
      
      // Fetch delivered orders for this customer
      fetchDeliveredOrders();
    }
  }, [customer, open]);

  const fetchDeliveredOrders = async () => {
    if (!customer || !user) return;

    const { data: orders } = await supabase
      .from("orders")
      .select("id, products, advance_amount")
      .eq("user_id", user.id)
      .eq("customer_id", customer.id)
      .eq("status", "delivered");

    if (!orders) return;

    const { data: products } = await supabase
      .from("products")
      .select("id, price")
      .eq("user_id", user.id);

    const priceMap = new Map<string, number>(
      (products || []).map((p: any) => [p.id, Number(p.price) || 0])
    );

    const { data: collections } = await supabase
      .from("collections")
      .select("order_id, amount")
      .eq("user_id", user.id)
      .eq("customer_id", customer.id);

    const collectionsByOrder = new Map<string, number>();
    (collections || []).forEach((c: any) => {
      if (c.order_id) {
        const existing = collectionsByOrder.get(c.order_id) || 0;
        collectionsByOrder.set(c.order_id, existing + Number(c.amount));
      }
    });

    const orderAmounts = orders.map((order) => {
      let orderTotal = 0;
      if (Array.isArray(order.products)) {
        (order.products as any[]).forEach((item) => {
          if (item && typeof item === 'object' && 'productId' in item && 'qty' in item) {
            const price = priceMap.get(item.productId) || 0;
            const qty = Number(item.qty) || 0;
            orderTotal += price * qty;
          }
        });
      }

      const totalDue = orderTotal - Number(order.advance_amount || 0);
      const collected = collectionsByOrder.get(order.id) || 0;
      const pending = totalDue - collected;

      return {
        id: order.id,
        amount: Math.max(0, pending)
      };
    }).filter(order => order.amount > 0);

    setDeliveredOrders(orderAmounts);
    if (orderAmounts.length === 1) {
      setSelectedOrderId(orderAmounts[0].id);
    }
  };

  const handleCollectPayment = async () => {
    if (!customer || !user || !amount) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const collectionDateStr = format(collectionDate, "yyyy-MM-dd");

      console.log("Adding collection from dashboard modal:", {
        customer_id: customer.id,
        amount: Number(amount),
        collection_date: collectionDateStr,
        order_id: selectedOrderId || null,
      });

      // Use the addCollection hook which handles both collection and transaction
      await addCollection({
        customer_id: customer.id,
        amount: Number(amount),
        collection_date: collectionDateStr,
        order_id: selectedOrderId || null,
      });

      toast({
        title: "Success!",
        description: "Collection added successfully.",
      });

      onCollectionAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding collection:", error);
      toast({
        title: "Error",
        description: "Failed to add collection. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSendReminder = () => {
    if (customer?.phone) {
      const encodedMessage = encodeURIComponent(reminderMessage);
      window.open(`https://wa.me/91${customer.phone}?text=${encodedMessage}`, '_blank');
    }
    setShowReminder(false);
  };

  if (!customer) return null;

  const dueDateInfo = getDueDateInfo(collectionDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto rounded-2xl p-5 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-900">
            Collection Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 text-lg">{customer.name}</h3>
            {customer.phone && (
              <p className="text-sm text-blue-700 mt-1">{customer.phone}</p>
            )}
            <div className="mt-2">
              <span className="text-2xl font-bold text-red-600">₹{customer.pending}</span>
              <span className="text-sm text-red-600 ml-2">Pending Amount</span>
            </div>
          </div>

          {/* Collection Date */}
          <div className="space-y-2">
            <Label htmlFor="collection-date">Collection Date</Label>
            <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal flex-1 rounded-full",
                      !collectionDate && "text-muted-foreground"
                    )}
                    onClick={() => console.log('Calendar button clicked')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {collectionDate ? format(collectionDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50" align="start">
                  <div className="p-3">
                    <Calendar
                      mode="single"
                      selected={collectionDate}
                      onSelect={(date) => {
                        console.log('Calendar date selected:', date);
                        if (date) {
                          setCollectionDate(date);
                        }
                      }}
                      initialFocus
                      className="pointer-events-auto"
                      disabled={(date) => date < new Date()}
                    />
                  </div>
                </PopoverContent>
              </Popover>
              <span 
                className={cn(
                  "inline-flex items-center px-3 py-2 rounded-full text-sm font-medium",
                  dueDateInfo.color,
                  dueDateInfo.bgColor,
                  dueDateInfo.isUrgent && "animate-pulse"
                )}
              >
                {dueDateInfo.text}
              </span>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Collection Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="text-lg font-semibold rounded-full pl-6"
            />
          </div>

          {/* Order Selection */}
          {deliveredOrders.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="order">Link to Order (Optional)</Label>
              <select
                id="order"
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-full"
              >
                <option value="">Select an order</option>
                {deliveredOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    Order #{order.id.slice(0, 8)} - ₹{order.amount}
                  </option>
                ))}
              </select>
            </div>
          )}



          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleCollectPayment}
              disabled={isAdding || !amount}
              className="w-full bg-blue-600 hover:bg-blue-700 rounded-full"
              size="lg"
            >
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                "Collect Payment"
              )}
            </Button>

            <div className="flex flex-row gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => setShowReminder(true)}
                className="flex-1 flex items-center justify-center text-black border-black hover:bg-gray-100 rounded-full"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Reminder
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (customer.phone) {
                    console.log('Calling customer:', customer.phone);
                    // Clean the phone number (remove spaces, dashes, etc.)
                    const cleanPhone = customer.phone.replace(/[\s\-\(\)]/g, '');
                    // Add country code if not present
                    const phoneWithCode = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
                    window.open(`tel:${phoneWithCode}`, '_self');
                  }
                }}
                className="flex-1 flex items-center justify-center text-black border-black hover:bg-gray-100 rounded-full"
                disabled={!customer.phone}
                title={customer.phone ? `Call ${customer.phone}` : 'No phone number available'}
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Customer
              </Button>
            </div>
          </div>
        </div>

        {/* Reminder Modal */}
        {showReminder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 m-4 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Send Reminder</h3>
              <Textarea
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                rows={4}
                className="mb-4"
              />
              <div className="flex gap-3">
                <Button
                  onClick={handleSendReminder}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Send via WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowReminder(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}