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
  collection_date?: string | null;
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
      if (error) {
        console.error("Error fetching collections:", error);
        throw error;
      }
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
      collection_date?: string | null;
    }) => {
      if (!user) throw new Error("User not logged in");

      console.log("Adding collection with payload:", payload);

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
            collection_date: payload.collection_date || null,
          }
        ])
        .select("id")
        .single();

      if (error) {
        console.error("Error inserting collection:", error);
        throw error;
      }

      console.log("Collection inserted successfully:", data);

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
              date: new Date().toISOString().split('T')[0],
              note: payload.remarks || null
            }
          ])
          .select("id")
          .single();
        
        if (txnErr) {
          console.error("Error inserting transaction:", txnErr);
          throw txnErr;
        }
        
        console.log("Transaction inserted successfully:", txnRow);
        
        const txnId = txnRow?.id;
        if (txnId) {
          // Update the collection's transaction_id
          const { error: updateErr } = await supabase
            .from("collections")
            .update({ transaction_id: txnId })
            .eq("id", collectionId);
          if (updateErr) {
            console.error("Error updating collection transaction_id:", updateErr);
            throw updateErr;
          }
          console.log("Collection transaction_id updated successfully");
        }
      }
    },
    onSuccess: () => {
      console.log("Collection mutation completed successfully");
      queryClient.invalidateQueries({ queryKey: ["collections", user?.id] });
    },
    onError: (error) => {
      console.error("Collection mutation failed:", error);
    },
  });

  // Edit (update) a collection (allow updating collection_date)
  const editMutation = useMutation({
    mutationFn: async ({
      id,
      amount,
      remarks,
      collection_date,
    }: {
      id: string;
      amount: number;
      remarks?: string;
      collection_date?: string | null;
    }) => {
      if (!user) throw new Error("User not logged in");
      const { error } = await supabase
        .from("collections")
        .update({
          amount,
          remarks: remarks || "",
          ...(collection_date !== undefined ? { collection_date } : {}),
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
