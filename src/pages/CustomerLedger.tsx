
import { AppLayout } from "@/components/AppLayout";
import { CustomerLedger } from "@/components/CustomerLedger";

export default function CustomerLedgerPage() {
  return (
    <AppLayout title="Customer Ledger">
      <CustomerLedger />
    </AppLayout>
  );
}

