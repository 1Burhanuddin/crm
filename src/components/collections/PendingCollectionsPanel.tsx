
import React from "react";
import { Button } from "@/components/ui/button";
import { CalendarIcon, MessageSquare, MoreHorizontal } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface CustomerWithPending {
  id: string;
  name: string;
  pending: number;
  phone?: string;
}
type DeliveredOrder = { id: string; amount: number };

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
  addMoreHorizontalButton
}: {
  pendingCustomers: CustomerWithPending[];
  customers: { id: string; name: string; phone?: string }[];
  customerDates: Record<string, Date>;
  openDateMenu: (customerId: string) => void;
  dateMenuOpen: { [id: string]: boolean };
  handleDateChangeForCustomer: (customerId: string, date: Date) => void;
  displayDate: (date: Date) => string;
  customerDeliveredOrders: Record<string, DeliveredOrder[]>;
  setFormAndShowForm: (form: any) => void;
  isAdding: boolean;
  handleOpenReminderModal: (customer: CustomerWithPending) => void;
  addMoreHorizontalButton?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 text-blue-800 font-bold">Pending Collections</div>
      {pendingCustomers.length === 0 ? (
        <div className="text-gray-500 mb-4">No pending collections! All customers are up to date 🎉</div>
      ) : (
        <ul>
          {pendingCustomers.map((c) => (
            <li
              key={c.id}
              className="bg-white shadow rounded-lg mb-2 px-3 py-2 border"
              style={{ overflow: 'hidden' }}
            >
              <div className="flex flex-col sm:flex-row justify-between items-stretch w-full gap-2 sm:gap-0">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-blue-900 break-words">{c.name}</div>
                  <div className="text-red-700 text-sm font-medium break-words">
                    Pending: ₹{c.pending}
                  </div>
                  {c.phone ? (
                    <div className="mt-1 text-xs text-gray-500 break-all">Phone: {c.phone}</div>
                  ) : null}
                  {/* Collection date row */}
                  <div className="mt-1 flex items-center gap-2 text-xs text-blue-900 flex-wrap">
                    <CalendarIcon size={16} className="inline mr-1 min-w-[16px]" />
                    Collect on:&nbsp;
                    <span className="font-semibold">
                      {customerDates[c.id] ? displayDate(customerDates[c.id]) : displayDate(new Date())}
                    </span>
                    <Popover open={!!dateMenuOpen[c.id]} onOpenChange={(open) => openDateMenu(c.id)}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="ml-1 rounded-full p-1 border hover:bg-gray-200"
                          aria-label="Change date"
                          onClick={e => { e.stopPropagation(); openDateMenu(c.id); }}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-50" align="start" side="bottom">
                        <Calendar
                          mode="single"
                          selected={customerDates[c.id] || new Date()}
                          onSelect={(date) => {
                            if (date) handleDateChangeForCustomer(c.id, date);
                          }}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-end min-w-[120px] mt-2 sm:mt-0 w-full sm:w-auto">
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-blue-700 hover:bg-blue-800 focus:bg-blue-800 text-white font-medium px-4 py-2 rounded-lg transition w-full sm:w-auto"
                    onClick={() => setFormAndShowForm(c)}
                    disabled={isAdding}
                  >
                    Collect
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 focus:bg-amber-600 text-white font-medium flex items-center gap-1 px-3 py-2 rounded-lg transition text-xs w-full sm:w-auto"
                    onClick={() => handleOpenReminderModal(c)}
                  >
                    <MessageSquare size={16} /> Send Reminder
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

