
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useSession } from "@/hooks/useSession";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

export default function AdminPage() {
  const { user, status } = useSession();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: AdminUser | null }>({
    open: false,
    user: null,
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === "signed_out" || !user) {
      navigate("/auth");
      return;
    }
    fetchUsers();
  }, [status, user, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_all_users');
      
      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to fetch users. You might not have admin permissions.",
          variant: "destructive",
        });
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog.user) return;

    try {
      setDeleting(true);
      const { error } = await supabase.rpc('delete_user_permanently', {
        user_id_to_delete: deleteDialog.user.id
      });

      if (error) {
        console.error('Error deleting user:', error);
        toast({
          title: "Error",
          description: "Failed to delete user: " + error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      // Refresh the users list
      await fetchUsers();
      setDeleteDialog({ open: false, user: null });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  if (status === "loading" || loading) {
    return (
      <AppLayout title="Admin - User Management">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-blue-900">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Admin - User Management">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-blue-900">User Management</h1>
          <Button onClick={fetchUsers} variant="outline">
            Refresh
          </Button>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No users found
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Last Sign In</TableHead>
                  <TableHead>Email Confirmed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((adminUser) => (
                  <TableRow key={adminUser.id}>
                    <TableCell className="font-medium">{adminUser.email}</TableCell>
                    <TableCell>{formatDate(adminUser.created_at)}</TableCell>
                    <TableCell>{formatDate(adminUser.last_sign_in_at)}</TableCell>
                    <TableCell>
                      {adminUser.email_confirmed_at ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-yellow-600">No</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteDialog({ open: true, user: adminUser })}
                        disabled={adminUser.id === user?.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, user: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Delete User
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to permanently delete the user "{deleteDialog.user?.email}"? 
                This action cannot be undone and will remove all associated data.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, user: null })}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
