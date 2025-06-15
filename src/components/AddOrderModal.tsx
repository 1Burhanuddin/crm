
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "@/hooks/use-toast";
import { DEMO_CUSTOMERS } from "@/constants/demoData";
import { Order } from "@/constants/types";

interface AddOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (order: Omit<Order, 'id'>) => void;
}

export function AddOrderModal({ open, onOpenChange, onAdd }: AddOrderModalProps) {
  const [customerId, setCustomerId] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productType, setProductType] = useState("");
  const [productSpecs, setProductSpecs] = useState("");
  const [qty, setQty] = useState("");
  const [jobDate, setJobDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setCustomerId("");
    setProductCategory("");
    setProductType("");
    setProductSpecs("");
    setQty("");
    setJobDate("");
    setAssignedTo("");
    setSiteAddress("");
  };

  const handleAdd = async () => {
    if (!customerId) {
      toast({ title: "Required", description: "Please select a customer.", variant: "destructive" });
      return;
    }
    if (!productCategory || !productType || !productSpecs) {
      toast({ title: "Required", description: "Please complete the product selection.", variant: "destructive" });
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

    setSubmitting(true);
    
    // Create product name from selections
    const productName = `${productType} ${productSpecs}`;
    
    const newOrder: Omit<Order, 'id'> = {
      customerId,
      productId: `${productCategory.toLowerCase()}-${productType.toLowerCase()}-${productSpecs.toLowerCase()}`,
      qty: parseInt(qty),
      status: "pending",
      jobDate,
      assignedTo: assignedTo.trim(),
      siteAddress: siteAddress.trim()
    };

    onAdd(newOrder);
    resetForm();
    setSubmitting(false);
    onOpenChange(false);
  };

  const handleCategoryChange = (value: string) => {
    setProductCategory(value);
    setProductType("");
    setProductSpecs("");
  };

  const handleTypeChange = (value: string) => {
    setProductType(value);
    setProductSpecs("");
  };

  const getTypeOptions = () => {
    if (productCategory === "glass") {
      return [
        { value: "mirror", label: "Mirror" },
        { value: "plain", label: "Plain Float Glass" }
      ];
    }
    if (productCategory === "aluminum") {
      return [
        { value: "frame", label: "Aluminum Frame" }
      ];
    }
    return [];
  };

  const getSpecOptions = () => {
    if (productCategory === "glass" && productType === "mirror") {
      return [
        { value: "2mm", label: "2mm" },
        { value: "5mm", label: "5mm" }
      ];
    }
    if (productCategory === "glass" && productType === "plain") {
      return [
        { value: "2mm", label: "2mm" },
        { value: "4mm", label: "4mm" },
        { value: "6mm", label: "6mm" },
        { value: "8mm", label: "8mm" },
        { value: "12mm", label: "12mm" }
      ];
    }
    if (productCategory === "aluminum") {
      return [
        { value: "brown", label: "Brown" },
        { value: "silver", label: "Silver" },
        { value: "black", label: "Black" }
      ];
    }
    return [];
  };

  const isFormValid = customerId && productCategory && productType && productSpecs && qty && parseInt(qty) > 0 && jobDate && assignedTo.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Order</DialogTitle>
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
            <label className="block text-sm font-medium mb-1">Product Category</label>
            <Select value={productCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="glass">Glass</SelectItem>
                <SelectItem value="aluminum">Aluminum</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {productCategory && (
            <div>
              <label className="block text-sm font-medium mb-1">Product Type</label>
              <Select value={productType} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {getTypeOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {productType && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {productCategory === "glass" ? "Thickness" : "Color/Finish"}
              </label>
              <Select value={productSpecs} onValueChange={setProductSpecs}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${productCategory === "glass" ? "thickness" : "color"}`} />
                </SelectTrigger>
                <SelectContent>
                  {getSpecOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
        </div>
        <DialogFooter className="gap-2 pt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={submitting || !isFormValid}
            className="rounded-full px-8 py-2 bg-blue-700 hover:bg-blue-800 text-white shadow-lg font-semibold tracking-wide transition-all duration-150 focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:opacity-60"
          >
            Add Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
