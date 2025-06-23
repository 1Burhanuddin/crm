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
import { Loader2 } from "lucide-react";

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
type DeliveredOrder = {
  id: string;
  amount: number;
};

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
      // Calculate order total from products array
      let orderTotal = 0;
      const orderProducts = Array.isArray(o.products) ? o.products : [];
      for (const item of orderProducts) {
        const price = priceMap.get(item.productId) || 0;
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
    if (pendingCustomers.length > 0) {
      setCustomerDates(prev => {
        const next: Record<string, Date> = { ...prev };
        pendingCustomers.forEach((c) => {
          if (!next[c.id]) {
            next[c.id] = addDays(new Date(), 1);
          }
        });
        Object.keys(next).forEach((id) => {
          if (!pendingCustomers.some((c) => c.id === id)) {
            delete next[id];
          }
        });
        return next;
      });
    }
  }, [pendingCustomers]);

  useEffect(() => {
    if (customers.length > 0) calculatePending();
    // eslint-disable-next-line
  }, [collections, customers]);

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
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="focus-visible:outline-none">
        <PendingCollectionsPanel
          pendingCustomers={pendingCustomers}
          customers={customers}
          customerDates={customerDates}
          openDateMenu={(id) => setDateMenuOpen((prev) => ({ ...prev, [id]: !prev[id] }))}
          dateMenuOpen={dateMenuOpen}
          handleDateChangeForCustomer={handleDateChangeForCustomer}
          displayDate={displayDate}
          customerDeliveredOrders={customerDeliveredOrders}
          setFormAndShowForm={(c) => {
            setForm({
              customer_id: c.id,
              amount: c.pending ? String(c.pending) : "",
              remarks: "",
              order_id:
                customerDeliveredOrders[c.id] && customerDeliveredOrders[c.id].length === 1
                  ? customerDeliveredOrders[c.id][0].id
                  : "",
              collection_date: customerDates[c.id] ?? addDays(new Date(), 1),
            });
            setShowForm(true);
          }}
          isAdding={isAdding}
          handleOpenReminderModal={handleOpenReminderModal}
        />
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
