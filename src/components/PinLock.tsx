
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export function PinLock({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin === "2416") { // simple demo PIN
      onUnlock();
      setPin("");
      setError(null);
    } else {
      setError("Incorrect PIN. Try again.");
      toast({
        title: "Wrong PIN",
        description: "Please enter the correct PIN.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-blue-950">
      <div className="w-full max-w-[350px] bg-white shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-900">Enter Admin PIN</h2>
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            className="w-28 text-center text-2xl border border-blue-200 rounded-lg p-2 mb-4 tracking-widest focus:outline-blue-800"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="****"
            autoFocus
          />
          {error && <span className="text-red-600 text-sm mb-2">{error}</span>}
          <button
            type="submit"
            className="w-full bg-blue-900 text-white py-2 rounded-lg font-semibold hover:bg-blue-800 transition"
          >
            Unlock
          </button>
        </form>
        <div className="text-gray-400 text-xs text-center mt-6">Demo PIN: 2416</div>
      </div>
    </div>
  );
}
