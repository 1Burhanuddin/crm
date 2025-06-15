
import { AppLayout } from "@/components/AppLayout";
import { ProductCatalog } from "@/components/ProductCatalog";
import { BackButton } from "@/components/BackButton";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { AddProductModal } from "@/components/AddProductModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function Products() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const addProductMutation = useMutation({
    mutationFn: async (product: { name: string; price: number; unit: string }) => {
      const { error } = await supabase.from("products").insert([product]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Product added", description: "Product has been added successfully." });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setAddModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not add product.",
        variant: "destructive",
      });
    },
    meta: {
      onError: true,
    }
  });

  const handleAddProduct = () => {
    setAddModalOpen(true);
  };

  const handleProductSubmit = (product: { name: string; price: number; unit: string }) => {
    addProductMutation.mutate(product);
  };

  return (
    <AppLayout title="Products">
      <div className="p-4 pb-24">
        <BackButton />
        <div className="flex items-center justify-between mb-5 mt-2">
          <h2 className="text-xl font-medium text-blue-900">Products</h2>
          <Button
            onClick={handleAddProduct}
            className="bg-blue-700 text-white px-3 py-1 rounded flex items-center gap-1 text-sm shadow hover:bg-blue-800"
          >
            <Plus size={18} /> Add Product
          </Button>
        </div>
        <ProductCatalog />
        <AddProductModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          onSubmit={handleProductSubmit}
        />
      </div>
    </AppLayout>
  );
}
