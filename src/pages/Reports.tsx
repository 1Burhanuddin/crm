import { AppLayout } from "@/components/AppLayout";
import { ReportPanel } from "@/components/profile/ReportPanel";

export default function Reports() {
  return (
    <AppLayout title="Reports">
      <div className="p-4 pb-24">
        <ReportPanel />
      </div>
    </AppLayout>
  );
}