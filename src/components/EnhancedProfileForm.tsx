import { useState, useEffect } from "react";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Building2, CreditCard, Banknote, FileText, MapPin } from "lucide-react";

interface ProfileData {
  email: string;
  name: string | null;
  shop_name: string | null;
  business_address: string | null;
  gst_number: string | null;
  pan_number: string | null;
  business_type: string;
  state: string | null;
  pincode: string | null;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  upi_id: string | null;
  terms_conditions: string | null;
}

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export function EnhancedProfileForm() {
  const { user } = useSession();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    email: "",
    name: null,
    shop_name: null,
    business_address: null,
    gst_number: null,
    pan_number: null,
    business_type: "individual",
    state: null,
    pincode: null,
    bank_name: null,
    account_number: null,
    ifsc_code: null,
    upi_id: null,
    terms_conditions: null,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (data) {
      setProfile({
        email: data.email,
        name: data.name,
        shop_name: data.shop_name,
        business_address: data.business_address,
        gst_number: data.gst_number,
        pan_number: data.pan_number,
        business_type: data.business_type || "individual",
        state: data.state,
        pincode: data.pincode,
        bank_name: data.bank_name,
        account_number: data.account_number,
        ifsc_code: data.ifsc_code,
        upi_id: data.upi_id,
        terms_conditions: data.terms_conditions,
      });
    }
    
    if (error) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update(profile)
      .eq("id", user.id);

    setLoading(false);

    if (error) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile updated successfully",
        description: "Your business information has been saved.",
      });
    }
  };

  const updateProfile = (field: keyof ProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Business Profile</h1>
        <p className="text-muted-foreground">Manage your business information for GST billing</p>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Basic Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={profile.name || ""}
              onChange={(e) => updateProfile("name", e.target.value)}
              placeholder="Your full name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => updateProfile("email", e.target.value)}
              placeholder="your@email.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="shop_name">Business/Shop Name</Label>
            <Input
              id="shop_name"
              value={profile.shop_name || ""}
              onChange={(e) => updateProfile("shop_name", e.target.value)}
              placeholder="Your business name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="business_type">Business Type</Label>
            <Select value={profile.business_type} onValueChange={(value) => updateProfile("business_type", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="proprietorship">Proprietorship</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="llp">LLP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Address Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Address Information</h2>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business_address">Business Address</Label>
            <Textarea
              id="business_address"
              value={profile.business_address || ""}
              onChange={(e) => updateProfile("business_address", e.target.value)}
              placeholder="Complete business address"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select value={profile.state || ""} onValueChange={(value) => updateProfile("state", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {indianStates.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pincode">PIN Code</Label>
              <Input
                id="pincode"
                value={profile.pincode || ""}
                onChange={(e) => updateProfile("pincode", e.target.value)}
                placeholder="110001"
                maxLength={6}
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Tax Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Tax Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="gst_number">GST Number (Optional)</Label>
            <Input
              id="gst_number"
              value={profile.gst_number || ""}
              onChange={(e) => updateProfile("gst_number", e.target.value.toUpperCase())}
              placeholder="22AAAAA0000A1Z5"
              maxLength={15}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pan_number">PAN Number</Label>
            <Input
              id="pan_number"
              value={profile.pan_number || ""}
              onChange={(e) => updateProfile("pan_number", e.target.value.toUpperCase())}
              placeholder="ABCDE1234F"
              maxLength={10}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Banking Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Banknote className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Banking Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bank_name">Bank Name</Label>
            <Input
              id="bank_name"
              value={profile.bank_name || ""}
              onChange={(e) => updateProfile("bank_name", e.target.value)}
              placeholder="State Bank of India"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="account_number">Account Number</Label>
            <Input
              id="account_number"
              value={profile.account_number || ""}
              onChange={(e) => updateProfile("account_number", e.target.value)}
              placeholder="1234567890"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ifsc_code">IFSC Code</Label>
            <Input
              id="ifsc_code"
              value={profile.ifsc_code || ""}
              onChange={(e) => updateProfile("ifsc_code", e.target.value.toUpperCase())}
              placeholder="SBIN0001234"
              maxLength={11}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="upi_id">UPI ID</Label>
            <Input
              id="upi_id"
              value={profile.upi_id || ""}
              onChange={(e) => updateProfile("upi_id", e.target.value)}
              placeholder="yourname@paytm"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Terms & Conditions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Terms & Conditions</h2>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="terms_conditions">Default Terms & Conditions</Label>
          <Textarea
            id="terms_conditions"
            value={profile.terms_conditions || ""}
            onChange={(e) => updateProfile("terms_conditions", e.target.value)}
            placeholder="Payment due within 30 days. Late payment may attract penalty charges."
            rows={4}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-6">
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="w-full h-12"
        >
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}