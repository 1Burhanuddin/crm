
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerList } from "@/components/CustomerList";
import { SupplierList } from "@/components/SupplierList";
import { BillList } from "./profile/BillList";
import { ReportPanel } from "./profile/ReportPanel";

interface ProfileTabsProps {
  initialTab?: string;
}

export function ProfileTabs({ initialTab = "customers" }: ProfileTabsProps) {
  return (
    <Tabs defaultValue={initialTab} className="w-full mt-6">
      <TabsList className="grid grid-cols-4 w-full mb-2">
        <TabsTrigger value="customers">Customers</TabsTrigger>
        <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        <TabsTrigger value="bills">Bills</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>

      <TabsContent value="customers" className="focus-visible:outline-none">
        <CustomerList />
      </TabsContent>
      <TabsContent value="suppliers" className="focus-visible:outline-none">
        <SupplierList />
      </TabsContent>
      <TabsContent value="bills" className="focus-visible:outline-none">
        <BillList />
      </TabsContent>
      <TabsContent value="reports" className="focus-visible:outline-none">
        <ReportPanel />
      </TabsContent>
    </Tabs>
  );
}
