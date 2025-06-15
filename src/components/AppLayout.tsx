import { ReactNode, useState } from "react";
import { BottomNav } from "./BottomNav";
import { OfflineBanner } from "./OfflineBanner";
import { toast } from "@/hooks/use-toast";
import { useSession } from "@/hooks/useSession";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  shopName?: string | null;
  loadingTitle?: boolean;
}

export function AppLayout({ children, title, shopName, loadingTitle }: AppLayoutProps) {
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const { status } = useSession();

  // Listen for offline changes
  window.addEventListener("online", () => setIsOffline(false));
  window.addEventListener("offline", () => setIsOffline(true));

  // Height of header, match to py-3 and text height (py-3 + line-height ~ 56px)
  const HEADER_HEIGHT = 56; // px

  return (
    <div className="flex flex-col min-h-screen bg-[hsl(var(--background))]">
      {/* Header fixed */}
      <header
        className="fixed top-0 left-0 right-0 bg-blue-900 text-white px-4 py-3 flex items-center shadow-md z-30"
        style={{ height: HEADER_HEIGHT }}
      >
        <span className="font-bold text-lg tracking-wide flex-1">
          {loadingTitle
            ? <span className="animate-pulse text-gray-200">Loading...</span>
            : shopName
              ? shopName
              : (title || "Glass Shop for KhataBook")
          }
        </span>
        {isOffline && (
          <span className="ml-2 px-2 py-1 rounded bg-yellow-500 text-xs font-medium animate-pulse shadow">Offline</span>
        )}
        {/* Sidebar toggle button for large screens only */}
        <div className="hidden md:flex items-center ml-2">
          <SidebarTrigger className="rounded-md border border-sidebar-border p-1.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition text-blue-900 bg-white">
            <Menu size={22} />
          </SidebarTrigger>
        </div>
      </header>
      {/* Add top padding to make room for header for ALL content, including sidebar */}
      <div>
        <OfflineBanner show={isOffline} />
        <SidebarProvider>
          <div className="flex w-full" style={{ paddingTop: HEADER_HEIGHT }}>
            {/* Only show AppSidebar on md+ (pc/large screens) */}
            <div className="hidden md:block">
              <AppSidebar />
            </div>
            {/* Main content adjusts based on sidebar */}
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </SidebarProvider>
        {/* Only show BottomNav on mobile */}
        <div className="md:hidden" style={{ paddingTop: HEADER_HEIGHT }}>
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
