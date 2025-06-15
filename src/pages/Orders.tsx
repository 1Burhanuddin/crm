
import { AppLayout } from "@/components/AppLayout";
import { OrderList } from "@/components/OrderList";
import { BackButton } from "@/components/BackButton";

export default function Orders() {
  return (
    <AppLayout title="Orders">
      <div className="p-4 pb-24">
        <BackButton toMainScreen />
        {/* Center loading indicator in OrderList */}
        <OrderList />
      </div>
    </AppLayout>
  );
}
