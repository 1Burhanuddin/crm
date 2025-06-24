import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "@/hooks/use-toast";
import { Order, OrderProduct, Customer, Product } from "@/constants/types";
import { Plus, Search, ChevronDown, ChevronUp, Edit, Trash2, UserPlus } from "lucide-react";
import { Sheet, SheetContent } from "./ui/sheet";
import { AddCustomerDialog } from "./AddCustomerDialog";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { useAddCustomerFromContacts } from "./hooks/useAddCustomerFromContacts";
import { AddProductModal } from "./AddProductModal";
import { useQueryClient } from "@tanstack/react-query";

interface EditOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (order: Order) => void;
  order: Order | null;
  customers: Customer[];
  products: Product[];
}

export function EditOrderModal({ open, onOpenChange, onEdit, order, customers, products }: EditOrderModalProps) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [customerId, setCustomerId] = useState("");
  const [productsList, setProductsList] = useState<{ productId: string; qty: string }[]>([]);
  const [jobDate, setJobDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [status, setStatus] = useState<"pending" | "delivered">("pending");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [pendingProductId, setPendingProductId] = useState("");
  const [pendingQty, setPendingQty] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showQuantitySheet, setShowQuantitySheet] = useState(false);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [contactDropdownOpen, setContactDropdownOpen] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [addCustomerDialogOpen, setAddCustomerDialogOpen] = useState(false);
  const productSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (order && open) {
      setCustomerId(order.customerId);
      setProductsList(order.products.map(p => ({ productId: p.productId, qty: p.qty.toString() })));
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

  useEffect(() => {
    if (productDropdownOpen && productSearchInputRef.current) {
      setTimeout(() => {
        productSearchInputRef.current && productSearchInputRef.current.focus();
      }, 100);
    }
  }, [productDropdownOpen]);

  // Helper to get product price for preview
  const getProduct = (id: string) => products.find((p) => p.id === id);
  const advanceNum = advanceAmount ? parseFloat(advanceAmount) : 0;
  const total = productsList.reduce((sum, item) => {
    const prod = getProduct(item.productId);
    return sum + (prod ? prod.price * (parseInt(item.qty) || 0) : 0);
  }, 0);
  const pending = Math.max(0, total - advanceNum);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleAddProduct = () => {
    if (!pendingProductId || !pendingQty || parseInt(pendingQty) <= 0) return;
    if (editingIndex !== null) {
      // Edit existing
      setProductsList((prev) => prev.map((item, idx) => idx === editingIndex ? { productId: pendingProductId, qty: pendingQty } : item));
      setEditingIndex(null);
    } else {
      // Add new
      setProductsList((prev) => [...prev, { productId: pendingProductId, qty: pendingQty }]);
    }
    setPendingProductId("");
    setPendingQty("");
    setShowQuantitySheet(false);
    setProductSearch("");
  };

  const handleProductSelect = (productId: string) => {
    setPendingProductId(productId);
    setProductDropdownOpen(false);
    setShowQuantitySheet(true);
  };

  const handleEditProduct = (idx: number) => {
    setPendingProductId(productsList[idx].productId);
    setPendingQty(productsList[idx].qty);
    setEditingIndex(idx);
    setShowQuantitySheet(true);
  };

  const handleRemoveProduct = (idx: number) => {
    setProductsList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleEdit = async () => {
    if (!order) return;
    
    if (!customerId) {
      toast({ title: "Required", description: "Please select a customer.", variant: "destructive" });
      return;
    }
    if (productsList.length === 0) {
      toast({ title: "Required", description: "Please add at least one product.", variant: "destructive" });
      return;
    }
    if (productsList.some((item) => !item.productId || !item.qty || parseInt(item.qty) <= 0)) {
      toast({ title: "Required", description: "Please enter valid quantities for all products.", variant: "destructive" });
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
      products: productsList.map((item) => ({ productId: item.productId, qty: parseInt(item.qty) })),
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

  const isFormValid = customerId && productsList.length > 0 && 
    productsList.every(p => p.productId && p.qty && parseInt(p.qty) > 0) && 
    jobDate && assignedTo.trim() && advanceNum >= 0 && advanceNum <= total;

  // Add this function to refresh products after adding a new one
  const refreshProducts = () => {
    queryClient.invalidateQueries({ queryKey: ["products", user?.id] });
  };

  const { filteredContacts, addFromContacts } = useAddCustomerFromContacts(customerId, setCustomerId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-4xl sm:max-w-5xl md:max-w-6xl lg:max-w-[90vw] xl:max-w-[1200px] max-h-[90vh] min-h-[90vh] overflow-y-auto bg-blue-50 p-0 rounded-2xl shadow-xl border-0">
        <DialogHeader className="bg-blue-50 rounded-t-2xl px-6 pt-6 pb-2">
          <div className="flex items-center justify-between w-full">
            <DialogTitle className="text-2xl font-bold text-blue-900 flex items-center gap-2 m-0 p-0">
              Edit Order
            </DialogTitle>
            <DialogClose asChild>
              <button
                type="button"
                className="ml-4 p-2 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </DialogClose>
          </div>
        </DialogHeader>
        <div className="space-y-6 pt-2 pb-6 px-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-blue-900">Customer</label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3 text-base font-medium text-gray-700 focus:ring-2 focus:ring-blue-200 h-14 min-h-[56px]">
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
            <label className="block text-sm font-medium mb-2 text-blue-900">Products</label>
            <div className="space-y-2">
              {productsList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-4 py-2">
                  <span className="flex-1">
                    {getProduct(item.productId)?.name || 'Unknown'} (Qty: {item.qty})
                  </span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleEditProduct(idx)}
                    className="h-8 w-8 p-0 rounded-full hover:bg-blue-100"
                  >
                    <Edit className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleRemoveProduct(idx)}
                    className="h-8 w-8 p-0 rounded-full hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                className="w-full mt-2"
                onClick={() => {
                  setPendingProductId("");
                  setPendingQty("");
                  setEditingIndex(null);
                  setProductDropdownOpen(true);
                }}
              >
                + Add Product
              </Button>
            </div>
            <Sheet open={productDropdownOpen} onOpenChange={(open) => {
              if (!open) {
                setPendingProductId("");
                setPendingQty("");
                setProductSearch("");
                setEditingIndex(null);
              }
              setProductDropdownOpen(open);
            }}>
              <SheetContent side="bottom" className="w-full max-h-[80vh] min-h-[80vh] rounded-t-3xl p-0 bg-blue-50 border-0 shadow-2xl">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xl font-bold text-blue-900">Select Product</div>
                    <button
                      type="button"
                      className="ml-4 p-2 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      aria-label="Close"
                      onClick={() => setProductDropdownOpen(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                  <div className="flex items-center bg-white rounded-xl px-4 py-3 mb-4 border border-gray-200">
                    <Search className="w-6 h-6 text-gray-400 mr-2" />
                    <input
                      type="text"
                      className="flex-1 bg-transparent outline-none text-base placeholder:text-gray-400 cursor-text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      autoFocus={true}
                      ref={productSearchInputRef}
                    />
                  </div>
                  <div className="max-h-[calc(80vh-280px)] overflow-y-auto rounded-xl bg-white mb-4">
                    {filteredProducts.length === 0 ? (
                      <div className="text-gray-400 text-lg text-center py-8">No products found.</div>
                    ) : (
                      filteredProducts.map((p) => (
                        <button
                          key={p.id}
                          className={`w-full text-left px-5 py-3 text-base font-medium rounded-xl hover:bg-blue-100 transition mb-1 h-14 min-h-[56px] ${pendingProductId === p.id ? "bg-blue-50 text-blue-700" : "text-gray-900"}`}
                          onClick={() => {
                            console.log('Product selected:', p);
                            handleProductSelect(p.id);
                          }}
                        >
                          {p.name}
                        </button>
                      ))
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAddProductDialogOpen(true);
                    }}
                    className="w-full bg-white flex items-center justify-center gap-2 px-5 py-3 text-base font-medium text-blue-700 hover:bg-gray-50 rounded-xl transition h-14 min-h-[56px] border border-gray-200"
                  >
                    <Plus className="w-5 h-5" />
                    Add New Product
                  </button>
                </div>
              </SheetContent>
            </Sheet>

            <Sheet open={showQuantitySheet} onOpenChange={(open) => {
              if (!open) {
                setPendingProductId("");
                setPendingQty("");
                setEditingIndex(null);
              }
              setShowQuantitySheet(open);
            }}>
              <SheetContent side="bottom" className="w-full max-h-[80vh] min-h-[80vh] rounded-t-3xl p-0 bg-blue-50 border-0 shadow-2xl">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xl font-bold text-blue-900">Enter Quantity</div>
                    <button
                      type="button"
                      className="ml-4 p-2 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      aria-label="Close"
                      onClick={() => setShowQuantitySheet(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                  <div className="mb-6">
                    <div className="text-base font-semibold text-blue-900 mb-2">Selected Product</div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <div className="text-lg font-medium text-gray-900">{getProduct(pendingProductId)?.name}</div>
                      <div className="text-sm text-gray-500">₹{getProduct(pendingProductId)?.price} per {getProduct(pendingProductId)?.unit}</div>
                    </div>
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2 text-blue-900">Quantity</label>
                    <Input
                      type="number"
                      placeholder="Enter quantity"
                      value={pendingQty}
                      onChange={e => setPendingQty(e.target.value)}
                      min="1"
                      autoFocus={true}
                      className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3 text-base font-medium text-gray-700 focus:ring-2 focus:ring-blue-200 h-14 min-h-[56px]"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 rounded-2xl px-5 py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-base"
                      disabled={!pendingQty || parseInt(pendingQty) <= 0}
                      onClick={handleAddProduct}
                    >
                      {editingIndex !== null ? 'Update' : 'Add Product'}
                    </Button>
                    <Button
                      className="flex-1 rounded-2xl px-5 py-3 bg-gray-100 text-gray-700 font-semibold text-base"
                      variant="outline"
                      onClick={() => {
                        setPendingProductId("");
                        setPendingQty("");
                        setEditingIndex(null);
                        setShowQuantitySheet(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-blue-900">Job Date</label>
              <Input
                type="date"
                value={jobDate}
                onChange={(e) => setJobDate(e.target.value)}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3 text-base font-medium text-gray-700 focus:ring-2 focus:ring-blue-200 h-14 min-h-[56px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-blue-900">Assigned To</label>
              <Input
                placeholder="Enter assigned person"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                maxLength={50}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3 text-base font-medium text-gray-700 focus:ring-2 focus:ring-blue-200 h-14 min-h-[56px]"
              />
            </div>
          </div>

          <div className="border rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdditionalFields(!showAdditionalFields)}
              className="w-full px-5 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-base font-medium text-gray-700 transition-colors h-14 min-h-[56px]"
            >
              <span>Additional Fields</span>
              {showAdditionalFields ? (
                <ChevronUp className="h-6 w-6" />
              ) : (
                <ChevronDown className="h-6 w-6" />
              )}
            </button>
            {showAdditionalFields && (
              <div className="p-6 space-y-6 bg-white">
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-900">Site Address</label>
                  <Input
                    placeholder="Enter site address"
                    value={siteAddress}
                    onChange={(e) => setSiteAddress(e.target.value)}
                    maxLength={200}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3 text-base font-medium text-gray-700 focus:ring-2 focus:ring-blue-200 h-14 min-h-[56px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-900">Remarks</label>
                  <Input
                    placeholder="Enter any additional remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    maxLength={200}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3 text-base font-medium text-gray-700 focus:ring-2 focus:ring-blue-200 h-14 min-h-[56px]"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-blue-900">Advance Amount (₹)</label>
            <Input
              type="number"
              placeholder="Advance amount"
              value={advanceAmount}
              onChange={(e) => setAdvanceAmount(e.target.value)}
              min="0"
              max={total}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3 text-base font-medium text-gray-700 focus:ring-2 focus:ring-blue-200 h-14 min-h-[56px]"
            />
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="font-semibold text-base text-gray-700 mb-3">Order Summary</div>
            {productsList.map((item, idx) => {
              const prod = getProduct(item.productId);
              return (
                <div key={idx} className="flex items-center justify-between mb-2">
                  <div className="text-gray-500 text-base">{prod?.name || 'Product'} (Qty: {item.qty})</div>
                  <div className="text-gray-700 font-medium text-base">₹{prod ? prod.price * (parseInt(item.qty) || 0) : 0}</div>
                </div>
              );
            })}
            <div className="flex items-center justify-between mt-2 border-t pt-2">
              <div className="text-gray-700 font-semibold text-base">Total</div>
              <div className="text-blue-900 font-bold text-lg">₹{total}</div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-gray-700 text-base">Advance</div>
              <div className="text-blue-700 font-semibold text-base">₹{advanceNum}</div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-gray-700 text-base">Pending</div>
              <div className="text-orange-700 font-semibold text-base">₹{pending}</div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="px-8 py-4 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-base">Cancel</Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleEdit}
              disabled={submitting || !isFormValid}
              className="rounded-2xl px-10 py-4 bg-blue-700 hover:bg-blue-800 text-white shadow-lg font-semibold tracking-wide transition-all duration-150 focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:opacity-60 text-base"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>

      <AddProductModal 
        open={addProductDialogOpen} 
        onOpenChange={setAddProductDialogOpen}
        onSuccess={refreshProducts}
      />

      <AddCustomerDialog 
        open={addCustomerDialogOpen} 
        onOpenChange={setAddCustomerDialogOpen}
      />
    </Dialog>
  );
}
