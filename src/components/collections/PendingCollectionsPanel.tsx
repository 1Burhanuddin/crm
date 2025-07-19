import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarIcon, MessageSquare, MoreHorizontal, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { getDueDateInfo } from "@/utils/dueDateUtils";

// Replace CustomerWithPending with PendingOrderWithCredit
interface PendingOrderWithCredit {
  orderId: string;
  customerId: string;
  customerName: string;
  phone?: string;
  creditAmount: number;
  jobDate?: string;
}

interface DeliveredOrder {
  id: string;
  amount: number;
}

interface PendingCollectionsPanelProps {
  pendingOrders: PendingOrderWithCredit[];
  customers: { id: string; name: string }[];
  customerDates: Record<string, Date>;
  openDateMenu: (id: string) => void;
  dateMenuOpen: Record<string, boolean>;
  handleDateChangeForCustomer: (customerId: string, date: Date) => void;
  displayDate: (date: Date) => string;
  customerDeliveredOrders: Record<string, DeliveredOrder[]>;
  setFormAndShowForm: (customer: PendingOrderWithCredit) => void;
  isAdding: boolean;
  handleOpenReminderModal: (customer: PendingOrderWithCredit) => void;
}

export function PendingCollectionsPanel({
  pendingOrders,
  customers,
  customerDates,
  openDateMenu,
  dateMenuOpen,
  handleDateChangeForCustomer,
  displayDate,
  customerDeliveredOrders,
  setFormAndShowForm,
  isAdding,
  handleOpenReminderModal,
}: PendingCollectionsPanelProps) {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleCard = (customerId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [customerId]: !prev[customerId]
    }));
  };

  if (!pendingOrders || pendingOrders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
        <div className="text-gray-500">No pending collections</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 text-blue-800 font-bold">Pending Collections</div>
      <ul className="space-y-4">
        {pendingOrders.map((order) => (
          <li
            key={order.orderId}
            className="bg-white rounded-xl shadow-lg border hover:shadow-xl transition-all duration-200 relative overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900">
                    {order.customerName}
                  </h3>
                  {order.phone && (
                    <p className="text-sm text-gray-600 mt-1">{order.phone}</p>
                  )}
                  {order.jobDate && (
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(order.jobDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-red-600">
                    ₹{order.creditAmount}
                  </div>
                  <div className="text-sm text-gray-500">Pending Amount</div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

