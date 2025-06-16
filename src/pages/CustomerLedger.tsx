import { AppLayout } from "@/components/AppLayout";
import { CustomerLedger } from "@/components/CustomerLedger";

export default function CustomerLedgerPage() {
  return (
    <AppLayout title="Customer Ledger">
      <div className="p-4 pb-28 sm:pb-24">
        <CustomerLedger />
      </div>
    </AppLayout>
  );
}
