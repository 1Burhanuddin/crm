
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/constants/types";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";

const placeholderImage =
  "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=400&q=80";

async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// Add edit handling props
type ProductCatalogProps = {
  onEdit: (product: Product) => void;
};

export function ProductCatalog({ onEdit }: ProductCatalogProps) {
  const { data: products, isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  if (isLoading) {
    return <div className="p-4">Loading products...</div>;
  }
  if (error) {
    return (
      <div className="p-4 text-red-700">
        Failed to load products: {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      <h2 className="text-xl font-semibold mb-4 text-blue-900">Product Catalog</h2>
      {products && products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((prod) => (
            <div
              key={prod.id}
              className="bg-white p-4 rounded-lg shadow border flex flex-col items-center relative"
            >
              <img
                src={placeholderImage}
                alt={prod.name}
                className="w-20 h-20 rounded object-cover mb-3"
                loading="lazy"
              />
              {/* Edit button - top right corner absolute */}
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => onEdit(prod)}
                aria-label={`Edit ${prod.name}`}
              >
                <Pencil size={16} />
              </Button>
              <div className="flex items-center justify-between w-full mb-2">
                <span className="font-bold text-blue-800 text-lg">{prod.name}</span>
                <span className="text-lg text-green-700 font-semibold">
                  ₹{prod.price}/{prod.unit}
                </span>
              </div>
              <span className="text-xs text-gray-500 w-full">Unit: {prod.unit}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500">No products yet.</div>
      )}
    </div>
  );
}
