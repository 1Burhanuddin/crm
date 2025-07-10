
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Users, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AddQuotationModal } from '@/components/AddQuotationModal';
import { useSession } from '@/hooks/useSession';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Quotation, Customer, Product, Order } from '@/constants/types';
import { AddOrderModal } from '@/components/AddOrderModal';
import { toast } from '@/hooks/use-toast';
import { OrderProduct } from "@/utils/orderUtils";

const fetchCustomers = async (user_id: string): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((c) => ({ id: c.id, name: c.name, phone: c.phone }));
};

const fetchProducts = async (user_id?: string): Promise<Product[]> => {
  let query = supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (user_id) {
    query = query.eq('user_id', user_id);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Product[];
};

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const navigate = useNavigate();
  const { user } = useSession();
  const queryClient = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', user?.id],
    queryFn: () => fetchCustomers(user?.id ?? ''),
    enabled: !!user?.id,
  });
  const { data: products = [] } = useQuery({
    queryKey: ['products', user?.id],
    queryFn: () => fetchProducts(user?.id ?? ''),
    enabled: !!user?.id,
  });

  const refreshCustomers = () => {
    queryClient.invalidateQueries({ queryKey: ['customers', user?.id] });
  };

  // Add Order mutation
  const addOrderMutation = useMutation({
    mutationFn: async (orderData: Omit<Order, 'id'>) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from("orders")
        .insert({
          customer_id: orderData.customerId,
          user_id: user.id,
          products: orderData.products as unknown as any,
          status: "pending",
          job_date: orderData.jobDate,
          advance_amount: orderData.advanceAmount || 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", user?.id] });
      toast({ title: "Order Added", description: "New order has been added successfully." });
      setShowOrderModal(false);
      navigate('/orders');
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to add order", 
        variant: "destructive" 
      });
    }
  });

  // Add Order
  const handleAddOrder = (orderData: Omit<Order, 'id'>) => {
    addOrderMutation.mutate(orderData);
  };

  // Add Quotation
  const handleAddQuotation = (quotation: Omit<Quotation, 'id'>) => {
    setShowQuotationModal(false);
    navigate('/quotations');
  };

  return (
    <div className="fixed bottom-24 right-5 z-50 md:hidden">
      <div className="relative flex flex-col items-center gap-2">
        {/* Floating menu, absolutely positioned above the main button */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 flex flex-col items-center gap-2 z-50">
            <Button
              variant="secondary"
              className="rounded-full w-40 justify-start pl-5 shadow-lg"
              onClick={() => { setShowOrderModal(true); setIsOpen(false); }}
            >
              <Plus className="h-5 w-5 mr-3" />
              Add Order
            </Button>
            <Button
              variant="secondary"
              className="rounded-full w-40 justify-start pl-5 shadow-lg"
              onClick={() => { setShowQuotationModal(true); setIsOpen(false); }}
            >
              <FileText className="h-5 w-5 mr-3" />
              Add Quotation
            </Button>
          </div>
        )}
        <Button
          className="rounded-full h-12 w-12 shadow-lg mt-2"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="fab-menu"
        >
          <Plus className={`h-6 w-6 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
        </Button>
        {/* AddOrderModal */}
        <AddOrderModal
          open={showOrderModal}
          onOpenChange={setShowOrderModal}
          onAdd={handleAddOrder}
          customers={customers}
          products={products}
          refreshCustomers={refreshCustomers}
        />
        {/* AddQuotationModal */}
        <AddQuotationModal
          open={showQuotationModal}
          onOpenChange={setShowQuotationModal}
          onAdd={handleAddQuotation}
          customers={customers}
          products={products}
          refreshCustomers={refreshCustomers}
        />
      </div>
    </div>
  );
} 
