
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { sha256 } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export function SetPinDialog({
  open,
  onClose,
  userId,
  email,
  onPinSet,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  email: string;
  onPinSet: () => void;
}) {
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) {
      toast({ title: "PIN must be exactly 4 digits", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const pinHash = await sha256(pin);

    // Upsert into profiles
    const { error } = await supabase
      .from("profiles")
      .upsert(
        { id: userId, pin_hash: pinHash, email },
        { onConflict: "id" }
      );
    if (error) {
      toast({ title: "Failed to set PIN", description: error.message, variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    toast({ title: "PIN set successfully" });
    setIsSubmitting(false);
    setPin("");
    onPinSet();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={open ? onClose : () => {}}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Setup App PIN</DialogTitle>
          <DialogDescription>
            Before using the app, please create a 4-digit PIN.<br />
            This is used to unlock the app on this device.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
          <Input
            autoFocus
            type="password"
            inputMode="numeric"
            maxLength={4}
            minLength={4}
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter 4-digit PIN"
            className="text-center text-xl tracking-widest"
            disabled={isSubmitting}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Set PIN"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
