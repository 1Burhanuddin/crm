import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Building2, CreditCard, Banknote, FileText, MapPin, User, ChevronDown, Edit3, Phone, LogOut } from "lucide-react";

interface ProfileData {
  email: string;
  name: string | null;
  shop_name: string | null;
  mobile_number: string | null;
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
  const { user, signOut } = useSession();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    email: "",
    name: null,
    shop_name: null,
    mobile_number: null,
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
        mobile_number: data.mobile_number,
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
      setIsEditing(false);
    }
  };

  const updateProfile = useCallback((field: keyof ProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {isEditing ? (
        // Edit Form
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold">Edit Profile</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="rounded-full"
              >
                Cancel
              </Button>
            </div>

            {/* Essential Fields */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name || ""}
                    onChange={(e) => updateProfile("name", e.target.value)}
                    placeholder="Your full name"
                    className="rounded-xl"
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
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile_number">Mobile Number</Label>
                  <Input
                    id="mobile_number"
                    type="tel"
                    value={profile.mobile_number || ""}
                    onChange={(e) => updateProfile("mobile_number", e.target.value)}
                    placeholder="+91 9876543210"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shop_name">Business Name</Label>
                  <Input
                    id="shop_name"
                    value={profile.shop_name || ""}
                    onChange={(e) => updateProfile("shop_name", e.target.value)}
                    placeholder="Your business name"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_type">Business Type</Label>
                  <Select value={profile.business_type} onValueChange={(value) => updateProfile("business_type", value)}>
                    <SelectTrigger className="rounded-xl">
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

            {/* Expandable Additional Sections */}
            <div className="space-y-4">
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center gap-2 text-lg font-semibold mb-4 hover:text-primary transition-colors">
                  <MapPin className="h-5 w-5" />
                  Address & Location
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="business_address">Business Address</Label>
                    <Textarea
                      id="business_address"
                      value={profile.business_address || ""}
                      onChange={(e) => updateProfile("business_address", e.target.value)}
                      placeholder="Complete business address"
                      rows={3}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Select value={profile.state || ""} onValueChange={(value) => updateProfile("state", value)}>
                        <SelectTrigger className="rounded-xl">
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
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 text-lg font-semibold mb-4 hover:text-primary transition-colors">
                  <FileText className="h-5 w-5" />
                  Tax Information
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gst_number">GST Number (Optional)</Label>
                      <Input
                        id="gst_number"
                        value={profile.gst_number || ""}
                        onChange={(e) => updateProfile("gst_number", e.target.value.toUpperCase())}
                        placeholder="22AAAAA0000A1Z5"
                        maxLength={15}
                        className="rounded-xl"
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
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 text-lg font-semibold mb-4 hover:text-primary transition-colors">
                  <Banknote className="h-5 w-5" />
                  Banking Details
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bank_name">Bank Name</Label>
                      <Input
                        id="bank_name"
                        value={profile.bank_name || ""}
                        onChange={(e) => updateProfile("bank_name", e.target.value)}
                        placeholder="State Bank of India"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account_number">Account Number</Label>
                      <Input
                        id="account_number"
                        value={profile.account_number || ""}
                        onChange={(e) => updateProfile("account_number", e.target.value)}
                        placeholder="1234567890"
                        className="rounded-xl"
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
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="upi_id">UPI ID</Label>
                      <Input
                        id="upi_id"
                        value={profile.upi_id || ""}
                        onChange={(e) => updateProfile("upi_id", e.target.value)}
                        placeholder="yourname@paytm"
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 text-lg font-semibold mb-4 hover:text-primary transition-colors">
                  <CreditCard className="h-5 w-5" />
                  Terms & Conditions
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="terms_conditions">Default Terms & Conditions</Label>
                    <Textarea
                      id="terms_conditions"
                      value={profile.terms_conditions || ""}
                      onChange={(e) => updateProfile("terms_conditions", e.target.value)}
                      placeholder="Payment due within 30 days. Late payment may attract penalty charges."
                      rows={4}
                      className="rounded-xl"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            <div className="flex gap-3 pt-4 sm:pt-6">
              <Button 
                onClick={handleSave} 
                disabled={loading}
                className="flex-1 h-11 sm:h-12 rounded-xl text-sm sm:text-base"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Profile Summary
        <div className="bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-border shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground truncate">
                  {profile.name || "Business Profile"}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {profile.shop_name || "Add your business details"}
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="rounded-full px-4 sm:px-6 flex-1 sm:flex-none"
              >
                <Edit3 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full px-4 sm:px-6 text-destructive hover:text-destructive flex-1 sm:flex-none"
                  >
                    <LogOut className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to log out? You will need to sign in again to access your account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={signOut} className="bg-destructive hover:bg-destructive/90">
                      Logout
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl sm:rounded-2xl">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm font-medium truncate">{profile.name || "Not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl sm:rounded-2xl">
                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Business</p>
                  <p className="text-sm font-medium truncate">{profile.shop_name || "Not set"}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl sm:rounded-2xl">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Mobile</p>
                  <p className="text-sm font-medium truncate">{profile.mobile_number || "Not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl sm:rounded-2xl">
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">GST Number</p>
                  <p className="text-sm font-medium truncate">{profile.gst_number || "Not registered"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Expandable sections */}
          <div className="mt-4 sm:mt-6 space-y-2">
            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/30 rounded-xl sm:rounded-2xl hover:bg-muted/50 transition-colors">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Banknote className="h-4 w-4 flex-shrink-0" />
                  Banking Details
                </span>
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Bank: {profile.bank_name || "Not set"}</p>
                    <p className="text-muted-foreground">UPI: {profile.upi_id || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Account: {profile.account_number ? "••••••••" + profile.account_number.slice(-4) : "Not set"}</p>
                    <p className="text-muted-foreground">IFSC: {profile.ifsc_code || "Not set"}</p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/30 rounded-xl sm:rounded-2xl hover:bg-muted/50 transition-colors">
                <span className="text-sm font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4 flex-shrink-0" />
                  Terms & Conditions
                </span>
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3 pt-3">
                <p className="text-sm text-muted-foreground break-words">
                  {profile.terms_conditions || "No default terms set"}
                </p>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      )}
    </div>
  );
}