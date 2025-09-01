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
  
  // Bill data
  const [billNumber, setBillNumber] = useState(`INV-${Date.now()}`);
  const [customerName, setCustomerName] = useState(initialData?.customerName || "");
  const [customerPhone, setCustomerPhone] = useState(initialData?.customerPhone || "");
  const [customerAddress, setCustomerAddress] = useState("");
  const [billDate, setBillDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dueDate, setDueDate] = useState(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"));
  const [paymentTerms, setPaymentTerms] = useState("30 days");
  const [notes, setNotes] = useState("");
  
  // Items and calculations
  const [items, setItems] = useState<Item[]>([{ name: "", qty: 1, price: 0, tax_rate: 18 }]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxRate, setTaxRate] = useState(18);

  useEffect(() => {
    if (user && open) {
      fetchProfile();
      if (initialData?.items?.length) {
        setItems(initialData.items.map(item => ({ ...item, tax_rate: 18 })));
      }
    }
  }, [user, open, initialData]);

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

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const taxAmount = (subtotal - discountAmount) * (taxRate / 100);
  const total = subtotal - discountAmount + taxAmount;

  const handleAddItem = () => {
    setItems([...items, { name: "", qty: 1, price: 0, tax_rate: taxRate }]);
  };

  const handleItemChange = (index: number, field: keyof Item, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
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

    if (!customerName.trim()) {
      toast({ title: "Customer name is required", variant: "destructive" });
      return;
    }

    if (items.some(item => !item.name.trim() || item.qty <= 0 || item.price < 0)) {
      toast({ title: "All items must have valid name, quantity and price", variant: "destructive" });
      return;
    }

    setLoading(true);

    const billData = {
      user_id: user.id,
      bill_number: billNumber,
      customer_name: customerName,
      customer_phone: customerPhone,
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
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setItems([{ name: "", qty: 1, price: 0, tax_rate: 18 }]);
      setDiscountAmount(0);
      setNotes("");
      
      setOpen(false);
      onBillCreated();
    }
  };

  const shareViaWhatsApp = () => {
    if (!customerPhone) {
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
${customerName}
📞 ${customerPhone}
${customerAddress ? `📍 ${customerAddress}` : ''}

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
    const cleanPhone = customerPhone.replace(/[\s\-\(\)]/g, '');
    const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Create GST Bill
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bill Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bill_number">Bill Number</Label>
              <Input
                id="bill_number"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bill_date">Bill Date</Label>
              <Input
                id="bill_date"
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Customer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customer_phone">Phone Number</Label>
                <Input
                  id="customer_phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone Number"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customer_address">Customer Address</Label>
              <Textarea
                id="customer_address"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Customer Address"
                rows={2}
              />
            </div>
          </div>

          <Separator />

          {/* Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Items</h3>
              <Button type="button" onClick={handleAddItem} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Label>Item Name</Label>
                    <Input
                      value={item.name}
                      onChange={(e) => handleItemChange(index, "name", e.target.value)}
                      placeholder="Item name"
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => handleItemChange(index, "qty", Number(e.target.value))}
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label>Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, "price", Number(e.target.value))}
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label>Tax %</Label>
                    <Select 
                      value={String(item.tax_rate || taxRate)} 
                      onValueChange={(value) => handleItemChange(index, "tax_rate", Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="12">12%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                        <SelectItem value="28">28%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-1">
                    <Label>Amount</Label>
                    <div className="h-10 flex items-center text-sm text-muted-foreground">
                      ₹{(item.qty * item.price).toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Calculations */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount">Discount Amount</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tax_rate">Overall Tax Rate %</Label>
                <Select value={String(taxRate)} onValueChange={(value) => setTaxRate(Number(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="12">12%</SelectItem>
                    <SelectItem value="18">18%</SelectItem>
                    <SelectItem value="28">28%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bill Summary */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount:</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Tax ({taxRate}%):</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_terms">Payment Terms</Label>
              <Input
                id="payment_terms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="Payment terms"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or terms"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Creating..." : "Create Bill"}
            </Button>
            
            {customerPhone && (
              <Button
                type="button"
                variant="outline"
                onClick={shareViaWhatsApp}
                className="flex-1"
              >
                <Share className="h-4 w-4 mr-2" />
                Share via WhatsApp
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}