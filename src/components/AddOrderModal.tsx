import { useState, useEffect, useRef } from "react";
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
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { Dialog as Modal, DialogContent as ModalContent } from "./ui/dialog";
import { Sheet, SheetContent } from "./ui/sheet";

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
  const [contactDropdownOpen, setContactDropdownOpen] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [pendingProductId, setPendingProductId] = useState("");
  const [pendingQty, setPendingQty] = useState("");
  const productSearchInputRef = useRef<HTMLInputElement>(null);

  // Update assignedTo when customer changes
  useEffect(() => {
    if (customerId) {
      const selectedCustomer = customers.find(c => c.id === customerId);
      if (selectedCustomer) {
        setAssignedTo(selectedCustomer.name);
      }
    }
  }, [customerId, customers]);

  useEffect(() => {
    if (productDropdownOpen && productSearchInputRef.current) {
      setTimeout(() => {
        productSearchInputRef.current && productSearchInputRef.current.blur();
      }, 50);
    }
  }, [productDropdownOpen]);

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

  const filteredContacts = customers.filter((c) =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase())
  );
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

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
      <DialogContent className="w-full h-full max-w-4xl sm:max-w-5xl md:max-w-6xl lg:max-w-[90vw] xl:max-w-[1200px] max-h-[90vh] min-h-[90vh] overflow-y-auto bg-blue-50 p-0 rounded-2xl shadow-xl border-0">
        <DialogHeader className="bg-blue-50 rounded-t-2xl px-6 pt-6 pb-2">
          <div className="flex items-center justify-between w-full">
            <DialogTitle className="text-2xl font-bold text-blue-900 flex items-center gap-2 m-0 p-0">
              Add New Order
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
            <label className="block text-sm font-medium mb-2 text-blue-900">Contact</label>
            <button
              type="button"
              className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3 text-base font-medium text-gray-700 focus:ring-2 focus:ring-blue-200 flex items-center justify-between h-14 min-h-[56px]"
              onClick={() => setContactDropdownOpen(true)}
            >
              {customerId ? customers.find((c) => c.id === customerId)?.name : "Select contact"}
              <ChevronDown className="ml-2 w-6 h-6 text-gray-400" />
            </button>
            <Sheet open={contactDropdownOpen} onOpenChange={setContactDropdownOpen}>
              <SheetContent side="bottom" className="w-full max-h-[80vh] min-h-[80vh] rounded-t-3xl p-0 bg-blue-50 border-0 shadow-2xl">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xl font-bold text-blue-900">Select Customer</div>
                    <button
                      type="button"
                      className="ml-4 p-2 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      aria-label="Close"
                      onClick={() => setContactDropdownOpen(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                  <div className="flex items-center bg-white rounded-xl px-4 py-3 mb-4 border border-gray-200">
                    <Search className="w-6 h-6 text-gray-400 mr-2" />
                    <input
                      type="text"
                      className="flex-1 bg-transparent outline-none text-base placeholder:text-gray-400 cursor-pointer focus:cursor-text"
                      placeholder="Search"
                      value={contactSearch}
                      onChange={e => setContactSearch(e.target.value)}
                      tabIndex={0}
                      autoFocus={false}
                      
                    />
                  </div>
                  <div className="max-h-80 overflow-y-auto rounded-xl bg-white">
                    {filteredContacts.length === 0 ? (
                      <div className="text-gray-400 text-lg text-center py-8">No contacts found.</div>
                    ) : (
                      filteredContacts.map((c) => (
                        <button
                          key={c.id}
                          className={`w-full text-left px-5 py-3 text-base font-medium rounded-xl hover:bg-blue-100 transition mb-1 h-14 min-h-[56px] ${customerId === c.id ? "bg-blue-50 text-blue-700" : "text-gray-900"}`}
                          onClick={() => {
                            setCustomerId(c.id);
                            setContactDropdownOpen(false);
                          }}
                        >
                          {c.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-blue-900">Product</label>
              <button
                type="button"
                className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3 text-base font-medium text-gray-700 focus:ring-2 focus:ring-blue-200 flex items-center justify-between h-14 min-h-[56px]"
                onClick={() => setProductDropdownOpen(true)}
              >
                {productId ? products.find((p) => p.id === productId)?.name : "Select product"}
                <ChevronDown className="ml-2 w-6 h-6 text-gray-400" />
              </button>
              <Sheet open={productDropdownOpen} onOpenChange={(open) => {
                if (!open) {
                  setPendingProductId("");
                  setPendingQty("");
                  setProductSearch("");
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
                    {!pendingProductId ? (
                      <>
                        <div className="flex items-center bg-white rounded-xl px-4 py-3 mb-4 border border-gray-200">
                          <Search className="w-6 h-6 text-gray-400 mr-2" />
                          <input
                            type="text"
                            className="flex-1 bg-transparent outline-none text-base placeholder:text-gray-400 cursor-pointer focus:cursor-text"
                            placeholder="Search"
                            value={productSearch}
                            onChange={e => setProductSearch(e.target.value)}
                            tabIndex={1}
                            autoFocus={false}
                            onFocus={e => e.target.select()}
                            ref={productSearchInputRef}
                          />
                        </div>
                        <div className="max-h-80 overflow-y-auto rounded-xl bg-white">
                          {filteredProducts.length === 0 ? (
                            <div className="text-gray-400 text-lg text-center py-8">No products found.</div>
                          ) : (
                            filteredProducts.map((p) => (
                              <button
                                key={p.id}
                                className={`w-full text-left px-5 py-3 text-base font-medium rounded-xl hover:bg-blue-100 transition mb-1 h-14 min-h-[56px] ${productId === p.id ? "bg-blue-50 text-blue-700" : "text-gray-900"}`}
                                onClick={() => {
                                  setPendingProductId(p.id);
                                  setPendingQty("");
                                }}
                              >
                                {p.name}
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mb-4">
                          <div className="text-base font-semibold text-blue-900 mb-2">{products.find(p => p.id === pendingProductId)?.name}</div>
                          <Input
                            type="number"
                            placeholder="Enter quantity"
                            value={pendingQty}
                            onChange={e => setPendingQty(e.target.value)}
                            min="1"
                            className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3 text-base font-medium text-gray-700 focus:ring-2 focus:ring-blue-200 h-14 min-h-[56px]"
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button
                            className="flex-1 rounded-2xl px-5 py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-base"
                            disabled={!pendingQty || parseInt(pendingQty) <= 0}
                            onClick={() => {
                              setProductId(pendingProductId);
                              setQty(pendingQty);
                              setProductDropdownOpen(false);
                              setPendingProductId("");
                              setPendingQty("");
                              setProductSearch("");
                            }}
                          >
                            Confirm
                          </Button>
                          <Button
                            className="flex-1 rounded-2xl px-5 py-3 bg-gray-100 text-gray-700 font-semibold text-base"
                            variant="outline"
                            onClick={() => {
                              setPendingProductId("");
                              setPendingQty("");
                            }}
                          >
                            Back
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-blue-900">Quantity</label>
              <Input
                type="number"
                placeholder="Enter quantity"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                min="1"
                className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3 text-base font-medium text-gray-700 focus:ring-2 focus:ring-blue-200 h-14 min-h-[56px]"
                disabled
              />
            </div>
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
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-500 text-base">Sub Total ({qtyNum})</div>
              <div className="text-gray-700 font-medium text-base">₹{total}</div>
            </div>
            {advanceNum > 0 && (
              <div className="flex items-center justify-between mb-2">
                <div className="text-green-700 text-base">Advance Paid</div>
                <div className="text-green-700 font-medium text-base">₹{advanceNum}</div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="font-bold text-base text-gray-900">Pending Amount</div>
              <div className={pending > 0 ? "text-red-600 font-bold text-base" : "text-green-700 font-bold text-base"}>₹{pending}</div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="px-8 py-4 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-base">Cancel</Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleAdd}
              disabled={submitting || !isFormValid}
              className="rounded-2xl px-10 py-4 bg-blue-700 hover:bg-blue-800 text-white shadow-lg font-semibold tracking-wide transition-all duration-150 focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:opacity-60 text-base"
            >
              {submitting ? "Adding..." : "Create Order"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
