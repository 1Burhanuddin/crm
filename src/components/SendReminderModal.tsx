
import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Copy, Send } from "lucide-react";
// Removed: import { Whatsapp } from "lucide-react";

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

  // Inline WhatsApp SVG icon component
  const WhatsappIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      {...props}
      width={16}
      height={16}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <g>
        <circle cx="16" cy="16" r="16" fill="#25D366"/>
        <path
          d="M16.001 6.443c-5.295 0-9.603 4.308-9.603 9.603 0 2.128.677 4.099 1.839 5.726l-1.209 4.273 4.384-1.15a9.561 9.561 0 004.589 1.17h.001c5.295 0 9.603-4.308 9.603-9.603 0-5.294-4.308-9.602-9.603-9.602zm5.969 13.572c-.256.713-1.506 1.398-2.071 1.489-.541.089-1.215.126-1.953-.124-.449-.15-1.029-.332-1.776-.731-3.149-1.733-5.194-5.143-5.355-5.384-.158-.236-1.281-1.705-1.281-3.249 0-1.544.814-2.305 1.102-2.617.285-.311.619-.389.825-.389.205 0 .41.002.591.011.19.009.446-.072.701.534.259.618.873 2.036.95 2.186.076.148.127.323.025.52-.116.22-.175.353-.342.569-.164.217-.347.484-.494.649-.146.166-.297.348-.128.68.17.332.755 1.246 1.617 2.02 1.045.934 1.937 1.221 2.321 1.36.383.138.607.116.831-.07.216-.18.345-.456.438-.613.094-.156.192-.131.326-.081.134.05.847.399 1.108.529.26.129.434.197.497.307.062.11.062.633-.194 1.346z"
          fill="#fff"
        />
      </g>
    </svg>
  );

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
                className="bg-[#25D366] hover:bg-[#218e4d] text-white flex items-center"
              >
                <a
                  href={whatsappLink || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    toast({ title: "WhatsApp opened." });
                  }}
                >
                  <WhatsappIcon className="mr-2" />
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
