import { AppLayout } from "@/components/AppLayout";
import { OrderList } from "@/components/OrderList";

export default function Orders() {
  return (
    <AppLayout title="Orders">
      <div className="p-4 pb-24">
        {/* Center loading indicator in OrderList */}
        <OrderList />
      </div>
    </AppLayout>
  );
}
