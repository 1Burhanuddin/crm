
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  [key: string]: any;
}

interface Order {
  id: string;
  customer_id: string;
  job_date: string;
  status: string;
  site_address?: string;
  remarks?: string;
  assigned_to?: string;
  advance_amount: number;
  products: OrderProduct[];
}

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onOrderUpdated: () => void;
}

export function EditOrderModal({ isOpen, onClose, order, onOrderUpdated }: EditOrderModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    customer_id: order.customer_id,
    job_date: new Date(order.job_date),
    status: order.status,
    site_address: order.site_address || "",
    remarks: order.remarks || "",
    assigned_to: order.assigned_to || "",
    advance_amount: order.advance_amount,
    products: order.products as OrderProduct[]
  });

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("name");
    
    if (error) {
      console.error("Error fetching customers:", error);
      return;
    }
    
    setCustomers(data || []);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");
    
    if (error) {
      console.error("Error fetching products:", error);
      return;
    }
    
    setProducts(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          customer_id: formData.customer_id,
          job_date: format(formData.job_date, "yyyy-MM-dd"),
          status: formData.status,
          site_address: formData.site_address,
          remarks: formData.remarks,
          assigned_to: formData.assigned_to,
          advance_amount: formData.advance_amount,
          products: formData.products as any,
          updated_at: new Date().toISOString()
        })
        .eq("id", order.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order updated successfully",
      });
      
      onOrderUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    }
  };

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { productId: "", qty: 1 }]
    }));
  };

  const removeProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const updateProduct = (index: number, field: keyof OrderProduct, value: any) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map((product, i) => 
        i === index ? { ...product, [field]: value } : product
      )
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Order</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Job Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.job_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.job_date ? format(formData.job_date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.job_date}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, job_date: date }))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="advance_amount">Advance Amount</Label>
              <Input
                id="advance_amount"
                type="number"
                value={formData.advance_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, advance_amount: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="site_address">Site Address</Label>
            <Input
              id="site_address"
              value={formData.site_address}
              onChange={(e) => setFormData(prev => ({ ...prev, site_address: e.target.value }))}
              placeholder="Enter site address"
            />
          </div>

          <div>
            <Label htmlFor="assigned_to">Assigned To</Label>
            <Input
              id="assigned_to"
              value={formData.assigned_to}
              onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
              placeholder="Enter assignee name"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Products</Label>
              <Button type="button" onClick={addProduct} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Product
              </Button>
            </div>
            
            <div className="space-y-2">
              {formData.products.map((product, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Select
                      value={product.productId}
                      onValueChange={(value) => updateProduct(index, "productId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((prod) => (
                          <SelectItem key={prod.id} value={prod.id}>
                            {prod.name} - ₹{prod.price}/{prod.unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={product.qty}
                      onChange={(e) => updateProduct(index, "qty", Number(e.target.value))}
                      min="1"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeProduct(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              placeholder="Enter any remarks"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Update Order
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
