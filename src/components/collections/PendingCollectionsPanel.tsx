import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarIcon, MessageSquare, MoreHorizontal, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface CustomerWithPending {
  id: string;
  name: string;
  pending: number;
  phone?: string;
}

interface DeliveredOrder {
  id: string;
  amount: number;
}

interface PendingCollectionsPanelProps {
  pendingCustomers: CustomerWithPending[];
  customers: { id: string; name: string }[];
  customerDates: Record<string, Date>;
  openDateMenu: (id: string) => void;
  dateMenuOpen: Record<string, boolean>;
  handleDateChangeForCustomer: (customerId: string, date: Date) => void;
  displayDate: (date: Date) => string;
  customerDeliveredOrders: Record<string, DeliveredOrder[]>;
  setFormAndShowForm: (customer: CustomerWithPending) => void;
  isAdding: boolean;
  handleOpenReminderModal: (customer: CustomerWithPending) => void;
}

export function PendingCollectionsPanel({
  pendingCustomers,
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

  if (!pendingCustomers || pendingCustomers.length === 0) {
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
        {pendingCustomers.map((customer) => (
          <li
            key={customer.id}
            className="bg-white rounded-xl shadow-lg border hover:shadow-xl transition-all duration-200 relative overflow-hidden"
          >
            {/* Collapsed View */}
            <div 
              className="p-4 cursor-pointer"
              onClick={() => toggleCard(customer.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900">
                    {customer.name}
                  </h3>
                  {customer.phone && (
                    <p className="text-sm text-gray-600 mt-1">{customer.phone}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">
                      ₹{customer.pending}
                    </div>
                    <div className="text-sm text-gray-500">Pending Amount</div>
                  </div>
                  <div className="text-gray-400">
                    {expandedCards[customer.id] ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded View */}
            {expandedCards[customer.id] && (
              <div className="px-4 pb-4 border-t border-gray-100">
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <button
                    onClick={() => setFormAndShowForm(customer)}
                    disabled={isAdding}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      "Collect Payment"
                    )}
                  </button>
                  <button
                    onClick={() => handleOpenReminderModal(customer)}
                    className="flex-1 border border-gray-200 hover:border-gray-300 text-gray-700 font-medium px-4 py-2.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow"
                  >
                    Send Reminder
                  </button>
                </div>

                {/* Order Details Section */}
                {customerDeliveredOrders[customer.id] && customerDeliveredOrders[customer.id].length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Pending Orders:</h4>
                    <ul className="space-y-2">
                      {customerDeliveredOrders[customer.id].map((order) => (
                        <li
                          key={order.id}
                          className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg"
                        >
                          Order #{order.id.slice(0, 8)} - ₹{order.amount}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Collection Date Section */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-700">Collection Date:</div>
                    <Popover open={dateMenuOpen[customer.id]} onOpenChange={() => openDateMenu(customer.id)}>
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            "flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900",
                            "px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                          )}
                        >
                          <CalendarIcon className="h-4 w-4" />
                          {customerDates[customer.id]
                            ? displayDate(customerDates[customer.id])
                            : "Set date"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={customerDates[customer.id]}
                          onSelect={(date) => date && handleDateChangeForCustomer(customer.id, date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

