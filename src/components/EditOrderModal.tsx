import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  products: OrderProduct[];
  job_date: string;
  status: string;
  advance_amount: number;
  assigned_to?: string;
  site_address?: string;
  remarks?: string;
}

interface EditOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onUpdate: () => void;
}

export function EditOrderModal({
  open,
  onOpenChange,
  order,
  onUpdate,
}: EditOrderModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedProducts, setSelectedProducts] = useState<OrderProduct[]>([]);
  const [jobDate, setJobDate] = useState<Date>();
  const [status, setStatus] = useState<string>("pending");
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [siteAddress, setSiteAddress] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchCustomers();
      fetchProducts();
    }
  }, [open]);

  useEffect(() => {
    if (order && open) {
      setSelectedCustomerId(order.customer_id);
      setSelectedProducts(order.products || []);
      setJobDate(new Date(order.job_date));
      setStatus(order.status);
      setAdvanceAmount(order.advance_amount || 0);
      setAssignedTo(order.assigned_to || "");
      setSiteAddress(order.site_address || "");
      setRemarks(order.remarks || "");
    }
  }, [order, open]);

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from("customers")
      .select("id, name, phone")
      .order("name");
    if (data) setCustomers(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, price, unit")
      .order("name");
    if (data) setProducts(data);
  };

  const addNewCustomer = async (name: string, phone: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from("customers")
        .insert({
          name,
          phone,
          user_id: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCustomers(prev => [...prev, data]);
        setSelectedCustomerId(data.id);
        setShowNewCustomerForm(false);
        setNewCustomerName("");
        setNewCustomerPhone("");
        toast({
          title: "Success",
          description: "Customer added successfully",
        });
      }
    } catch (error) {
      console.error("Error adding customer:", error);
      toast({
        title: "Error",
        description: "Failed to add customer",
        variant: "destructive",
      });
    }
  };

  const addProduct = () => {
    setSelectedProducts([...selectedProducts, { productId: "", qty: 1 }]);
  };

  const removeProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: keyof OrderProduct, value: string | number) => {
    const updated = [...selectedProducts];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedProducts(updated);
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product ? product.price * item.qty : 0);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          customer_id: selectedCustomerId,
          products: selectedProducts,
          job_date: jobDate?.toISOString().split('T')[0],
          status,
          advance_amount: advanceAmount,
          assigned_to: assignedTo || null,
          site_address: siteAddress || null,
          remarks: remarks || null,
        })
        .eq("id", order.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order updated successfully",
      });
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            {!showNewCustomerForm ? (
              <div className="flex gap-2">
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewCustomerForm(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2 p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Add New Customer</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewCustomerForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newCustomerName">Name</Label>
                    <Input
                      id="newCustomerName"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCustomerPhone">Phone</Label>
                    <Input
                      id="newCustomerPhone"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => addNewCustomer(newCustomerName, newCustomerPhone)}
                  disabled={!newCustomerName || !newCustomerPhone}
                >
                  Add Customer
                </Button>
              </div>
            )}
          </div>

          {/* Products Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Products</Label>
              <Button type="button" variant="outline" size="sm" onClick={addProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
            
            {selectedProducts.map((item, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label>Product</Label>
                  <Select
                    value={item.productId}
                    onValueChange={(value) => updateProduct(index, "productId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - ₹{product.price}/{product.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => updateProduct(index, "qty", parseInt(e.target.value) || 1)}
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

          {/* Order Total */}
          <div className="text-right">
            <p className="text-lg font-semibold">Total: ₹{calculateTotal().toLocaleString()}</p>
          </div>

          {/* Job Date */}
          <div className="space-y-2">
            <Label>Job Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !jobDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {jobDate ? format(jobDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={jobDate}
                  onSelect={setJobDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advance Amount */}
          <div className="space-y-2">
            <Label htmlFor="advanceAmount">Advance Amount (₹)</Label>
            <Input
              id="advanceAmount"
              type="number"
              min="0"
              value={advanceAmount}
              onChange={(e) => setAdvanceAmount(Number(e.target.value))}
            />
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assigned To</Label>
            <Input
              id="assignedTo"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Person responsible"
            />
          </div>

          {/* Site Address */}
          <div className="space-y-2">
            <Label htmlFor="siteAddress">Site Address</Label>
            <Textarea
              id="siteAddress"
              value={siteAddress}
              onChange={(e) => setSiteAddress(e.target.value)}
              placeholder="Enter site address"
            />
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Additional notes"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !selectedCustomerId || selectedProducts.length === 0}>
              {isLoading ? "Updating..." : "Update Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
