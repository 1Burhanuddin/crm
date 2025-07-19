
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Trash2, Edit, MoreHorizontal } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { toast } from "@/hooks/use-toast";
import { Product } from "@/constants/types";
import { EditProductModal } from "@/components/EditProductModal";
import { DeleteProductDialog } from "@/components/DeleteProductDialog";
import { AddProductModal } from "@/components/AddProductModal";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { BottomNav } from "@/components/ui/BottomNav";
import { AppLayout } from "@/components/AppLayout";

const fetchProducts = async (user_id: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Product[];
};

export default function Products() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', user?.id],
    queryFn: () => fetchProducts(user?.id ?? ''),
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', user?.id] });
      toast({ title: "Product deleted successfully" });
      setDeletingProduct(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error deleting product", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (product: Product) => {
      const { error } = await supabase
        .from('products')
        .update({
          name: product.name,
          price: product.price,
          unit: product.unit,
        })
        .eq('id', product.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', user?.id] });
      toast({ title: "Product updated successfully" });
      setEditingProduct(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error updating product", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (product: Product) => {
    setDeletingProduct(product);
  };

  const confirmDelete = () => {
    if (deletingProduct) {
      deleteMutation.mutate(deletingProduct.id);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
  };

  const handleUpdate = (updatedProduct: Product) => {
    updateMutation.mutate(updatedProduct);
  };

  const handleAddSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['products', user?.id] });
    setShowAddModal(false);
  };

  if (isLoading) {
    return <div className="p-6">Loading products...</div>;
  }

  return (
    <AppLayout title="Products">
      <div className="p-6 space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Products</h1>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="rounded-xl border border-gray-200 shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold text-blue-900">{product.name}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 rounded-full hover:bg-gray-100 focus:outline-none cursor-pointer">
                      <MoreHorizontal className="h-5 w-5 text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(product)}>
                      <Edit className="h-4 w-4 mr-2 text-blue-600" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(product)} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-end gap-6 w-full">
                  <span className="text-sm text-gray-600">Price: <span className="font-medium text-gray-900">₹{product.price}</span></span>
                  <span className="text-sm text-gray-600">Unit: <span className="font-medium text-gray-900">{product.unit}</span></span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found</p>
          </div>
        )}

        <AddProductModal
          open={showAddModal}
          onOpenChange={setShowAddModal}
          onSuccess={handleAddSuccess}
        />

        <EditProductModal
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
          onSubmit={handleUpdate}
          initialProduct={editingProduct}
        />

        <DeleteProductDialog
          open={!!deletingProduct}
          onOpenChange={(open) => !open && setDeletingProduct(null)}
          onDelete={confirmDelete}
          product={deletingProduct}
        />
      </div>
      <BottomNav />
    </AppLayout>
  );
}
