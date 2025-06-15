
import { AppLayout } from "@/components/AppLayout";
import { ProductCatalog } from "@/components/ProductCatalog";
import { BackButton } from "@/components/BackButton";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { AddProductModal } from "@/components/AddProductModal";

export default function Products() {
  const [addModalOpen, setAddModalOpen] = useState(false);

  const handleAddProduct = () => {
    setAddModalOpen(true);
  };

  // Optionally handle creation logic here (currently just logs to console)
  const handleProductSubmit = (product: { name: string; price: number; unit: string }) => {
    console.log("Product submitted:", product);
    // TODO: Add logic to save new product
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
