
import { AppLayout } from "@/components/AppLayout";
import { CustomerList } from "@/components/CustomerList";
import { BackButton } from "@/components/BackButton";

export default function Customers() {
  return (
    <AppLayout title="Customers">
      <div className="p-4 pb-28 sm:pb-24">
        <BackButton />
        <CustomerList />
      </div>
    </AppLayout>
  );
}
