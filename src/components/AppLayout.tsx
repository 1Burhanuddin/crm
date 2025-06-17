import { ReactNode, useState, useEffect } from "react";
import { BottomNav } from "./BottomNav";
import { OfflineBanner } from "./OfflineBanner";
import { toast } from "@/hooks/use-toast";
import { useSession } from "@/hooks/useSession";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, ClipboardList, FileText, UserCircle, Shield } from "lucide-react";
import { BackButton } from "./BackButton";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  shopName?: string | null;
  loadingTitle?: boolean;
}

const navItems = [
  {
    title: "Home",
    icon: Home,
    path: "/",
  },
  {
    title: "Orders",
    icon: ClipboardList,
    path: "/orders",
  },
  {
    title: "Bills",
    icon: FileText,
    path: "/bills",
  },
  {
    title: "Profile",
    icon: UserCircle,
    path: "/profile",
  },
  {
    title: "Admin",
    icon: Shield,
    path: "/admin",
  },
];

export function AppLayout({ children, title, shopName, loadingTitle }: AppLayoutProps) {
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const { status } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const showBackButton = location.pathname !== "/";

  // Listen for offline changes (to avoid adding listeners each render, useEffect is better)
  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Height of header, match to py-3 and text height (py-3 + line-height ~ 56px)
  const HEADER_HEIGHT = 56; // px

  return (
    <div className="flex flex-col min-h-screen bg-[hsl(var(--background))] w-full">
      {/* Header fixed */}
      <header
        className="fixed top-0 left-0 right-0 bg-blue-900 text-white px-4 py-3 flex items-center shadow-md z-30"
        style={{ height: HEADER_HEIGHT }}
      >
        <div className="flex items-center gap-2 flex-1">
          {showBackButton && (
            <div className="md:hidden">
              <BackButton />
            </div>
          )}
          <span className="font-bold text-lg tracking-wide">
            {loadingTitle
              ? <span className="animate-pulse text-gray-200">Loading...</span>
              : shopName
                ? shopName
                : (title || "Glass Shop for KhataBook")
            }
          </span>
        </div>

        {/* Navigation items for large screens */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                  isActive 
                    ? "bg-white/20 text-white" 
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon size={18} className="stroke-[2.5]" />
                <span className="font-medium">{item.title}</span>
              </button>
            );
          })}
        </div>

        {isOffline && (
          <span className="ml-2 px-2 py-1 rounded bg-yellow-500 text-xs font-medium animate-pulse shadow">Offline</span>
        )}
      </header>

      {/* Add top padding to make room for header for ALL content */}
      <div>
        <OfflineBanner show={isOffline} />
        <div className="flex w-full" style={{ paddingTop: HEADER_HEIGHT }}>
          {/* Main content */}
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
        {/* Only show BottomNav on mobile */}
        <div className="md:hidden" style={{ paddingTop: HEADER_HEIGHT }}>
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
