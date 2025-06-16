import React from "react";
import { format, parseISO } from "date-fns";
import { MoreHorizontal, Edit, Trash2, CalendarIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";

export function RecentCollectionsPanel({
  collections,
  customers,
  isLoading,
  error,
  handleEditCollection,
  handleDeleteCollection,
  dueToday
}: {
  collections: any[];
  customers: { id: string; name: string }[];
  isLoading: boolean;
  error: any;
  handleEditCollection: (collection: { id: string; amount: number; remarks: string }) => void;
  handleDeleteCollection: (collection: { id: string; name: string }) => void;
  dueToday: any[];
}) {
  return (
    <div className="mt-10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg text-blue-900">Recent Collections</h3>
      </div>

      {isLoading ? (
        <div className="text-center py-4">Loading...</div>
      ) : error ? (
        <div className="text-red-500 text-center py-4">Error loading collections</div>
      ) : collections.length === 0 ? (
        <div className="text-gray-500 text-center py-4">No collections yet</div>
      ) : (
        <ul className="space-y-3">
          {collections.map((collection) => {
            const customer = customers.find((c) => c.id === collection.customer_id);
            return (
              <li
                key={collection.id}
                className="bg-white shadow-sm hover:shadow-md transition-shadow rounded-xl p-4 border border-gray-100 relative"
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                      <MoreHorizontal size={18} className="text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => handleEditCollection({
                        id: collection.id,
                        amount: collection.amount,
                        remarks: collection.remarks || ""
                      })}
                      className="cursor-pointer"
                    >
                      <Edit size={16} className="mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteCollection({
                        id: collection.id,
                        name: customer?.name || "Unknown Customer"
                      })}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <Trash2 size={16} className="mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-blue-900 text-lg break-words">
                        {customer?.name || "Unknown Customer"}
                      </div>
                      <div className="text-green-700 text-xl font-bold mt-1">
                        ₹{collection.amount}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-3 bg-gray-50 px-3 py-2 rounded-lg">
                    <CalendarIcon size={16} className="text-blue-600" />
                    <span>{format(parseISO(collection.collected_at), "PPP")}</span>
                  </div>
                  {collection.remarks && (
                    <div className="text-sm text-gray-600 mt-3 bg-gray-50 px-3 py-2 rounded-lg">
                      {collection.remarks}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
