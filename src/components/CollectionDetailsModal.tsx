import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, PhoneCall, MessageSquare, DollarSign, X as CloseIcon } from "lucide-react";
import { format } from "date-fns";

interface CustomerWithPending {
  id: string;
  name: string;
  pending: number;
  phone?: string;
}

interface CollectionDetailsModalProps {
  customer: CustomerWithPending | null;
  onClose: () => void;
  onCollect: (customer: CustomerWithPending) => void;
  onRemind: (customer: CustomerWithPending) => void;
  onCall: (phone: string) => void;
  isMobile: boolean;
}

export function CollectionDetailsModal({
  customer,
  onClose,
  onCollect,
  onRemind,
  onCall,
  isMobile
}: CollectionDetailsModalProps) {
  if (!customer) return null;

  const handleCall = () => {
    if (customer.phone) {
      onCall(customer.phone);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className={`w-full ${isMobile ? 'max-w-sm mx-auto min-h-[40vh] rounded-2xl p-5 shadow-2xl' : 'max-w-lg'}`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <CloseIcon className="h-6 w-6 text-gray-400" />
        </button>
        
        <div className="mb-4 break-words">
          <h2 className="text-xl font-bold mb-1 break-words">{customer.name}</h2>
          {customer.phone && (
            <div className="text-sm text-gray-600 mb-2 break-words flex items-center gap-1">
              <PhoneCall className="h-4 w-4" />
              <span>{customer.phone}</span>
            </div>
          )}
          <div className="text-xs text-gray-500 mb-2 break-words">Customer ID: {customer.id}</div>
        </div>

        <div className="mb-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Pending Amount</span>
              <span className="text-2xl font-bold text-red-600">₹{customer.pending.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Collection Status: Pending</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Button
            onClick={() => onCollect(customer)}
            className="w-full bg-blue-600 text-white hover:bg-blue-700 font-semibold rounded-full py-3 text-base"
            size="lg"
          >
            <DollarSign className="h-5 w-5 mr-2" />
            Collect ₹{customer.pending.toLocaleString()}
          </Button>
          
          <div className="flex gap-3">
            <Button
              onClick={() => onRemind(customer)}
              variant="outline"
              className="flex-1 font-semibold py-3 text-base border-blue-200 hover:bg-blue-50 rounded-full"
              size="lg"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Remind
            </Button>
            
            {customer.phone && (
              <Button
                onClick={handleCall}
                variant="outline"
                className="flex-1 font-semibold py-3 text-base border-green-200 hover:bg-green-50 rounded-full"
                size="lg"
              >
                <PhoneCall className="h-5 w-5 mr-2" />
                Call
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 