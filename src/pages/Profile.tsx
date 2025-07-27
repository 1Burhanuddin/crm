import { useSession } from "@/hooks/useSession";
import { useState, useEffect, ChangeEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/AppLayout";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
          <div className="p-0 border-0 relative overflow-visible min-h-[40vh] w-full">
            {/* Clean minimalist form design */}
            <div className="flex flex-col items-center justify-center pb-2 pt-7 px-4 relative">
              {/* Profile form container */}
              <div className="w-full max-w-md mx-auto">
                  {/* Welcome header with edit button */}
                  <div className="text-center mb-8 bg-gray-50 rounded-xl p-6 border border-gray-100 relative">
                    {!editing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEdit}
                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full p-2"
                        title="Edit Profile"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      Welcome back!
                    </h1>
                    <p className="text-gray-600">
                      Manage your profile information
                    </p>
                  </div>
                
                {/* Clean form with three fields */}
                <div className="space-y-6">
                  {/* Name field */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900">
                      Name
                    </label>
                    {editing ? (
                      <Input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full h-12 px-4 rounded-full border-gray-200 bg-white focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Alexa"
                        maxLength={50}
                      />
                    ) : (
                      <div className="w-full h-12 px-4 rounded-full border border-gray-200 bg-gray-50 flex items-center">
                        <span className="text-gray-600">
                          {profile?.name || "Alexa"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Username field */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900">
                      Shop name
                    </label>
                    {editing ? (
                      <Input
                        type="text"
                        value={newShopName}
                        onChange={(e) => setNewShopName(e.target.value)}
                        className="w-full h-12 px-4 rounded-full border-gray-200 bg-white focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Alexa"
                        maxLength={60}
                      />
                    ) : (
                      <div className="w-full h-12 px-4 rounded-full border border-gray-200 bg-gray-50 flex items-center">
                        <span className="text-gray-600">
                          {profile?.shop_name || "Alexa"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Email field */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900">
                      Email address
                    </label>
                    {editing ? (
                      <Input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full h-12 px-4 rounded-full border-gray-200 bg-white focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Alexa@gmail.com"
                      />
                    ) : (
                      <div className="w-full h-12 px-4 rounded-full border border-gray-200 bg-gray-50 flex items-center">
                        <span className="text-gray-600">
                          {profile?.email || "Alexa@gmail.com"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit Actions */}
                {editing && (
                  <div className="flex w-full gap-3 mt-8">
                    <Button
                      className="w-full h-12 bg-blue-600 text-white hover:bg-blue-700 rounded-full"
                      variant="default"
                      type="button"
                      onClick={handleSave}
                      disabled={loading || imageUploading}
                    >
                      {loading || imageUploading ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      className="w-full h-12 rounded-full"
                      variant="outline"
                      type="button"
                      onClick={() => setEditing(false)}
                      disabled={loading || imageUploading}
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {/* Logout button */}
                {status === "signed_in" && user && !editing && (
                  <div className="w-full mt-8">
                    <Button
                      className="w-full h-12 bg-red-600 text-white hover:bg-red-700 rounded-full"
                      variant="default"
                      type="button"
                      onClick={async () => {
                        await signOut();
                        navigate("/auth");
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Log Out
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
