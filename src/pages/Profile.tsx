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
import { LogOut, User, Store, AtSign, Edit2 } from "lucide-react";
import { BackButton } from "@/components/BackButton";

export default function ProfilePage() {
  const { user, status, refresh, signOut } = useSession();
  const [profile, setProfile] = useState<{
    email: string;
    name: string | null;
    shop_name: string | null;
    profile_image_url: string | null;
    pin_hash?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

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
      <div className="mb-2">
        <BackButton toMainScreen />
      </div>
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-blue-800 text-lg font-semibold">Loading...</div>
        </div>
      ) : (
        <div className="max-w-md mx-auto p-4 pb-24 relative">
          {/* Logout button: only in Profile, top-right */}
          {status === "signed_in" && user && (
            <Button
              variant="outline"
              size="icon"
              onClick={signOut}
              className="absolute right-2 top-2 z-20 bg-white text-blue-900 hover:bg-blue-100 border border-blue-800 shadow-lg animate-pop"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
            </Button>
          )}
          <Card className="p-0 shadow-xl border border-gray-200">
            {/* Profile header */}
            <div className="flex flex-col items-center justify-center rounded-t-lg bg-gradient-to-r from-blue-100 via-indigo-50 to-purple-100 pb-2 pt-5">
              <div className="relative">
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
              <span className="font-bold text-2xl text-blue-900 mt-2 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                {editing ? (
                  <Input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-[160px] font-bold text-center border-blue-200"
                    maxLength={50}
                    placeholder="Name"
                  />
                ) : profile?.name ? (
                  profile.name
                ) : (
                  <span className="text-gray-400 italic">No name</span>
                )}
              </span>
              <span className="text-sm text-indigo-700 font-semibold flex gap-2 items-center mt-1">
                <Store className="w-4 h-4 text-indigo-400" />
                {editing ? (
                  <Input
                    type="text"
                    value={newShopName}
                    onChange={(e) => setNewShopName(e.target.value)}
                    className="w-[160px] text-center border-blue-100"
                    maxLength={60}
                    placeholder="Shop/Enterprise Name"
                  />
                ) : profile?.shop_name ? (
                  profile.shop_name
                ) : (
                  <span className="text-gray-300 italic">No shop/enterprise</span>
                )}
              </span>
              <span className="text-xs text-gray-500 mt-1 flex gap-2 items-center">
                <AtSign className="w-4 h-4 text-blue-300" />
                {editing ? (
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-[190px] text-center border-blue-100"
                    placeholder="Email"
                  />
                ) : (
                  profile?.email
                )}
              </span>
            </div>
            {/* Edit Actions */}
            <div className="flex flex-col items-center px-6 pt-2 pb-6">
              {editing && newImageFile && (
                <span className="text-xs text-blue-800 mt-1">
                  {newImageFile.name}
                </span>
              )}
              <div className={`flex flex-col w-full gap-2 mt-5`}>
                {editing ? (
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
                ) : (
                  <Button
                    className="w-full bg-gradient-to-r from-blue-400 to-violet-400 text-white font-semibold shadow hover:from-blue-500 hover:to-violet-500 transition"
                    size="lg"
                    variant="default"
                    onClick={handleEdit}
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </Card>
          {/* Only render tabs once not loading */}
          <ProfileTabs initialTab="reports" />
        </div>
      )}
    </AppLayout>
  );
}
