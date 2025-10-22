import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { CalendarIcon, Plus, Minus, Share, Calculator } from "lucide-react";
import { format } from "date-fns";

type Item = { 
  productId: string;
  name: string; 
  qty: number; 
  price: number; 
  tax_rate?: number;
  amount?: number;
};

type InitialData = {
  customerName?: string;
  customerPhone?: string;
  items?: Item[];
};

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

interface Profile {
  name: string;
  shop_name: string;
  business_address: string;
  gst_number: string;
  pan_number: string;
  state: string;
  pincode: string;
  bank_name: string;
  ifsc_code: string;
  upi_id: string;
  terms_conditions: string;
}

export function EnhancedBillCreateModal({
  open,
  setOpen,
  onBillCreated,
  initialData = {}
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  onBillCreated: () => void;
  initialData?: InitialData;
}) {
  const { user } = useSession();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Bill data
  const [billNumber, setBillNumber] = useState(`INV-${Date.now()}`);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [billDate, setBillDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dueDate, setDueDate] = useState(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"));
  const [paymentTerms, setPaymentTerms] = useState("30 days");
  const [notes, setNotes] = useState("");
  
  // Items and calculations
  const [items, setItems] = useState<Item[]>([{ productId: "", name: "", qty: 1, price: 0, tax_rate: 18 }]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxRate, setTaxRate] = useState(18);

  useEffect(() => {
    if (user && open) {
      fetchProfile();
      fetchCustomers();
      fetchProducts();
      
      if (initialData?.items?.length) {
        setItems(initialData.items.map(item => ({ 
          productId: item.productId || "",
          name: item.name,
          qty: item.qty,
          price: item.price,
          tax_rate: 18 
        })));
      }
      
      // Set customer if provided in initial data
      if (initialData?.customerName) {
        // Find customer by name and set the ID
        const timer = setTimeout(() => {
          const customer = customers.find(c => c.name === initialData.customerName);
          if (customer) {
            setSelectedCustomerId(customer.id);
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [user, open, initialData, customers]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("name, shop_name, business_address, gst_number, pan_number, state, pincode, bank_name, ifsc_code, upi_id, terms_conditions")
      .eq("id", user.id)
      .maybeSingle();

    if (data) {
      setProfile({
        name: data.name || "",
        shop_name: data.shop_name || "",
        business_address: data.business_address || "",
        gst_number: data.gst_number || "",
        pan_number: data.pan_number || "",
        state: data.state || "",
        pincode: data.pincode || "",
        bank_name: data.bank_name || "",
        ifsc_code: data.ifsc_code || "",
        upi_id: data.upi_id || "",
        terms_conditions: data.terms_conditions || ""
      });
      
      if (data.terms_conditions) {
        setPaymentTerms(data.terms_conditions);
      }
    }
    
    if (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Profile incomplete",
        description: "Please complete your business profile first for proper GST billing.",
        variant: "destructive",
      });
    }
  };

  const fetchCustomers = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", user.id)
      .order("name");
    
    if (error) {
      console.error("Error fetching customers:", error);
      return;
    }
    
    setCustomers(data || []);
  };

  const fetchProducts = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("name");
    
    if (error) {
      console.error("Error fetching products:", error);
      return;
    }
    
    setProducts(data || []);
  };

  const getSelectedCustomer = () => {
    return customers.find(c => c.id === selectedCustomerId);
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const taxAmount = (subtotal - discountAmount) * (taxRate / 100);
  const total = subtotal - discountAmount + taxAmount;

  const handleAddItem = () => {
    setItems([...items, { productId: "", name: "", qty: 1, price: 0, tax_rate: taxRate }]);
  };

  const handleItemChange = (index: number, field: keyof Item, value: any) => {
    const newItems = [...items];
    
    if (field === 'productId') {
      // Auto-populate name and price when product is selected
      const product = products.find(p => p.id === value);
      newItems[index] = {
        ...newItems[index],
        productId: value,
        name: product?.name || "",
        price: product?.price || 0
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const selectedCustomer = getSelectedCustomer();
    
    if (!selectedCustomer) {
      toast({ title: "Please select a customer", variant: "destructive" });
      return;
    }

    if (items.some(item => !item.productId || item.qty <= 0 || item.price < 0)) {
      toast({ title: "All items must have valid product, quantity and price", variant: "destructive" });
      return;
    }

    setLoading(true);

    const billData = {
      user_id: user.id,
      bill_number: billNumber,
      customer_name: selectedCustomer.name,
      customer_phone: selectedCustomer.phone,
      bill_date: billDate,
      due_date: dueDate,
      items: items.map(item => ({
        name: item.name,
        qty: Number(item.qty),
        price: Number(item.price),
        tax_rate: Number(item.tax_rate || taxRate),
        amount: Number(item.qty) * Number(item.price)
      })),
      subtotal: subtotal,
      discount_amount: discountAmount,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total: total,
      payment_terms: paymentTerms,
      notes: notes,
    };

    const { error } = await supabase.from("bills").insert([billData]);

    setLoading(false);

    if (error) {
      toast({
        title: "Error creating bill",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Bill created successfully" });
      
      // Reset form
      setBillNumber(`INV-${Date.now()}`);
      setSelectedCustomerId("");
      setItems([{ productId: "", name: "", qty: 1, price: 0, tax_rate: 18 }]);
      setDiscountAmount(0);
      setNotes("");
      
      setOpen(false);
      onBillCreated();
    }
  };

  const shareViaWhatsApp = () => {
    const selectedCustomer = getSelectedCustomer();
    if (!selectedCustomer?.phone) {
      toast({ title: "Customer phone number required for WhatsApp", variant: "destructive" });
      return;
    }
    
    const businessName = profile?.shop_name || profile?.name || 'Business';
    const message = `
*TAX INVOICE - ${billNumber}*
${businessName}
${profile?.business_address ? `📍 ${profile.business_address}` : ''}
${profile?.gst_number ? `🆔 GST: ${profile.gst_number}` : ''}
${profile?.pan_number ? `📄 PAN: ${profile.pan_number}` : ''}

💼 *BILL TO:*
${selectedCustomer.name}
📞 ${selectedCustomer.phone}

📅 Date: ${format(new Date(billDate), "dd/MM/yyyy")}
📅 Due Date: ${format(new Date(dueDate), "dd/MM/yyyy")}

📋 *ITEMS:*
${items.map(item => `• ${item.name}\n  ${item.qty} × ₹${item.price} = ₹${(item.qty * item.price).toFixed(2)}`).join('\n')}

💰 *CALCULATION:*
Subtotal: ₹${subtotal.toFixed(2)}
${discountAmount > 0 ? `Discount: -₹${discountAmount.toFixed(2)}\n` : ''}Tax (${taxRate}%): ₹${taxAmount.toFixed(2)}
*Total Amount: ₹${total.toFixed(2)}*

${paymentTerms ? `⏰ Payment Terms: ${paymentTerms}` : ''}
${profile?.upi_id ? `💳 UPI: ${profile.upi_id}` : ''}
${profile?.bank_name ? `🏦 Bank: ${profile.bank_name}` : ''}
${notes ? `\n📝 ${notes}` : ''}

Thank you for your business! 🙏
    `.trim();

    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = selectedCustomer.phone.replace(/[\s\-\(\)]/g, '');
    const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-full h-full max-w-4xl sm:max-w-5xl md:max-w-6xl lg:max-w-[90vw] xl:max-w-[1200px] max-h-[90vh] min-h-[90vh] overflow-y-auto bg-blue-50 p-0 rounded-2xl shadow-xl border-0">
        <DialogHeader className="bg-blue-50 rounded-t-2xl px-6 pt-6 pb-2">
          <div className="flex items-center justify-between w-full">
            <DialogTitle className="text-2xl font-bold text-blue-900 flex items-center gap-2 m-0 p-0">
              <Calculator className="h-6 w-6" />
              Create GST Bill
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2 pb-6 px-6">
          {/* Bill Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-blue-900">Bill Number</label>
              <Input
                id="bill_number"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                required
                className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3 text-base font-medium text-gray-700 focus:ring-2 focus:ring-blue-200 h-14 min-h-[56px]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-blue-900">Bill Date</label>
              <Input
                id="bill_date"
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                required
                className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3 text-base font-medium text-gray-700 focus:ring-2 focus:ring-blue-200 h-14 min-h-[56px]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-blue-900">Due Date</label>
              <Input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3 text-base font-medium text-gray-700 focus:ring-2 focus:ring-blue-200 h-14 min-h-[56px]"
              />
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-900">Customer Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-blue-900">Customer *</label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3 text-base font-medium text-gray-700 focus:ring-2 focus:ring-blue-200 h-14 min-h-[56px]">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-xl border border-gray-200">
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id} className="text-base py-3">
                        {customer.name} ({customer.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-blue-900">Phone Number</label>
                <Input
                  value={getSelectedCustomer()?.phone || ""}
                  disabled
                  placeholder="Phone will auto-populate"
                  className="bg-gray-100 rounded-2xl border border-gray-200 shadow-sm px-5 py-3 text-base font-medium text-gray-500 h-14 min-h-[56px]"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-blue-900">Items</h3>
              <Button type="button" onClick={handleAddItem} size="sm" className="bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-5">
                      <label className="block text-xs font-medium mb-1.5 text-blue-900">Product</label>
                      <Select 
                        value={item.productId} 
                        onValueChange={(value) => handleItemChange(index, "productId", value)}
                      >
                        <SelectTrigger className="bg-white rounded-xl border border-gray-200 px-3 py-2 text-sm h-10">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-xl border border-gray-200">
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id} className="text-sm">
                              {product.name} - ₹{product.price}/{product.unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium mb-1.5 text-blue-900">Qty</label>
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleItemChange(index, "qty", Number(e.target.value))}
                        required
                        className="bg-white rounded-xl border border-gray-200 px-3 py-2 text-sm h-10"
                      />
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium mb-1.5 text-blue-900">Price</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, "price", Number(e.target.value))}
                        required
                        className="bg-white rounded-xl border border-gray-200 px-3 py-2 text-sm h-10"
                      />
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium mb-1.5 text-blue-900">Tax %</label>
                      <Select 
                        value={String(item.tax_rate || taxRate)} 
                        onValueChange={(value) => handleItemChange(index, "tax_rate", Number(value))}
                      >
                        <SelectTrigger className="bg-white rounded-xl border border-gray-200 px-3 py-2 text-sm h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-xl border border-gray-200">
                          <SelectItem value="0" className="text-sm">0%</SelectItem>
                          <SelectItem value="5" className="text-sm">5%</SelectItem>
                          <SelectItem value="12" className="text-sm">12%</SelectItem>
                          <SelectItem value="18" className="text-sm">18%</SelectItem>
                          <SelectItem value="28" className="text-sm">28%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="sm:col-span-1 flex items-end justify-between sm:justify-center gap-2">
                      <div className="flex-1 sm:hidden">
                        <label className="block text-xs font-medium mb-1.5 text-blue-900">Amount</label>
                        <div className="text-sm font-semibold text-blue-900">
                          ₹{(item.qty * item.price).toFixed(2)}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        className="hover:bg-red-50 hover:text-red-600 rounded-lg"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="hidden sm:block mt-2 text-right">
                    <span className="text-xs text-gray-500">Amount: </span>
                    <span className="text-sm font-semibold text-blue-900">₹{(item.qty * item.price).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Calculations */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-blue-900">Discount Amount</label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3 text-base font-medium text-gray-700 focus:ring-2 focus:ring-blue-200 h-14 min-h-[56px]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-blue-900">Overall Tax Rate %</label>
                <Select value={String(taxRate)} onValueChange={(value) => setTaxRate(Number(value))}>
                  <SelectTrigger className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3 text-base font-medium text-gray-700 focus:ring-2 focus:ring-blue-200 h-14 min-h-[56px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-xl border border-gray-200">
                    <SelectItem value="0" className="text-base py-3">0%</SelectItem>
                    <SelectItem value="5" className="text-base py-3">5%</SelectItem>
                    <SelectItem value="12" className="text-base py-3">12%</SelectItem>
                    <SelectItem value="18" className="text-base py-3">18%</SelectItem>
                    <SelectItem value="28" className="text-base py-3">28%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bill Summary */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 space-y-3">
              <div className="flex justify-between text-base text-gray-700">
                <span>Subtotal:</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-base text-green-600">
                  <span>Discount:</span>
                  <span className="font-medium">-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base text-gray-700">
                <span>Tax ({taxRate}%):</span>
                <span className="font-medium">₹{taxAmount.toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold text-blue-900">
                <span>Total:</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <label className="block text-sm font-medium mb-2 text-blue-900">Payment Terms</label>
            <Input
              id="payment_terms"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="Payment terms"
              className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3 text-base font-medium text-gray-700 focus:ring-2 focus:ring-blue-200 h-14 min-h-[56px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-blue-900">Notes</label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or terms"
              rows={3}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3 text-base font-medium text-gray-700 focus:ring-2 focus:ring-blue-200 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 py-4 text-base font-semibold h-14 min-h-[56px]"
            >
              {loading ? "Creating..." : "Create Bill"}
            </Button>
            
            {getSelectedCustomer()?.phone && (
              <Button
                type="button"
                variant="outline"
                onClick={shareViaWhatsApp}
                className="flex-1 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 rounded-2xl px-6 py-4 text-base font-semibold h-14 min-h-[56px]"
              >
                <Share className="h-5 w-5 mr-2" />
                Share via WhatsApp
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}