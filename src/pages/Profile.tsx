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
import { EnhancedProfileForm } from "@/components/EnhancedProfileForm";

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

  // UI for enhanced profile
  return (
    <AppLayout
      shopName={profile?.shop_name || undefined}
      loadingTitle={loading}
      title="Profile"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-primary text-lg font-semibold">Loading...</div>
        </div>
      ) : (
        <div className="w-full pb-24">
          <EnhancedProfileForm />
        </div>
      )}
    </AppLayout>
  );
}
