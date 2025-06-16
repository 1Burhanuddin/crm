import { AppLayout } from "@/components/AppLayout";
import { SupplierList } from "@/components/SupplierList";

export default function Suppliers() {
  return (
    <AppLayout title="Suppliers">
      <div className="p-4 pb-24">
        <SupplierList />
      </div>
    </AppLayout>
  );
}
