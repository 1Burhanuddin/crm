import { AppLayout } from "@/components/AppLayout";
import { InventoryManager } from "@/components/InventoryManager";
import { OfflineManager } from "@/components/OfflineManager";

export default function Inventory() {
  return (
    <AppLayout title="Inventory">
      <div className="p-4 pb-24">
        <InventoryManager />
      </div>
      <OfflineManager />
    </AppLayout>
  );
}