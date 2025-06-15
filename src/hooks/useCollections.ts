
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

  // Add a new collection
  const mutation = useMutation({
    mutationFn: async (payload: {
      customer_id: string;
      amount: number;
      remarks?: string;
      order_id?: string | null;
      transaction_id?: string | null;
    }) => {
      if (!user) throw new Error("User not logged in");
      const { error } = await supabase
        .from("collections")
        .insert([
          {
            user_id: user.id,
            customer_id: payload.customer_id,
            amount: payload.amount,
            remarks: payload.remarks || "",
            order_id: payload.order_id || null,
            transaction_id: payload.transaction_id || null,
          }
        ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections", user?.id] });
    },
  });

  return { ...query, addCollection: mutation.mutateAsync, isAdding: mutation.isPending };
}
