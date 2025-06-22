import { ClipboardList, Home, FileText, UserCircle, Quote } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

// Swapped "Products" for "Bills"
const navItems = [
  { title: "Home", icon: Home, path: "/" },
  { title: "Orders", icon: ClipboardList, path: "/orders" },
  { title: "Quotations", icon: Quote, path: "/quotations" },
  { title: "Bills", icon: FileText, path: "/bills" },
  { title: "Profile", icon: UserCircle, path: "/profile" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="w-full fixed bottom-0 left-0 right-0 z-20 flex justify-around md:hidden backdrop-blur bg-white/40">
      {navItems.map((item) => {
        const active = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center flex-1 py-2 text-sm ${active ? "text-blue-700 font-semibold" : "text-gray-500"}`}
          >
            <item.icon size={24} className={`${active ? "" : "opacity-70"}`} />
            {item.title}
          </button>
        );
      })}
    </nav>
  );
}
