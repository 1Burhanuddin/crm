import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "@/hooks/use-toast";
import { DEMO_CUSTOMERS, DEMO_PRODUCTS } from "@/constants/demoData";
import { Order } from "@/constants/types";

interface EditOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (order: Order) => void;
  order: Order | null;
}

export function EditOrderModal({ open, onOpenChange, onEdit, order }: EditOrderModalProps) {
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("");
  const [jobDate, setJobDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [status, setStatus] = useState<"pending" | "delivered">("pending");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (order && open) {
      setCustomerId(order.customerId);
      setProductId(order.productId);
      setQty(order.qty.toString());
      setJobDate(order.jobDate);
      setAssignedTo(order.assignedTo);
      setSiteAddress(order.siteAddress || "");
      setStatus(order.status);
      setAdvanceAmount(
        typeof order.advanceAmount === "number"
          ? order.advanceAmount.toString()
          : ""
      );
    }
  }, [order, open]);

  // Helper to get product price for preview
  const selectedProduct = DEMO_PRODUCTS.find((p) => p.id === productId);
  const qtyNum = qty ? parseInt(qty) : 0;
  const advanceNum = advanceAmount ? parseFloat(advanceAmount) : 0;
  const total = selectedProduct ? selectedProduct.price * qtyNum : 0;
  const pending = Math.max(0, total - advanceNum);

  const handleEdit = async () => {
    if (!order) return;
    
    if (!customerId) {
      toast({ title: "Required", description: "Please select a customer.", variant: "destructive" });
      return;
    }
    if (!productId) {
      toast({ title: "Required", description: "Please select a product.", variant: "destructive" });
      return;
    }
    if (!qty || parseInt(qty) <= 0) {
      toast({ title: "Required", description: "Please enter a valid quantity.", variant: "destructive" });
      return;
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
      productId,
      qty: parseInt(qty),
      status,
      jobDate,
      assignedTo: assignedTo.trim(),
      siteAddress: siteAddress.trim(),
      advanceAmount: advanceNum,
    };

    onEdit(updatedOrder);
    setSubmitting(false);
    onOpenChange(false);
  };

  const isFormValid = customerId && productId && qty && parseInt(qty) > 0 && jobDate && assignedTo.trim() && advanceNum >= 0 && advanceNum <= total;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
            <label className="block text-sm font-medium mb-1">Product</label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {DEMO_PRODUCTS.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <Input
              type="number"
              placeholder="Enter quantity"
              value={qty}
              onChange={e => setQty(e.target.value)}
              min="1"
            />
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
