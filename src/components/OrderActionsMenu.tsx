import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2 } from "lucide-react";

type OrderActionsMenuProps = {
  onEdit: () => void;
  onDelete: () => void;
  canMarkDelivered: boolean;
  onMarkDelivered?: () => void;
};

export function OrderActionsMenu({
  onEdit,
  onDelete,
  canMarkDelivered,
  onMarkDelivered,
}: OrderActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-2 rounded-full transition-colors text-blue-700 shadow"
          aria-label="Show actions"
          type="button"
        >
          <MoreVertical size={22} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50 w-52 rounded-xl shadow-2xl border border-blue-100 p-2 bg-white">
        <DropdownMenuLabel className="text-blue-900 text-sm font-bold mb-1">Order Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onEdit}
          className="flex items-center gap-3 py-3 px-3 rounded-lg text-base hover:bg-blue-50 group"
        >
          <Edit size={18} className="text-blue-700 group-hover:scale-110 transition-transform" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onDelete}
          className="flex items-center gap-3 py-3 px-3 rounded-lg text-base text-red-700 hover:bg-red-50 group"
        >
          <Trash2 size={18} className="text-red-700 group-hover:scale-110 transition-transform" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
