
import { AppLayout } from "@/components/AppLayout";
import { CustomerList } from "@/components/CustomerList";

export default function Customers() {
  return (
    <AppLayout title="Customers">
      <CustomerList />
    </AppLayout>
  );
}
