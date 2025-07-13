import { ReactNode, useState, useEffect } from "react";
import { BottomNav } from "./ui/BottomNav";
import { OfflineBanner } from "./OfflineBanner";
import { toast } from "@/hooks/use-toast";
import { useSession } from "@/hooks/useSession";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, ClipboardList, FileText, UserCircle, Shield, Package, Users, Receipt, BarChart3 } from "lucide-react";
import { BackButton } from "./ui/BackButton";
import { Sidebar, SidebarBody, SidebarLink } from "./ui/sidebar-animated";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  shopName?: string | null;
  loadingTitle?: boolean;
}

const sidebarLinks = [
  {
    label: "Dashboard",
    href: "/",
    icon: <Home className="h-5 w-5" />,
  },
  {
    label: "Orders",
    href: "/orders",
    icon: <ClipboardList className="h-5 w-5" />,
  },
  {
    label: "Quotations",
    href: "/quotations",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    label: "Bills",
    href: "/bills",
    icon: <Receipt className="h-5 w-5" />,
  },
  {
    label: "Customers",
    href: "/customers",
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: "Products",
    href: "/products",
    icon: <Package className="h-5 w-5" />,
  },
  {
    label: "Collections",
    href: "/collections",
    icon: <Receipt className="h-5 w-5" />,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: <UserCircle className="h-5 w-5" />,
  },
];

export function AppLayout({ children, title, shopName, loadingTitle }: AppLayoutProps) {
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const { status } = useSession();
  const location = useLocation();
  const navigate = useNavigate();

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

  return (
    <div className="flex min-h-screen w-full bg-[hsl(var(--background))]">
      <Sidebar>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mt-8 flex flex-col gap-2">
              {sidebarLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: shopName || title || "Shop for KhataBook",
                href: "#",
                icon: <UserCircle className="h-7 w-7" />,
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      
      <div className="flex-1">
        <OfflineBanner show={isOffline} />
        <main className="flex-1 overflow-y-auto p-2 md:p-8">
          {children}
        </main>
        
        {/* Only show BottomNav on mobile */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>

      {isOffline && (
        <div className="fixed top-4 right-4 z-50">
          <span className="px-2 py-1 rounded bg-yellow-500 text-xs font-medium animate-pulse shadow">Offline</span>
        </div>
      )}
    </div>
  );
}
