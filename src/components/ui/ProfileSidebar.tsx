import { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { 
  User, 
  BarChart3, 
  Users, 
  Package, 
  FileText, 
  ClipboardList, 
  Receipt,
  Settings,
  Menu
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const sidebarItems = [
  {
    title: "Dashboard",
    icon: BarChart3,
    path: "/",
    description: "Overview and statistics"
  },
  {
    title: "Orders",
    icon: ClipboardList,
    path: "/orders",
    description: "Manage customer orders"
  },
  {
    title: "Quotations", 
    icon: FileText,
    path: "/quotations",
    description: "Create and manage quotations"
  },
  {
    title: "Bills",
    icon: Receipt,
    path: "/bills",
    description: "View and create bills"
  },
  {
    title: "Customers",
    icon: Users,
    path: "/customers",
    description: "Manage customer database"
  },
  {
    title: "Products",
    icon: Package,
    path: "/products",
    description: "Manage product catalog"
  },
  {
    title: "Collections",
    icon: Receipt,
    path: "/collections", 
    description: "Manage collections"
  },
  {
    title: "Profile",
    icon: User,
    path: "/profile",
    description: "Manage your profile"
  },
  {
    title: "Reports",
    icon: BarChart3,
    path: "/reports",
    description: "View business reports"
  }
];

export function ProfileSidebar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-white/80 hover:bg-white/10 hover:text-white"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 bg-white">
        <SheetHeader>
          <SheetTitle className="text-left text-xl font-bold text-gray-900">
            Navigation
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-2">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200",
                  isActive 
                    ? "bg-blue-50 text-blue-700 border border-blue-200" 
                    : "hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                )}
              >
                <item.icon 
                  className={cn(
                    "h-5 w-5",
                    isActive ? "text-blue-600" : "text-gray-500"
                  )} 
                />
                <div className="flex-1">
                  <div className={cn(
                    "font-medium",
                    isActive ? "text-blue-700" : "text-gray-900"
                  )}>
                    {item.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}