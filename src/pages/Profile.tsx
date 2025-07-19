import { useSession } from "@/hooks/useSession";
import { useState, useEffect, ChangeEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
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
            {/* Profile header with navy/light gradient */}
            <div className="flex flex-col items-center justify-center pb-2 pt-7 px-4 relative">
              {/* Remove old edit and logout icon buttons at the top of the page */}
              {/* Welcome message above the card (no emoji) */}
              <div className="w-full max-w-md mx-auto mb-4">
                <div className="text-2xl font-bold text-blue-900 text-center w-full">
                  Welcome, {profile?.name || profile?.email || "User"}!
                </div>
              </div>
              {/* Profile info in a flat panel (no card background, only field values have light gray bg) */}
              <div className="w-full max-w-md mx-auto relative px-8 py-8 flex flex-col items-center">
                {/* Edit icon button at top right inside the panel */}
              {!editing && (
                <Button
                    variant="ghost"
                  size="icon"
                  onClick={handleEdit}
                    className="absolute top-4 right-4 z-20 text-black hover:bg-gray-200"
                  title="Edit Profile"
                >
                  <Edit2 className="h-5 w-5" />
                  <span className="sr-only">Edit</span>
                </Button>
              )}
                <Avatar className="h-24 w-24 border-4 border-white bg-gray-200 mb-6">
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
                {/* Table format for profile fields */}
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <tbody>
                    <tr>
                      <td className="font-semibold text-black w-24">Name</td>
                      <td className="text-black bg-gray-50 rounded-lg px-4 py-2">
                    {editing ? (
                      <Input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                            className="w-full font-bold text-left border-gray-200 bg-white"
                        maxLength={50}
                        placeholder="Name"
                      />
                    ) : profile?.name ? (
                      profile.name
                    ) : (
                      <span className="text-gray-400 italic">No name</span>
                    )}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-black">Shop</td>
                      <td className="text-black bg-gray-50 rounded-lg px-4 py-2">
                    {editing ? (
                      <Input
                        type="text"
                        value={newShopName}
                        onChange={(e) => setNewShopName(e.target.value)}
                            className="w-full text-left border-gray-200 bg-white"
                        maxLength={60}
                        placeholder="Shop/Enterprise Name"
                      />
                    ) : profile?.shop_name ? (
                      profile.shop_name
                    ) : (
                          <span className="text-gray-400 italic">No shop/enterprise</span>
                    )}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-black">Email</td>
                      <td className="text-black bg-gray-50 rounded-lg px-4 py-2">
                    {editing ? (
                      <Input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                            className="w-full text-left border-gray-200 bg-white"
                        placeholder="Email"
                      />
                    ) : (
                      profile?.email
                    )}
                      </td>
                    </tr>
                  </tbody>
                </table>
                {/* Upload image during edit */}
                {editing && (
                  <div className="mt-4">
                    <label className="cursor-pointer bg-white rounded-full shadow px-2 py-1 text-xs border border-gray-300 hover:bg-gray-100 transition">
                      <Edit2 className="h-4 w-4 inline-block mr-1 text-blue-700" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={imageUploading}
                        className="hidden"
                      />
                      Change Photo
                    </label>
                    {newImageFile && (
                      <span className="text-xs text-blue-800 ml-2">{newImageFile.name}</span>
                    )}
            </div>
                )}
            {/* Edit Actions */}
            {editing && (
                  <div className="flex w-full gap-3 mt-6">
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
                )}
              </div>
              {/* Logout button as full-width below the card */}
              {status === "signed_in" && user && !editing && (
                <div className="w-full max-w-md mx-auto mt-6">
                  <Button
                    className="w-full bg-red-600 text-white hover:bg-red-700"
                    variant="default"
                    type="button"
                    onClick={async () => {
                      await signOut();
                      navigate("/auth");
                    }}
                  >
                    Log Out
                  </Button>
                  </div>
              )}
            </div>
            {/* Quick Access Section for Bills, Customers, and Products */}
            {/* Removed quick access grid for bills, customers, products, and collections as per request. */}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
