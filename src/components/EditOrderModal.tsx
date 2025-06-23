
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "@/hooks/use-toast";
import { DEMO_CUSTOMERS, DEMO_PRODUCTS } from "@/constants/demoData";
import { Order, OrderProduct } from "@/constants/types";
import { Plus, Trash2 } from "lucide-react";

interface EditOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (order: Order) => void;
  order: Order | null;
}

export function EditOrderModal({ open, onOpenChange, onEdit, order }: EditOrderModalProps) {
  const [customerId, setCustomerId] = useState("");
  const [products, setProducts] = useState<OrderProduct[]>([]);
  const [jobDate, setJobDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [status, setStatus] = useState<"pending" | "delivered">("pending");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (order && open) {
      setCustomerId(order.customerId);
      setProducts(order.products || []);
      setJobDate(order.jobDate);
      setAssignedTo(order.assignedTo);
      setSiteAddress(order.siteAddress || "");
      setStatus(order.status);
      setAdvanceAmount(
        typeof order.advanceAmount === "number"
          ? order.advanceAmount.toString()
          : ""
      );
      setRemarks(order.remarks || "");
    }
  }, [order, open]);

  // Helper to calculate totals
  const advanceNum = advanceAmount ? parseFloat(advanceAmount) : 0;
  const total = products.reduce((sum, item) => {
    const product = DEMO_PRODUCTS.find((p) => p.id === item.productId);
    return sum + (product ? product.price * item.qty : 0);
  }, 0);
  const pending = Math.max(0, total - advanceNum);

  const handleAddProduct = () => {
    setProducts([...products, { productId: "", qty: 1 }]);
  };

  const handleRemoveProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, field: keyof OrderProduct, value: string | number) => {
    const updatedProducts = [...products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    setProducts(updatedProducts);
  };

  const handleEdit = async () => {
    if (!order) return;
    
    if (!customerId) {
      toast({ title: "Required", description: "Please select a customer.", variant: "destructive" });
      return;
    }
    if (products.length === 0) {
      toast({ title: "Required", description: "Please add at least one product.", variant: "destructive" });
      return;
    }
    for (let i = 0; i < products.length; i++) {
      if (!products[i].productId) {
        toast({ title: "Required", description: `Please select a product for item ${i + 1}.`, variant: "destructive" });
        return;
      }
      if (!products[i].qty || products[i].qty <= 0) {
        toast({ title: "Required", description: `Please enter a valid quantity for item ${i + 1}.`, variant: "destructive" });
        return;
      }
    }
    if (!jobDate) {
      toast({ title: "Required", description: "Please enter a job date.", variant: "destructive" });
      return;
    }
    if (!assignedTo.trim()) {
      toast({ title: "Required", description: "Please enter who the job is assigned to.", variant: "destructive" });
      return;
    }
    if (advanceAmount && parseFloat(advanceAmount) < 0) {
      toast({
        title: "Invalid Advance",
        description: "Advance amount cannot be negative.",
        variant: "destructive",
      });
      return;
    }
    if (advanceNum > total) {
      toast({
        title: "Too Much Advance",
        description: "Advance cannot exceed total order amount.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    
    const updatedOrder: Order = {
      ...order,
      customerId,
      products,
      status,
      jobDate,
      assignedTo: assignedTo.trim(),
      siteAddress: siteAddress.trim(),
      advanceAmount: advanceNum,
      remarks: remarks.trim(),
    };

    onEdit(updatedOrder);
    setSubmitting(false);
    onOpenChange(false);
  };

  const isFormValid = customerId && products.length > 0 && 
    products.every(p => p.productId && p.qty > 0) && 
    jobDate && assignedTo.trim() && advanceNum >= 0 && advanceNum <= total;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Order</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium mb-1">Customer</label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {DEMO_CUSTOMERS.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Products</label>
              <Button
                type="button"
                onClick={handleAddProduct}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Plus size={16} /> Add Product
              </Button>
            </div>
            
            {products.map((product, index) => (
              <div key={index} className="flex gap-2 mb-2 p-3 border rounded-lg">
                <div className="flex-1">
                  <Select 
                    value={product.productId} 
                    onValueChange={(value) => handleProductChange(index, 'productId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEMO_PRODUCTS.map((prod) => (
                        <SelectItem key={prod.id} value={prod.id}>
                          {prod.name}
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
                    onChange={(e) => handleProductChange(index, 'qty', parseInt(e.target.value) || 0)}
                    min="1"
                  />
                </div>
                {products.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => handleRemoveProduct(index)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            ))}
            
            {products.length === 0 && (
              <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                <p>No products added</p>
                <Button
                  type="button"
                  onClick={handleAddProduct}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  <Plus size={16} className="mr-1" /> Add First Product
                </Button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Job Date</label>
            <Input
              type="date"
              value={jobDate}
              onChange={e => setJobDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select value={status} onValueChange={(value: "pending" | "delivered") => setStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Assigned To</label>
            <Input
              placeholder="Enter assigned person"
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Site Address (Optional)</label>
            <Input
              placeholder="Enter site address"
              value={siteAddress}
              onChange={e => setSiteAddress(e.target.value)}
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Remarks (Optional)</label>
            <Input
              placeholder="Enter remarks"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Advance Amount (₹)
            </label>
            <Input
              type="number"
              placeholder="Advance amount"
              value={advanceAmount}
              onChange={e => setAdvanceAmount(e.target.value)}
              min="0"
              max={total}
            />
            <div className="text-xs text-gray-500 mt-1">
              Total: ₹{total} &nbsp;
              {advanceNum > 0 && (
                <span>
                  | Advance: ₹{advanceNum} | Pending: <span className={pending > 0 ? "text-red-600" : "text-green-700"}>₹{pending}</span>
                </span>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 pt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleEdit}
            disabled={submitting || !isFormValid}
            className="rounded-full px-8 py-2 bg-blue-700 hover:bg-blue-800 text-white shadow-lg font-semibold tracking-wide transition-all duration-150 focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:opacity-60"
          >
            Update Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
