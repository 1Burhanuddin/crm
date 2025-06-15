
import { Users, Layers, ClipboardList, Home, UserCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { title: "Home", icon: Home, path: "/" },
  { title: "Customers", icon: Users, path: "/customers" },
  { title: "Suppliers", icon: Layers, path: "/suppliers" }, // <-- Added Suppliers
  { title: "Orders", icon: ClipboardList, path: "/orders" },
  { title: "Products", icon: Layers, path: "/products" },
  { title: "Profile", icon: UserCircle, path: "/profile" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="w-full fixed bottom-0 left-0 right-0 bg-white border-t z-20 flex justify-around shadow-inner md:hidden">
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
