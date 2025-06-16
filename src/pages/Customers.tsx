import { AppLayout } from "@/components/AppLayout";
import { CustomerList } from "@/components/CustomerList";

export default function Customers() {
  return (
    <AppLayout title="Customers">
      <div className="p-4 pb-28 sm:pb-24">
        <CustomerList />
      </div>
    </AppLayout>
  );
}
