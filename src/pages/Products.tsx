
import { AppLayout } from "@/components/AppLayout";
import { ProductCatalog } from "@/components/ProductCatalog";
import { BackButton } from "@/components/BackButton";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Products() {
  const handleAddProduct = () => {
    // TODO: Implement add product modal
    alert("Add product functionality coming soon!");
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
      </div>
    </AppLayout>
  );
}
