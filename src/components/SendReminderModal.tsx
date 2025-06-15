
import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Copy, Send } from "lucide-react";
import { Whatsapp } from "lucide-react"; // Import WhatsApp icon

interface SendReminderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: { name: string; phone?: string; pending: number; } | null;
}

const getDefaultMessage = (
  name: string,
  pending: number
) =>
  `Dear ${name}, your payment of ₹${pending} is pending. Kindly pay at the earliest. Thank you!`;

export function SendReminderModal({
  open,
  onOpenChange,
  customer,
}: SendReminderModalProps) {
  const [customMsg, setCustomMsg] = useState<string>("");

  // Reset message when opening for new customer
  React.useEffect(() => {
    if (open && customer) {
      setCustomMsg(getDefaultMessage(customer.name, customer.pending));
    }
    // eslint-disable-next-line
  }, [open, customer?.name, customer?.pending]);

  // Compose WhatsApp deep link for message
  const whatsappLink = useMemo(() => {
    if (!customer?.phone) return null;
    // Format: https://wa.me/<number>?text=<encoded message>
    // Remove non-digit chars for number
    const phone = customer.phone.replace(/\D/g, "");
    const text = encodeURIComponent(customMsg);
    return `https://wa.me/${phone}?text=${text}`;
  }, [customer?.phone, customMsg]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(customMsg);
      toast({ title: "Message copied to clipboard!" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Payment Reminder</DialogTitle>
        </DialogHeader>
        {customer && (
          <div>
            <div className="mb-2">
              <div>
                <span className="font-semibold text-blue-900">{customer.name}</span>
                {customer.phone && (
                  <span className="ml-2 text-gray-500 text-xs">({customer.phone})</span>
                )}
              </div>
              <div className="text-red-700 text-sm mb-1">Pending: ₹{customer.pending}</div>
            </div>
            <label className="block mb-2 text-sm font-medium">Message Preview (editable)</label>
            <textarea
              className="w-full border px-2 py-1 rounded mb-3 min-h-[80px] text-gray-800"
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              spellCheck={false}
            />
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                type="button"
                onClick={handleCopy}
                title="Copy to clipboard"
              >
                <Copy size={16} className="mr-1" /> Copy
              </Button>
              <Button
                type="button"
                asChild
                disabled={!customer.phone}
                title={customer.phone ? "Send via WhatsApp" : "No phone number"}
                className="bg-[#25D366] hover:bg-[#218e4d] text-white flex items-center" // WhatsApp official green
              >
                <a
                  href={whatsappLink || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    toast({ title: "WhatsApp opened." });
                  }}
                >
                  <Whatsapp size={16} className="mr-2" />
                  WhatsApp
                </a>
              </Button>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
