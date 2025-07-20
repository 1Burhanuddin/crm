import { AppLayout } from "@/components/AppLayout";
import { useCollections } from "@/hooks/useCollections";
import { useSession } from "@/hooks/useSession";
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SendReminderModal } from "@/components/SendReminderModal";
import { CollectionEditModal } from "@/components/CollectionEditModal";
import { BackButton } from "@/components/ui/BackButton";
import { format, parseISO, isToday, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, CalendarIcon, MessageSquare } from "lucide-react";

// Refactored components
import { PendingCollectionsPanel } from "@/components/collections/PendingCollectionsPanel";
import { AddCollectionModal } from "@/components/collections/AddCollectionModal";
import { RecentCollectionsPanel } from "@/components/collections/RecentCollectionsPanel";
import { DeleteCollectionDialog } from "@/components/collections/DeleteCollectionDialog";

interface CustomerWithPending {
  id: string;
  name: string;
  pending: number;
  phone?: string;
}

interface OrderProduct {
  productId: string;
  qty: number;
}

type DeliveredOrder = {
  id: string;
  amount: number;
};

// Add new type for pending order with credit
interface PendingOrderWithCredit {
  orderId: string;
  customerId: string;
  customerName: string;
  phone?: string;
  creditAmount: number;
  jobDate?: string;
}

