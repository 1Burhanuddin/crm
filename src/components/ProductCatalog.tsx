
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/constants/types";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { Delete } from "lucide-react";

type ProductCatalogProps = {
  onEdit: (product: Product) => void;
  onDelete?: (product: Product) => void; // optionally provide a delete handler
};

async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export function ProductCatalog({ onEdit, onDelete }: ProductCatalogProps) {
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
    <div className="p-2 pb-24">
      <h2 className="text-lg font-semibold mb-3 text-blue-900">Product Catalog</h2>
      {products && products.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {products.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-xl shadow border flex flex-row items-center justify-between relative px-3 py-2 min-h-[60px] active:scale-[0.98] hover:shadow-lg transition-all"
            >
              {/* Edit/Delete buttons - right side */}
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full border border-blue-100 hover:bg-blue-50 focus:ring-2 focus:ring-blue-500"
                  onClick={() => onEdit(prod)}
                  aria-label={`Edit ${prod.name}`}
                >
                  <Pencil size={17} />
                </Button>
                {onDelete && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full border border-red-100 hover:bg-red-50 text-red-700 focus:ring-2 focus:ring-red-500"
                    onClick={() => onDelete(prod)}
                    aria-label={`Delete ${prod.name}`}
                  >
                    <Delete size={17} />
                  </Button>
                )}
              </div>
              <div className="flex-1 flex flex-col pr-12">
                <div className="flex flex-row items-center justify-between w-full">
                  <span className="font-semibold text-blue-800 text-base truncate">{prod.name}</span>
                  <span className="text-sm text-green-700 font-bold ml-2 shrink-0">
                    ₹{prod.price}/{prod.unit}
                  </span>
                </div>
                <span className="text-[11px] text-gray-500 w-full mt-1">Unit: {prod.unit}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500">No products yet.</div>
      )}
    </div>
  );
}
