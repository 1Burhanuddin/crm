
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export function BackButton({ className = "" }: { className?: string }) {
  const navigate = useNavigate();
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`flex items-center gap-1 px-2 py-1 mb-2 text-blue-900 hover:bg-blue-50 ${className}`}
      onClick={() => navigate(-1)}
    >
      <ChevronLeft size={20} /> Back
    </Button>
  );
}
