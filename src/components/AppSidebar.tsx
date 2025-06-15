
import { Home, ClipboardList, FileText, UserCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

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
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="pt-6 pb-1 pl-2 text-xs text-sidebar-foreground/60 font-semibold uppercase tracking-wide">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="font-medium flex items-center gap-3 px-3 py-2"
                      onClick={() => navigate(item.path)}
                    >
                      <span className="flex items-center">
                        <item.icon className="mr-2 text-blue-900" size={20} />
                        <span>{item.title}</span>
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

