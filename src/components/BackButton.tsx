import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export function BackButton({ className = "" }: { className?: string }) {
  const navigate = useNavigate();
  return (
    <Button
      variant="ghost"
      size="icon"
      className={`flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 ${className}`}
      onClick={() => navigate("/")}
    >
      <ChevronLeft size={20} className="stroke-[2.5]" />
    </Button>
  );
}
