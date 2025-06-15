
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportPanel } from "./profile/ReportPanel";
import { useSession } from "@/hooks/useSession";
import Collections from "@/pages/Collections"; // Import collections page

interface ProfileTabsProps {
  initialTab?: string;
}

export function ProfileTabs({ initialTab = "reports" }: ProfileTabsProps) {
  const { user } = useSession();
  return (
    <Tabs defaultValue={initialTab} className="w-full mt-6">
      <TabsList className="grid grid-cols-2 w-full mb-2">
        <TabsTrigger value="reports">Reports</TabsTrigger>
        <TabsTrigger value="collections">Collections</TabsTrigger>
      </TabsList>

      <TabsContent value="reports" className="focus-visible:outline-none">
        <ReportPanel />
      </TabsContent>
      <TabsContent value="collections" className="focus-visible:outline-none">
        {/* Pass user prop if needed in future, for now rendered as is */}
        <Collections />
      </TabsContent>
    </Tabs>
  );
}
