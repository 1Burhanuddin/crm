
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, CheckCircle } from "lucide-react";

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
          className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-500"
          aria-label="Show actions"
          type="button"
        >
          <MoreVertical size={20} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50 w-40">
        <DropdownMenuItem onClick={onEdit} className="flex items-center gap-2">
          <Edit size={16} className="text-blue-700" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onDelete}
          className="flex items-center gap-2 text-red-700 focus:text-red-700"
        >
          <Trash2 size={16} />
          Delete
        </DropdownMenuItem>
        {canMarkDelivered && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onMarkDelivered}
              className="flex items-center gap-2 text-green-700 focus:text-green-700"
            >
              <CheckCircle size={16} />
              Mark as Delivered
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
