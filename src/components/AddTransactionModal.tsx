
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

export type TransactionType = "udhaar" | "paid";

export function AddTransactionModal({
  open,
  onOpenChange,
  customerId,
  onAdded
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  onAdded: () => void;
}) {
  const [type, setType] = useState<TransactionType>("udhaar");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useSession();

  function resetForm() {
    setType("udhaar");
    setDate(new Date().toISOString().slice(0,10));
    setAmount("");
    setNote("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({ title: "Invalid Amount", description: "Amount must be a positive number." });
      return;
    }
    if (!user) {
      toast({ title: "Not signed in" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("transactions").insert({
      customer_id: customerId,
      date,
      amount: Number(amount),
      type,
      note,
      user_id: user.id,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message });
    } else {
      toast({ title: "Entry Added", description: "Transaction was added" });
      onOpenChange(false);
      onAdded();
      resetForm();
    }
  }

  return (
    <Dialog open={open} onOpenChange={o => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Entry</DialogTitle>
          <DialogDescription>Record a transaction for this customer.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="type">Type</Label>
            <div className="flex gap-2 mt-1">
              <Button
                type="button"
                variant={type==="udhaar" ? "default" : "outline"}
                onClick={() => setType("udhaar")}
              >Given (Udhaar)</Button>
              <Button
                type="button"
                variant={type==="paid" ? "default" : "outline"}
                onClick={() => setType("paid")}
              >Received (Paid)</Button>
            </div>
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
            />
          </div>
          <div>
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Optional note"
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Entry"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => { onOpenChange(false); resetForm(); }}
              disabled={loading}
            >
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
