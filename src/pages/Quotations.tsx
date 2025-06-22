import { AppLayout } from "@/components/AppLayout";
import { QuotationList } from "@/components/QuotationList";

export default function Quotations() {
  return (
    <AppLayout title="Quotations">
      <div className="p-4 pb-24">
        <QuotationList />
      </div>
    </AppLayout>
  );
} 