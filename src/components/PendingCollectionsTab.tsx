
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO, addDays } from "date-fns";
import { AlertCircle } from "lucide-react";
import { getDueDateInfo } from "@/utils/dueDateUtils";
import { cn } from "@/lib/utils";
import { DashboardCollectionModal } from "./DashboardCollectionModal";

interface Customer {
  id: string;
  name: string;
  phone?: string;
}

interface PendingCollection {
  customer_id: string;
  amount: number;
  collection_date?: string;
}

interface PendingCollectionsTabProps {
  pendingCollections: PendingCollection[];
  customers: Customer[];
  onCollectionUpdate?: () => void;
}

export function PendingCollectionsTab({
  pendingCollections,
  customers,
  onCollectionUpdate,
}: PendingCollectionsTabProps) {
  const navigate = useNavigate();
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    name: string;
    pending: number;
    phone?: string;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || "Unknown Customer";
  };

  const getCustomerPhone = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.phone;
  };

  const handleCollectionClick = (collection: PendingCollection) => {
    const customer = customers.find(c => c.id === collection.customer_id);
    if (customer) {
      setSelectedCustomer({
        id: customer.id,
        name: customer.name,
        pending: collection.amount,
        phone: customer.phone,
      });
      setModalOpen(true);
    }
  };

  const groupedCollections = pendingCollections.reduce((acc, collection) => {
    const existing = acc.find(item => item.customer_id === collection.customer_id);
    if (existing) {
      existing.amount += collection.amount;
      // Keep the earliest collection date if multiple exist
      if (collection.collection_date && (!existing.collection_date || collection.collection_date < existing.collection_date)) {
        existing.collection_date = collection.collection_date;
      }
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
    <>
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
              className="p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors border border-gray-100 hover:shadow-md"
              onClick={() => handleCollectionClick(collection)}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {getCustomerName(collection.customer_id)}
                  </div>
                  {getCustomerPhone(collection.customer_id) && (
                    <div className="text-xs text-gray-500 mt-1">
                      {getCustomerPhone(collection.customer_id)}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    Click to collect payment or manage
                  </div>
                  
                  {/* Due Date Indicator */}
                  <div className="mt-2">
                    {collection.collection_date ? (
                      (() => {
                        const dueDateInfo = getDueDateInfo(parseISO(collection.collection_date));
                        return (
                          <span 
                            className={cn(
                              "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                              dueDateInfo.color,
                              dueDateInfo.bgColor,
                              dueDateInfo.isUrgent && "animate-pulse"
                            )}
                          >
                            {dueDateInfo.text}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-yellow-700 bg-yellow-100">
                        Set collection date
                      </span>
                    )}
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

      <DashboardCollectionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        customer={selectedCustomer}
        customers={customers}
        onCollectionAdded={() => {
          setModalOpen(false);
          setSelectedCustomer(null);
          onCollectionUpdate?.();
        }}
      />
    </>
  );
}
