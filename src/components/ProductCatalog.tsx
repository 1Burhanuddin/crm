import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/constants/types";
import { Pencil, Trash2, Package, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";

type ProductCatalogProps = {
  onEdit: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onAdd?: () => void;
  userId?: string | null;
};

async function fetchProducts(userId?: string | null): Promise<Product[]> {
  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export function ProductCatalog({ onEdit, onDelete, onAdd, userId }: ProductCatalogProps) {
  const [filter, setFilter] = useState("");
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["products", userId],
    queryFn: () => fetchProducts(userId),
  });

  const filteredProducts = products.filter(
    (p) => p.name.toLowerCase().includes(filter.toLowerCase())
  );

  // Handle card click to toggle active state
  const handleCardClick = (productId: string) => {
    setActiveCardId(activeCardId === productId ? null : productId);
  };

  // Handle click outside to close active card
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.product-card')) {
        setActiveCardId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-blue-900/70 flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
          <span>Loading products…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-red-600 flex flex-col items-center gap-2">
          <span className="text-lg">⚠️ {error instanceof Error ? error.message : "Failed to load products"}</span>
          <button className="text-sm text-blue-600 hover:underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-blue-100/60 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Package className="h-5 w-5 text-blue-700" />
          </div>
          <h2 className="text-xl font-semibold text-blue-900">Product Catalog</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
            <div className="text-2xl font-bold text-blue-900">{products.length}</div>
            <div className="text-gray-500 text-sm">Total Products</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
            <div className="text-2xl font-bold text-blue-900">{filteredProducts.length}</div>
            <div className="text-gray-500 text-sm">Showing Now</div>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            placeholder="Search products by name…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        {onAdd && (
          <Button
            onClick={onAdd}
            className="flex-1 sm:flex-initial bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 text-base font-semibold hover:bg-blue-700 min-w-[120px] justify-center transition-all shadow-sm"
          >
            <Plus size={20} />
            Add Product
          </Button>
        )}
      </div>

      {/* Product List */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
          <div className="text-gray-500">No products found</div>
          {onAdd && (
            <button
              onClick={onAdd}
              className="mt-2 text-blue-600 hover:underline"
            >
              Add your first product
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="product-card group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-200 p-4 relative cursor-pointer"
              onClick={() => handleCardClick(prod.id)}
            >
              {/* Product Info */}
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-blue-900 text-lg truncate group-hover:text-blue-700 transition-colors">
                      {prod.name}
                    </h3>
                    <p className="text-gray-500 text-sm mt-0.5">Unit: {prod.unit}</p>
                  </div>
                  <div className="shrink-0 bg-green-50 px-3 py-1 rounded-lg border border-green-100">
                    <span className="text-green-700 font-semibold whitespace-nowrap">
                      ₹{prod.price}/{prod.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions - Shown when card is active */}
              <div 
                className={`absolute inset-0 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center gap-3 transition-all duration-200
                  ${activeCardId === prod.id ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
              >
                <Button
                  size="default"
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg h-10 flex items-center gap-2 font-medium shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(prod);
                  }}
                >
                  <Pencil size={18} />
                  Edit
                </Button>
                {onDelete && (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-sm transition-transform hover:scale-105"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(prod);
                    }}
                    title="Delete product"
                  >
                    <Trash2 size={18} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
