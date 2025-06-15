
import { AppLayout } from "@/components/AppLayout";
import { CustomerLedger } from "@/components/CustomerLedger";
import { BackButton } from "@/components/BackButton";

export default function CustomerLedgerPage() {
  return (
    <AppLayout title="Customer Ledger">
      <div className="p-4 pb-28 sm:pb-24">
        <BackButton />
        <CustomerLedger />
      </div>
    </AppLayout>
  );
}
