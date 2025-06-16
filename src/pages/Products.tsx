import { AppLayout } from "@/components/AppLayout";
import { ProductCatalog } from "@/components/ProductCatalog";
import { BackButton } from "@/components/BackButton";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { AddProductModal } from "@/components/AddProductModal";
import { EditProductModal } from "@/components/EditProductModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Product } from "@/constants/types";
import { DeleteProductDialog } from "@/components/DeleteProductDialog";
import { useSession } from "@/hooks/useSession";

export default function Products() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useSession();

  // Ensure that the mutation includes the user_id when adding a product
  const addProductMutation = useMutation({
    mutationFn: async (product: { name: string; price: number; unit: string }) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("products").insert([
        {
          ...product,
          user_id: user.id,
        },
      ]);
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

  // Update product mutation is fine as RLS and queries work based on id/user_id
  const updateProductMutation = useMutation({
    mutationFn: async (product: { id: string; name: string; price: number; unit: string }) => {
      const { error } = await supabase
        .from("products")
        .update({
          name: product.name,
          price: product.price,
          unit: product.unit,
          updated_at: new Date().toISOString(),
        })
        .eq("id", product.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Product updated", description: "Product has been updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditModalOpen(false);
      setProductToEdit(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not update product.",
        variant: "destructive",
      });
    },
    meta: {
      onError: true,
    }
  });

  // Delete product mutation is fine as RLS enforces ownership
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Product deleted", description: "Product has been deleted." });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeleteModalOpen(false);
      setProductToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not delete product.",
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

  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
    setEditModalOpen(true);
  };

  const handleEditProductSubmit = (product: { id: string; name: string; price: number; unit: string }) => {
    updateProductMutation.mutate(product);
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = (id: string) => {
    deleteProductMutation.mutate(id);
  };

  return (
    <AppLayout title="Products">
      <div className="p-4 pb-24">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-medium text-blue-900">Products</h2>
          <Button
            onClick={handleAddProduct}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <Plus size={18} className="stroke-[2.5]" /> Add Product
          </Button>
        </div>
        <ProductCatalog onEdit={handleEditProduct} onDelete={handleDeleteProduct} userId={user?.id ?? null} />
        <AddProductModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          onSubmit={handleProductSubmit}
        />
        <EditProductModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSubmit={handleEditProductSubmit}
          initialProduct={
            productToEdit
              ? {
                  id: productToEdit.id,
                  name: productToEdit.name,
                  price: productToEdit.price,
                  unit: productToEdit.unit,
                }
              : null
          }
        />
        <DeleteProductDialog
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          product={productToDelete}
          onDelete={handleConfirmDelete}
        />
      </div>
    </AppLayout>
  );
}
