
import { ReactNode, useState } from "react";
import { BottomNav } from "./BottomNav";
import { OfflineBanner } from "./OfflineBanner";
import { toast } from "@/hooks/use-toast";
import { useSession } from "@/hooks/useSession";

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

  return (
    <div className="flex flex-col min-h-screen bg-[hsl(var(--background))]">
      <header className="bg-blue-900 text-white px-4 py-3 flex items-center shadow-md z-30 relative">
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
        {/* Logout button removed from global header */}
      </header>
      <OfflineBanner show={isOffline} />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