export default function Collections() {
  const { user } = useSession();
  const {
    data: collections = [],
    isLoading,
    error,
    addCollection,
    isAdding,
    editCollection,
    isEditing,
    deleteCollection,
    isDeleting
  } = useCollections();

  const [customers, setCustomers] = useState<{ id: string; name: string; phone?: string }[]>([]);
  const [pendingCustomers, setPendingCustomers] = useState<CustomerWithPending[]>([]);
  const [customerDeliveredOrders, setCustomerDeliveredOrders] = useState<Record<string, DeliveredOrder[]>>({});
  const [customerDates, setCustomerDates] = useState<Record<string, Date>>({});
  const [dateMenuOpen, setDateMenuOpen] = useState<{ [id: string]: boolean }>({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customer_id: "",
    amount: "",
    remarks: "",
    order_id: "",
    collection_date: new Date(),
  });
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderCustomer, setReminderCustomer] = useState<CustomerWithPending | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<null | {
    id: string;
    amount: number;
    remarks: string;
  }>(null);
  const [deleteDialog, setDeleteDialog] = useState<null | { id: string; name: string }>(null);
  const [pendingOrdersWithCredit, setPendingOrdersWithCredit] = useState<PendingOrderWithCredit[]>([]);

  useEffect(() => {
    if (!user) return;
    async function loadCustomers() {
      const { data } = await supabase
        .from("customers")
        .select("id,name,phone")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setCustomers(data ?? []);
    }
    loadCustomers();
  }, [user]);

  const calculatePending = useCallback(async () => {
    if (!user) return;
    const { data: orders } = await supabase
      .from("orders")
      .select("id, customer_id, products, advance_amount, status")
      .eq("user_id", user.id)
      .eq("status", "delivered");
    if (!orders) {
      setPendingCustomers([]);
      setCustomerDeliveredOrders({});
      return;
    }
    const { data: products } = await supabase
      .from("products")
      .select("id, price")
      .eq("user_id", user.id);
    const priceMap = new Map<string, number>(
      (products || []).map((p: any) => [p.id, Number(p.price) || 0])
    );
    const deliveredOrderUdhaar: { [orderId: string]: { customer_id: string; amount: number } } = {};
    for (const o of orders) {
      let orderTotal = 0;
      const orderProducts = Array.isArray(o.products) ? (o.products as unknown as OrderProduct[]) : [];
      for (const item of orderProducts) {
        // Handle both productId and product_id field names
        const productId = (item as any).productId || (item as any).product_id;
        const price = priceMap.get(productId) || 0;
        const qty = Number(item.qty) || 0;
        orderTotal += price * qty;
      }
      const amt = orderTotal - (Number(o.advance_amount) || 0);
      deliveredOrderUdhaar[o.id] = {
        customer_id: o.customer_id,
        amount: amt > 0 ? amt : 0
      };
    }
    const { data: collectionsData } = await supabase
      .from("collections")
      .select("id, order_id, customer_id, amount")
      .eq("user_id", user.id);
    (collectionsData || []).forEach((c: any) => {
      if (c.order_id && deliveredOrderUdhaar[c.order_id]) {
        deliveredOrderUdhaar[c.order_id].amount -= Number(c.amount) || 0;
        if (deliveredOrderUdhaar[c.order_id].amount < 0) deliveredOrderUdhaar[c.order_id].amount = 0;
      }
    });
    const pendingMap = new Map<string, number>();
    const deliveredOrdersMap: Record<string, DeliveredOrder[]> = {};
    Object.entries(deliveredOrderUdhaar).forEach(([orderId, { customer_id, amount }]) => {
      if (amount > 0) {
        const prev = pendingMap.get(customer_id) || 0;
        pendingMap.set(customer_id, prev + amount);
        if (!deliveredOrdersMap[customer_id]) deliveredOrdersMap[customer_id] = [];
        deliveredOrdersMap[customer_id].push({ id: orderId, amount: Math.round(amount) });
      }
    });
    const result: CustomerWithPending[] = [];
    for (const [id, pending] of pendingMap.entries()) {
      if (pending > 0 && customers.some((c) => c.id === id)) {
        const cust = customers.find((c) => c.id === id);
        result.push({
          id,
          name: cust?.name || "(Unknown)",
          pending: Math.round(pending),
          phone: cust?.phone || "",
        });
      }
    }
    setPendingCustomers(result.sort((a, b) => b.pending - a.pending));
    setCustomerDeliveredOrders(deliveredOrdersMap);
  }, [user, collections, customers]);

  useEffect(() => {
    if (customers.length > 0) {
      console.log("Customers loaded, calling calculatePending. Customers count:", customers.length);
      calculatePending();
    }
    // eslint-disable-next-line
  }, [collections, customers, calculatePending]);

  const handleOpenForm = (customerId?: string, amount?: number) => {
    let order_id = "";
    if (customerId && customerDeliveredOrders[customerId] && customerDeliveredOrders[customerId].length === 1) {
      order_id = customerDeliveredOrders[customerId][0].id;
    }
    setForm({
      customer_id: customerId || "",
      amount: amount ? String(amount) : "",
      remarks: "",
      order_id,
      collection_date: customerId ? (customerDates[customerId] ?? addDays(new Date(), 1)) : addDays(new Date(), 1),
    });
    setShowForm(true);
  };

  const handleOpenReminderModal = (customer: CustomerWithPending) => {
    setReminderCustomer(customer);
    setReminderModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === "customer_id") {
      const orders = customerDeliveredOrders[value];
      setForm(f => ({
        ...f,
        customer_id: value,
        order_id: orders && orders.length === 1 ? orders[0].id : "",
      }));
    }
  };

  const handleOrderIdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm({ ...form, order_id: e.target.value });
  };

  const handleDateChangeForCustomer = (customerId: string, date: Date) => {
    setCustomerDates(prev => ({
      ...prev,
      [customerId]: date,
    }));
    setDateMenuOpen(prev => ({ ...prev, [customerId]: false }));
  };

  const openDateMenu = (customerId: string) => {
    setDateMenuOpen(prev => ({ ...prev, [customerId]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submission started", { form });
    
    if (!form.customer_id || !form.amount) {
      console.log("Form validation failed", { customer_id: form.customer_id, amount: form.amount });
      toast({
        title: "Missing info",
        description: "Please select customer and amount.",
        variant: "destructive"
      });
      return;
    }

    try {
      const collectionDate = form.collection_date
        ? format(form.collection_date as Date, "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd");
      
      console.log("Adding collection with data:", {
        customer_id: form.customer_id,
        amount: Number(form.amount),
        remarks: form.remarks,
        order_id: form.order_id || null,
        collection_date: collectionDate,
      });

      await addCollection({
        customer_id: form.customer_id,
        amount: Number(form.amount),
        remarks: form.remarks,
        order_id: form.order_id || null,
        collection_date: collectionDate,
      });

      console.log("Collection added successfully");
      toast({ title: "Collection added successfully!" });
      setShowForm(false);
      setForm({
        customer_id: "",
        amount: "",
        remarks: "",
        order_id: "",
        collection_date: addDays(new Date(), 1),
      });
    } catch (error) {
      console.error("Error adding collection:", error);
      toast({
        title: "Error",
        description: "Failed to add collection. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditCollection = (collection: { id: string; amount: number; remarks: string; }) => {
    setEditingCollection({
      id: collection.id,
      amount: collection.amount,
      remarks: collection.remarks || "",
    });
    setEditModalOpen(true);
  };

  const handleDeleteCollection = (collection: { id: string; name: string }) => {
    setDeleteDialog({
      id: collection.id,
      name: collection.name,
    });
  };

  const performDelete = async () => {
    if (!deleteDialog) return;
    await deleteCollection(deleteDialog.id);
    toast({ title: "Collection deleted." });
    setDeleteDialog(null);
  };

  const saveEditCollection = async (val: { amount: number; remarks: string }) => {
    if (!editingCollection) return;
    await editCollection({
      id: editingCollection.id,
      amount: val.amount,
      remarks: val.remarks,
    });
    toast({ title: "Collection updated." });
    setEditModalOpen(false);
    setEditingCollection(null);
  };

  // Calculate collections due today properly from actual data
  const dueToday = collections.filter(
    (c) =>
      c.collection_date &&
      isToday(parseISO(c.collection_date))
  );

  const displayDate = (date: Date) => {
    return format(date, "PPP");
  };

  if (!user) {
    return (
      <AppLayout title="Collections">
        <div className="p-4 max-w-lg mx-auto">
          <div className="text-center py-8">
            <p className="text-gray-600">Please log in to view collections.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout title="Collections">
        <div className="p-4 max-w-lg mx-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading collections...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="Collections">
        <div className="p-4 max-w-lg mx-auto">
          <div className="text-center py-8">
            <p className="text-red-600">Error loading collections. Please try again.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Collections">
      <div className="p-4 max-w-lg mx-auto">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">Collections</h2>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="flex w-full bg-transparent border border-blue-200 rounded-full p-1 mb-4 h-12">
            <TabsTrigger value="pending" className="flex-1 rounded-full h-10 text-base font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-blue-700 data-[state=inactive]:bg-transparent transition-all">
              Pending
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 rounded-full h-10 text-base font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-blue-700 data-[state=inactive]:bg-transparent transition-all">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="focus-visible:outline-none">
        {(() => {
          console.log("Rendering pending tab with pendingCustomers:", pendingCustomers);
          return null;
        })()}
        {pendingCustomers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <div className="text-gray-500">No pending collections</div>
          </div>
        ) : (
          <div>
            <div className="mb-2 text-blue-800 font-bold">Pending Collections</div>
            <ul className="space-y-4">
              {pendingCustomers.map((customer) => (
                <li
                  key={customer.id}
                  className="bg-white rounded-xl shadow-lg border hover:shadow-xl transition-all duration-200 relative overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-blue-900">
                          {customer.name}
                        </h3>
                        {customer.phone && (
                          <p className="text-sm text-gray-600 mt-1">{customer.phone}</p>
                        )}
                        
                        {/* Collection Date Selector */}
                        <div className="mt-3 flex items-center gap-2">
                          <Popover
                            open={dateMenuOpen[customer.id] || false}
                            onOpenChange={(open) => {
                              if (open) {
                                openDateMenu(customer.id);
                              } else {
                                setDateMenuOpen(prev => ({ ...prev, [customer.id]: false }));
                              }
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "justify-start text-left font-normal text-xs h-8",
                                  !customerDates[customer.id] && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-3 w-3" />
                                {customerDates[customer.id] 
                                  ? displayDate(customerDates[customer.id]) 
                                  : "Set collection date"
                                }
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={customerDates[customer.id]}
                                onSelect={(date) => {
                                  if (date) {
                                    handleDateChangeForCustomer(customer.id, date);
                                  }
                                }}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-3 flex gap-2">
                          <Button
                            onClick={() => {
                              setForm({
                                customer_id: customer.id,
                                amount: customer.pending ? String(customer.pending) : "",
                                remarks: "",
                                order_id:
                                  customerDeliveredOrders[customer.id] && customerDeliveredOrders[customer.id].length === 1
                                    ? customerDeliveredOrders[customer.id][0].id
                                    : "",
                                collection_date: customerDates[customer.id] ?? addDays(new Date(), 1),
                              });
                              setShowForm(true);
                            }}
                            disabled={isAdding}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                          >
                            {isAdding ? (
                              <>
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              "Collect ₹" + customer.pending
                            )}
                          </Button>
                          <Button
                            onClick={() => handleOpenReminderModal(customer)}
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                          >
                            <MessageSquare className="mr-1 h-3 w-3" />
                            Remind
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-600">
                          ₹{customer.pending}
                        </div>
                        <div className="text-sm text-gray-500">Pending Amount</div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
          </TabsContent>

          <TabsContent value="history" className="focus-visible:outline-none">
            <RecentCollectionsPanel
              collections={collections}
              customers={customers}
              isLoading={isLoading}
              error={error}
              handleEditCollection={handleEditCollection}
              handleDeleteCollection={handleDeleteCollection}
              dueToday={dueToday}
            />
          </TabsContent>
        </Tabs>

        <SendReminderModal
          open={reminderModalOpen}
          onOpenChange={(open) => setReminderModalOpen(open)}
          customer={reminderCustomer}
        />

        <AddCollectionModal
          open={showForm}
          setOpen={setShowForm}
          form={form}
          setForm={setForm}
          handleSubmit={handleSubmit}
          customers={customers}
          customerDeliveredOrders={customerDeliveredOrders}
          displayDate={displayDate}
          isAdding={isAdding}
          handleOrderIdChange={handleOrderIdChange}
          handleFormChange={handleFormChange}
        />

      <CollectionEditModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingCollection(null);
        }}
        initial={{
          amount: editingCollection?.amount || 1,
          remarks: editingCollection?.remarks || "",
        }}
        onSave={saveEditCollection}
        loading={isEditing}
      />

      <DeleteCollectionDialog
        deleteDialog={deleteDialog}
        setDeleteDialog={setDeleteDialog}
        isDeleting={isDeleting}
        performDelete={performDelete}
      />
      </div>
    </AppLayout>
  );
}
