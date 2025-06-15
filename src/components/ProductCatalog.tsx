
import { DEMO_PRODUCTS } from "@/constants/demoData";

export function ProductCatalog() {
  return (
    <div className="p-4 pb-24">
      <h2 className="text-xl font-semibold mb-4 text-blue-900">Product Catalog</h2>
      <div className="grid grid-cols-1 gap-4">
        {DEMO_PRODUCTS.map((prod) => (
          <div
            key={prod.id}
            className="bg-white p-4 rounded-lg shadow border flex flex-col"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-blue-800 text-lg">{prod.name}</span>
              <span className="text-lg text-green-700 font-semibold">₹{prod.price}/{prod.unit}</span>
            </div>
            <span className="text-xs text-gray-500">Unit: {prod.unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
