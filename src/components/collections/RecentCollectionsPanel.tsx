
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
      <h3 className="font-semibold text-lg mb-3 text-blue-900">Recent Collections</h3>
      {isLoading ? (
        <div className="text-gray-600">Loading...</div>
      ) : error ? (
        <div className="text-red-600">Error loading collections.</div>
      ) : (
        <ul>
          {collections.length === 0 && (
            <div className="text-gray-500 text-center mt-4">No collections yet.</div>
          )}
          {collections.map((c) => (
            <li key={c.id} className="bg-gray-50 shadow rounded-lg mb-3 px-4 py-3 relative group">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-blue-800">
                    {customers.find((cu) => cu.id === c.customer_id)?.name || "(Unknown)"}
                  </div>
                  <div className="text-sm text-gray-700">
                    Collected: ₹{c.amount}
                    <span className="ml-2 text-xs text-gray-400">{new Date(c.collected_at).toLocaleString()}</span>
                    {c.collection_date && (
                      <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs">
                        Date: {format(parseISO(c.collection_date), "PPP")}
                      </span>
                    )}
                  </div>
                  {c.remarks && (
                    <div className="text-xs text-gray-500 mt-1">Remarks: {c.remarks}</div>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 rounded hover:bg-gray-200">
                      <MoreHorizontal size={18} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        handleEditCollection({ id: c.id, amount: c.amount, remarks: c.remarks || "" })
                      }
                    >
                      <Edit size={16} className="mr-1" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleDeleteCollection({
                          id: c.id,
                          name: customers.find((cu) => cu.id === c.customer_id)?.name || "(Unknown)",
                        })
                      }
                    >
                      <Trash2 size={16} className="mr-1" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
