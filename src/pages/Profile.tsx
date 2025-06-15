
import { useSession } from "@/hooks/useSession";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { AppLayout } from "@/components/AppLayout";

export default function ProfilePage() {
  const { user, status, refresh } = useSession();
  const [profile, setProfile] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  // Optionally: add PIN update in the future

  useEffect(() => {
    if (user) {
      setLoading(true);
      supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (data) setProfile(data);
          setLoading(false);
          if (error) toast({ title: "Failed to load profile", description: error.message, variant: "destructive" });
        });
    }
  }, [user]);

  async function handleSave() {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ email: newEmail })
      .eq("id", user.id);
    setLoading(false);
    if (error) {
      toast({ title: "Failed to update email", description: error.message, variant: "destructive" });
    } else {
      setProfile(prev => prev ? { ...prev, email: newEmail } : prev);
      toast({ title: "Email updated" });
      setEditing(false);
      refresh();
    }
  }

  return (
    <AppLayout title="Profile">
      <div className="max-w-md mx-auto p-4">
        <Card className="p-4">
          <h1 className="text-2xl font-bold mb-4 text-blue-900">My Profile</h1>
          {loading ? (
            <div>Loading...</div>
          ) : profile ? (
            <div>
              <div className="mb-4">
                <label className="block text-sm text-gray-700 font-medium">Email</label>
                {editing ? (
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleSave}
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <span>{profile.email}</span>
                    <Button size="sm" variant="outline" onClick={() => {
                      setNewEmail(profile.email);
                      setEditing(true);
                    }}>
                      Edit
                    </Button>
                  </div>
                )}
              </div>
              {/* Optionally render PIN change below */}
              {/* <div>...PIN change UI (future)...</div> */}
            </div>
          ) : (
            <div>No profile data found.</div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
