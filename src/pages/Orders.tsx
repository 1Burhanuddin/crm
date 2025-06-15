
import { AppLayout } from "@/components/AppLayout";
import { OrderList } from "@/components/OrderList";

export default function Orders() {
  return (
    <AppLayout title="Orders">
      <OrderList />
    </AppLayout>
  );
}
