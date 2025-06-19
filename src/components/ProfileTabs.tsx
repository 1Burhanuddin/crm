import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportPanel } from "./profile/ReportPanel";

interface ProfileTabsProps {
  initialTab?: string;
}

export function ProfileTabs({ initialTab = "reports" }: ProfileTabsProps) {
  return (
    <Tabs defaultValue={initialTab} className="w-full mt-6">
      <TabsList className="w-full mb-2 ">
        <TabsTrigger className="flex-1 " value="reports">Reports</TabsTrigger>
      </TabsList>
      <TabsContent value="reports" className="focus-visible:outline-none">
        <ReportPanel />
      </TabsContent>
    </Tabs>
  );
}
