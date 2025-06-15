
import { DEMO_PRODUCTS } from "@/constants/demoData";

const placeholderImage =
  "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=400&q=80";

export function ProductCatalog() {
  return (
    <div className="p-4 pb-24">
      <h2 className="text-xl font-semibold mb-4 text-blue-900">Product Catalog</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {DEMO_PRODUCTS.map((prod) => (
          <div
            key={prod.id}
            className="bg-white p-4 rounded-lg shadow border flex flex-col items-center"
          >
            <img
              src={placeholderImage}
              alt={prod.name}
              className="w-20 h-20 rounded object-cover mb-3"
              loading="lazy"
            />
            <div className="flex items-center justify-between w-full mb-2">
              <span className="font-bold text-blue-800 text-lg">{prod.name}</span>
              <span className="text-lg text-green-700 font-semibold">₹{prod.price}/{prod.unit}</span>
            </div>
            <span className="text-xs text-gray-500 w-full">Unit: {prod.unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
