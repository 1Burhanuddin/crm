
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportPanel } from "./profile/ReportPanel";
import { ProductCatalog } from "@/components/ProductCatalog";
import { useSession } from "@/hooks/useSession";

interface ProfileTabsProps {
  initialTab?: string;
}

export function ProfileTabs({ initialTab = "reports" }: ProfileTabsProps) {
  const { user } = useSession();
  return (
    <Tabs defaultValue={initialTab} className="w-full mt-6">
      <TabsList className="grid grid-cols-2 w-full mb-2">
        <TabsTrigger value="reports">Reports</TabsTrigger>
        <TabsTrigger value="products">Products</TabsTrigger>
      </TabsList>

      <TabsContent value="reports" className="focus-visible:outline-none">
        <ReportPanel />
      </TabsContent>
      <TabsContent value="products" className="focus-visible:outline-none">
        <ProductCatalog onEdit={() => {}} userId={user?.id ?? null} />
      </TabsContent>
    </Tabs>
  );
}
