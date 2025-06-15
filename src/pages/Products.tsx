
import { AppLayout } from "@/components/AppLayout";
import { ProductCatalog } from "@/components/ProductCatalog";
import { BackButton } from "@/components/BackButton";

export default function Products() {
  return (
    <AppLayout title="Products">
      <div className="p-4 pb-24">
        <BackButton />
        <ProductCatalog />
      </div>
    </AppLayout>
  );
}
