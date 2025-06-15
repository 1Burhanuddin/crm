
import { AppLayout } from "@/components/AppLayout";
import { SupplierList } from "@/components/SupplierList";
import { BackButton } from "@/components/BackButton";

export default function Suppliers() {
  return (
    <AppLayout title="Suppliers">
      <div className="p-4 pb-24">
        <BackButton />
        <SupplierList />
      </div>
    </AppLayout>
  );
}
