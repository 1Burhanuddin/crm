import { useSession } from "@/hooks/useSession";
import { useState, useEffect, ChangeEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { AppLayout } from "@/components/AppLayout";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ProfileTabs } from "@/components/ProfileTabs";
import { LogOut, User, Store, AtSign, Edit2, FileText, Wallet2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useReportsData } from "@/hooks/useReportsData";

export default function ProfilePage() {
  const { user, status, refresh, signOut } = useSession();
  const { data: reportData } = useReportsData();
  console.log("Current Auth User:", user);

  const [profile, setProfile] = useState<{
    email: string;
    name: string | null;
    shop_name: string | null;
    profile_image_url: string | null;
    pin_hash?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const navigate = useNavigate();

  // Editing states
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newShopName, setNewShopName] = useState("");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [currentPinHash, setCurrentPinHash] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setLoading(true);
      supabase
        .from("profiles")
        .select("email, name, shop_name, profile_image_url, pin_hash")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          // console
          console.log("Fetching profile for user ID:", user.id);
          console.log("Fetched profile data:", data);
          if (error) console.error("Profile fetch error:", error);



          if (data) {
            setProfile(data);
            setCurrentPinHash(data.pin_hash || null);
          }
          setLoading(false);
          if (error)
            toast({
              title: "Failed to load profile",
              description: error.message,
              variant: "destructive",
            });
        });
    }
  }, [user]);

  function handleEdit() {
    if (!profile) return;
    setNewEmail(profile.email);
    setNewName(profile.name ?? "");
    setNewShopName(profile.shop_name ?? "");
    setEditing(true);
  }

  async function handleSave() {
    if (!user) return;
    setLoading(true);

    let profile_image_url = profile?.profile_image_url ?? null;
    if (newImageFile) {
      setImageUploading(true);
      const fileExt = newImageFile.name.split(".").pop();
      const filePath = `avatars/${user.id}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, newImageFile, { upsert: true });
      setImageUploading(false);

      if (uploadError) {
        setLoading(false);
        toast({
          title: "Failed to upload profile image",
          description: uploadError.message,
          variant: "destructive",
        });
        return;
      }
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      profile_image_url = data.publicUrl;
    }

    let pin_hash = currentPinHash;
    if (!pin_hash) {
      const { data, error } = await supabase
        .from("profiles")
        .select("pin_hash")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        pin_hash = data.pin_hash;
        setCurrentPinHash(pin_hash);
      } else {
        setLoading(false);
        toast({
          title: "Failed to update profile (PIN not found)",
          description: error?.message || "Could not fetch pin_hash.",
          variant: "destructive",
        });
        return;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        email: newEmail,
        name: newName,
        shop_name: newShopName,
        profile_image_url,
        pin_hash,
      })
      .eq("id", user.id);

    setLoading(false);

    if (error) {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              email: newEmail,
              name: newName,
              shop_name: newShopName,
              profile_image_url,
              pin_hash,
            }
          : prev
      );
      toast({ title: "Profile updated" });
      setEditing(false);
      refresh();
      setNewImageFile(null);
    }
  }

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setNewImageFile(file);
    }
  }

  // UI for profile
  return (
    <AppLayout
      shopName={profile?.shop_name || undefined}
      loadingTitle={loading}
      title="Profile"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] ">
          <div className="text-blue-800 text-lg font-semibold">Loading...</div>
        </div>
      ) : (
        <div className="w-full p-4 pb-24 relative">
          <Card className="p-0 shadow-xl border-0 relative overflow-visible bg-white min-h-[40vh] w-full">
            {/* Profile header with navy/light gradient */}
            <div className="flex flex-col items-center justify-center rounded-t-lg bg-white pb-2 pt-7 px-4 relative">
              {/* Edit icon button (left) */}
              {!editing && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleEdit}
                  className="absolute left-4 top-4 z-20 bg-white text-blue-900 hover:bg-blue-100 border border-blue-800 shadow-lg rounded-full w-10 h-10 flex items-center justify-center"
                  title="Edit Profile"
                >
                  <Edit2 className="h-5 w-5" />
                  <span className="sr-only">Edit</span>
                </Button>
              )}
              {/* Logout button (right) */}
              {status === "signed_in" && user && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={async () => {
                    await signOut();
                    navigate("/auth");
                  }}
                  className="absolute right-4 top-4 z-20 bg-white text-blue-900 hover:bg-blue-100 border border-blue-800 shadow-lg rounded-full w-10 h-10 flex items-center justify-center"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Logout</span>
                </Button>
              )}
              <div className="relative mb-2 mt-2">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg bg-gradient-to-br from-indigo-100 to-blue-200">
                  <AvatarImage
                    src={
                      newImageFile
                        ? URL.createObjectURL(newImageFile)
                        : profile?.profile_image_url || undefined
                    }
                    alt={profile?.name ?? profile?.email ?? "U"}
                  />
                  <AvatarFallback>
                    {(profile?.name || profile?.email || "U")[0]}
                  </AvatarFallback>
                </Avatar>
                {/* Upload image during edit */}
                {editing && (
                  <div className="absolute bottom-0 right-0">
                    <label className="cursor-pointer bg-white rounded-full shadow px-2 py-1 text-xs border border-gray-300 hover:bg-gray-100 transition">
                      <Edit2 className="h-4 w-4 inline-block mr-1 text-blue-700" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={imageUploading}
                        className="hidden"
                      />
                      Change
                    </label>
                  </div>
                )}
              </div>
              {/* Name and shop name fields with improved background/alignment */}
              <div className="flex flex-col items-start gap-4 w-full max-w-xs mt-2">
                {/* Name field */}
                <div className="w-full bg-white rounded-xl px-4 py-3 shadow flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" />
                  <span className="font-bold text-xl text-blue-900 break-words w-full">
                    {editing ? (
                      <Input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full font-bold text-left border-blue-200 bg-blue-50/60"
                        maxLength={50}
                        placeholder="Name"
                      />
                    ) : profile?.name ? (
                      profile.name
                    ) : (
                      <span className="text-gray-400 italic">No name</span>
                    )}
                  </span>
                </div>
                {/* Shop name field */}
                <div className="w-full bg-white rounded-xl px-4 py-3 shadow flex items-center gap-2">
                  <Store className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm text-indigo-700 font-semibold break-words w-full">
                    {editing ? (
                      <Input
                        type="text"
                        value={newShopName}
                        onChange={(e) => setNewShopName(e.target.value)}
                        className="w-full text-left border-blue-100 bg-blue-50/60"
                        maxLength={60}
                        placeholder="Shop/Enterprise Name"
                      />
                    ) : profile?.shop_name ? (
                      profile.shop_name
                    ) : (
                      <span className="text-gray-300 italic">No shop/enterprise</span>
                    )}
                  </span>
                </div>
                {/* Email field */}
                <div className="w-full bg-white rounded-xl px-4 py-3 shadow flex items-center gap-2">
                  <AtSign className="w-4 h-4 text-blue-300" />
                  <span className="text-xs text-gray-500 break-words w-full">
                    {editing ? (
                      <Input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full text-left border-blue-100 bg-blue-50/60"
                        placeholder="Email"
                      />
                    ) : (
                      profile?.email
                    )}
                  </span>
                </div>
              </div>
            </div>
            {/* Edit Actions */}
            {editing && (
              <div className="flex flex-col items-center px-6 pt-2 pb-6">
                {editing && newImageFile && (
                  <span className="text-xs text-blue-800 mt-1">
                    {newImageFile.name}
                  </span>
                )}
                <div className={`flex flex-col w-full gap-2 mt-5`}>
                  <div className="flex w-full gap-3 flex-col sm:flex-row">
                    <Button
                      className="w-full bg-blue-600 text-white hover:bg-blue-700 shadow"
                      variant="default"
                      type="button"
                      onClick={handleSave}
                      disabled={loading || imageUploading}
                    >
                      {loading || imageUploading ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      type="button"
                      onClick={() => setEditing(false)}
                      disabled={loading || imageUploading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
          {/* Quick Access Section for Bills, Customers, and Products */}
          <div className="mt-8 w-full flex flex-col items-center">
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Collection card, only if udhaar exists */}
              {reportData?.totalCredit > 0 && (
                <button
                  onClick={() => navigate('/collections')}
                  className="rounded-2xl bg-white shadow-md border border-red-100 hover:shadow-lg transition flex flex-col items-center p-6 group hover:scale-[1.03] focus:outline-none"
                >
                  <div className="bg-red-600 text-white rounded-full p-3 mb-3 shadow group-hover:bg-red-700 transition">
                    <Wallet2 className="w-7 h-7" />
                  </div>
                  <div className="font-bold text-red-900 text-lg mb-1">Collections</div>
                  <div className="text-gray-500 text-sm text-center">Collect pending udhaar</div>
                </button>
              )}
              <button
                onClick={() => navigate('/bills')}
                className="rounded-2xl bg-white shadow-md border border-blue-100 hover:shadow-lg transition flex flex-col items-center p-6 group hover:scale-[1.03] focus:outline-none"
              >
                <div className="bg-blue-600 text-white rounded-full p-3 mb-3 shadow group-hover:bg-blue-700 transition">
                  <FileText className="w-7 h-7" />
                </div>
                <div className="font-bold text-blue-900 text-lg mb-1">Bills</div>
                <div className="text-gray-500 text-sm text-center">View and manage your bills</div>
              </button>
              <button
                onClick={() => navigate('/customers')}
                className="rounded-2xl bg-white shadow-md border border-blue-100 hover:shadow-lg transition flex flex-col items-center p-6 group hover:scale-[1.03] focus:outline-none"
              >
                <div className="bg-blue-600 text-white rounded-full p-3 mb-3 shadow group-hover:bg-blue-700 transition">
                  <User className="w-7 h-7" />
                </div>
                <div className="font-bold text-blue-900 text-lg mb-1">Customers</div>
                <div className="text-gray-500 text-sm text-center">View and manage your customers</div>
              </button>
              <button
                onClick={() => navigate('/products')}
                className="rounded-2xl bg-white shadow-md border border-indigo-100 hover:shadow-lg transition flex flex-col items-center p-6 group hover:scale-[1.03] focus:outline-none"
              >
                <div className="bg-indigo-600 text-white rounded-full p-3 mb-3 shadow group-hover:bg-indigo-700 transition">
                  <Store className="w-7 h-7" />
                </div>
                <div className="font-bold text-indigo-900 text-lg mb-1">Products</div>
                <div className="text-gray-500 text-sm text-center">Browse and manage your products</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
