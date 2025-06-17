import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "@/hooks/use-toast";
import { Order, Customer, Product } from "@/constants/types";
import { ChevronDown, ChevronUp } from "lucide-react";

interface AddOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (order: Omit<Order, "id">) => void;
  customers: Customer[];
  products: Product[];
}

export function AddOrderModal({
  open,
  onOpenChange,
  onAdd,
  customers,
  products,
}: AddOrderModalProps) {
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("");
  const [jobDate, setJobDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignedTo, setAssignedTo] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [remarks, setRemarks] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);

  // Update assignedTo when customer changes
  useEffect(() => {
    if (customerId) {
      const selectedCustomer = customers.find(c => c.id === customerId);
      if (selectedCustomer) {
        setAssignedTo(selectedCustomer.name);
      }
    }
  }, [customerId, customers]);

  const resetForm = () => {
    setCustomerId("");
    setProductId("");
    setQty("");
    setJobDate(new Date().toISOString().split('T')[0]);
    setAssignedTo("");
    setSiteAddress("");
    setRemarks("");
    setAdvanceAmount("");
    setShowAdditionalFields(false);
  };

  // Helper to get product price for preview
  const selectedProduct = products.find((p) => p.id === productId);
  const qtyNum = qty ? parseInt(qty) : 0;
  const advanceNum = advanceAmount ? parseFloat(advanceAmount) : 0;
  const total = selectedProduct ? selectedProduct.price * qtyNum : 0;
  const pending = Math.max(0, total - advanceNum);

  const handleAdd = async () => {
    if (!customerId) {
      toast({
        title: "Required",
        description: "Please select a customer.",
        variant: "destructive",
      });
      return;
    }
    if (!productId) {
      toast({
        title: "Required",
        description: "Please select a product.",
        variant: "destructive",
      });
      return;
    }
    if (!qty || parseInt(qty) <= 0) {
      toast({
        title: "Required",
        description: "Please enter a valid quantity.",
        variant: "destructive",
      });
      return;
    }
    if (!jobDate) {
      toast({
        title: "Required",
        description: "Please enter a job date.",
        variant: "destructive",
      });
      return;
    }
    if (!assignedTo.trim()) {
      toast({
        title: "Required",
        description: "Please enter who the job is assigned to.",
        variant: "destructive",
      });
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

    const newOrder: Omit<Order, "id"> = {
      customerId,
      productId,
      qty: parseInt(qty),
      status: "pending",
      jobDate,
      assignedTo: assignedTo.trim(),
      siteAddress: siteAddress.trim(),
      remarks: remarks.trim(),
      advanceAmount: advanceNum,
    };

    onAdd(newOrder);
    resetForm();
    setSubmitting(false);
    onOpenChange(false);
  };

  const isFormValid =
    customerId &&
    productId &&
    qty &&
    parseInt(qty) > 0 &&
    jobDate &&
    assignedTo.trim() &&
    advanceNum >= 0 &&
    advanceNum <= total;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-blue-900">Add New Order</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div>
              <label className="block text-sm font-medium mb-1 text-blue-900">Customer</label>
            <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.length === 0 ? (
                  <div className="text-gray-400 px-3 py-2 text-xs">
                    No customers found.
                  </div>
                ) : (
                  customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Product</label>
            <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.length === 0 ? (
                  <div className="text-gray-400 px-3 py-2 text-xs">
                    No products found.
                  </div>
                ) : (
                  products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Quantity</label>
            <Input
              type="number"
              placeholder="Enter quantity"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              min="1"
                className="bg-white"
            />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Job Date</label>
            <Input
              type="date"
              value={jobDate}
              onChange={(e) => setJobDate(e.target.value)}
                className="bg-white"
            />
          </div>

          <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
              Assigned To
            </label>
            <Input
              placeholder="Enter assigned person"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              maxLength={50}
                className="bg-white"
            />
          </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Advance Amount (₹)
            </label>
            <Input
              type="number"
              placeholder="Advance amount"
              value={advanceAmount}
              onChange={(e) => setAdvanceAmount(e.target.value)}
              min="0"
              max={total}
              className="bg-white"
            />
            <div className="text-sm text-gray-600 mt-2 space-y-1">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-medium">₹{total}</span>
              </div>
              {advanceNum > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>Advance Paid:</span>
                    <span className="font-medium text-green-600">₹{advanceNum}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Amount:</span>
                    <span className={`font-medium ${pending > 0 ? "text-red-600" : "text-green-600"}`}>
                      ₹{pending}
                </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdditionalFields(!showAdditionalFields)}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-sm font-medium text-gray-700 transition-colors"
            >
              <span>Additional Fields</span>
              {showAdditionalFields ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
            
            {showAdditionalFields && (
              <div className="p-4 space-y-4 bg-white">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Site Address
                  </label>
                  <Input
                    placeholder="Enter site address"
                    value={siteAddress}
                    onChange={(e) => setSiteAddress(e.target.value)}
                    maxLength={200}
                    className="bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Remarks
                  </label>
                  <Input
                    placeholder="Enter any additional remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    maxLength={200}
                    className="bg-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2 pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="px-6">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={submitting || !isFormValid}
            className="rounded-full px-8 py-2 bg-blue-700 hover:bg-blue-800 text-white shadow-lg font-semibold tracking-wide transition-all duration-150 focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:opacity-60"
          >
            {submitting ? "Adding..." : "Add Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
