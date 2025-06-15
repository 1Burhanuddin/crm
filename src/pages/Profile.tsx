
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

export default function ProfilePage() {
  const { user, status, refresh } = useSession();
  const [profile, setProfile] = useState<{
    email: string;
    name: string | null;
    shop_name: string | null;
    profile_image_url: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Editing states
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newShopName, setNewShopName] = useState("");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(true);
      supabase
        .from("profiles")
        .select("email, name, shop_name, profile_image_url")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (data) {
            setProfile(data);
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

    // Upload image if a new file has been selected
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
      // Get public URL for the uploaded image
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      profile_image_url = data.publicUrl;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        email: newEmail,
        name: newName,
        shop_name: newShopName,
        profile_image_url,
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

  return (
    <AppLayout title="Profile">
      <div className="max-w-md mx-auto p-4">
        <Card className="p-4 mb-6">
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-20 w-20">
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
            <div className="font-bold text-lg text-blue-900">
              {profile?.shop_name || <span className="text-gray-400 italic">No shop/enterprise</span>}
            </div>
            <div className="text-sm text-gray-700">
              {profile?.name || <span className="text-gray-400 italic">No name</span>}
            </div>
            <div className="text-xs text-gray-500">{profile?.email}</div>
            {editing && (
              <>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={imageUploading}
                  className="mt-2"
                />
                {newImageFile && (
                  <span className="text-xs text-blue-800 mt-1">
                    {newImageFile.name}
                  </span>
                )}
                <Input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-2"
                  maxLength={50}
                  placeholder="Name"
                />
                <Input
                  type="text"
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  className="mt-2"
                  maxLength={60}
                  placeholder="Shop/Enterprise Name"
                />
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="mt-2"
                  placeholder="Email"
                />
              </>
            )}
            <div className="flex gap-2 mt-4">
              {editing ? (
                <>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleSave}
                    disabled={loading || imageUploading}
                  >
                    {loading || imageUploading ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => setEditing(false)}
                    disabled={loading || imageUploading}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEdit}
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </Card>
        <ProfileTabs initialTab="customers" />
      </div>
    </AppLayout>
  );
}
