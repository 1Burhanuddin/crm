
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

// Collection type
export interface Collection {
  id: string;
  user_id: string;
  customer_id: string;
  amount: number;
  collected_at: string;
  remarks?: string;
  order_id?: string | null;
  transaction_id?: string | null;
}

export function useCollections() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  // Fetch all collections for the current user
  const query = useQuery<Collection[]>({
    queryKey: ["collections", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", user.id)
        .order("collected_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Add a new collection + a corresponding "paid" transaction
  const mutation = useMutation({
    mutationFn: async (payload: {
      customer_id: string;
      amount: number;
      remarks?: string;
      order_id?: string | null;
      transaction_id?: string | null;
    }) => {
      if (!user) throw new Error("User not logged in");

      // Insert into collections first
      const { data, error } = await supabase
        .from("collections")
        .insert([
          {
            user_id: user.id,
            customer_id: payload.customer_id,
            amount: payload.amount,
            remarks: payload.remarks || "",
            order_id: payload.order_id || null,
            transaction_id: null, // set after transaction insert
          }
        ])
        .select("id")
        .single();

      if (error) throw error;

      // Insert 'paid' transaction and update the collection's transaction_id
      const collectionId = data?.id;
      if (collectionId) {
        const { data: txnRow, error: txnErr } = await supabase
          .from("transactions")
          .insert([
            {
              user_id: user.id,
              customer_id: payload.customer_id,
              type: "paid",
              amount: payload.amount,
              collection_id: collectionId,
              order_id: payload.order_id || null,
            }
          ])
          .select("id")
          .single();
        if (txnErr) throw txnErr;
        const txnId = txnRow?.id;
        if (txnId) {
          // Update the collection's transaction_id
          const { error: updateErr } = await supabase
            .from("collections")
            .update({ transaction_id: txnId })
            .eq("id", collectionId);
          if (updateErr) throw updateErr;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections", user?.id] });
    },
  });

  // Edit (update) a collection
  const editMutation = useMutation({
    mutationFn: async ({
      id,
      amount,
      remarks,
    }: {
      id: string;
      amount: number;
      remarks?: string;
    }) => {
      if (!user) throw new Error("User not logged in");
      const { error } = await supabase
        .from("collections")
        .update({
          amount,
          remarks: remarks || "",
        })
        .eq("user_id", user.id)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections", user?.id] });
    },
  });

  // Delete a collection
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User not logged in");
      const { error } = await supabase
        .from("collections")
        .delete()
        .eq("user_id", user.id)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections", user?.id] });
    },
  });

  return {
    ...query,
    addCollection: mutation.mutateAsync,
    isAdding: mutation.isPending,
    editCollection: editMutation.mutateAsync,
    isEditing: editMutation.isPending,
    deleteCollection: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
