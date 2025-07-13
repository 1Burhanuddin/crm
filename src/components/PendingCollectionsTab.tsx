
import React from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { AlertCircle } from "lucide-react";
import { getDueDateInfo } from "@/utils/dueDateUtils";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  phone?: string;
}

interface PendingCollection {
  customer_id: string;
  amount: number;
}

interface PendingCollectionsTabProps {
  pendingCollections: PendingCollection[];
  customers: Customer[];
}

export function PendingCollectionsTab({
  pendingCollections,
  customers,
}: PendingCollectionsTabProps) {
  const navigate = useNavigate();

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || "Unknown Customer";
  };

  const groupedCollections = pendingCollections.reduce((acc, collection) => {
    const existing = acc.find(item => item.customer_id === collection.customer_id);
    if (existing) {
      existing.amount += collection.amount;
    } else {
      acc.push({ ...collection });
    }
    return acc;
  }, [] as PendingCollection[]);

  if (groupedCollections.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No pending collections</h3>
            <p className="text-sm text-gray-600">All collections are up to date</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">Pending Collections</h3>
        <div className="text-sm text-gray-600">
          {groupedCollections.length} customer{groupedCollections.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="space-y-3">
        {groupedCollections.map((collection) => (
          <div
            key={collection.customer_id}
            className="p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors border border-gray-100"
            onClick={() => navigate('/collections')}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {getCustomerName(collection.customer_id)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Click to manage collection
                </div>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-blue-700 bg-blue-100">
                    Set collection date
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-red-600">
                  ₹{collection.amount.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
