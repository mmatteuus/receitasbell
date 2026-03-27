import { NavLink } from "react-router-dom";
import { Home, Heart, ListChecks, ShoppingBag, User } from "lucide-react";

export function PwaBottomNav() {
  const navItems = [
    { to: "/pwa/app", icon: Home, label: "Home" },
    { to: "/pwa/app/favoritos", icon: Heart, label: "Favoritos" },
    { to: "/pwa/app/lista-de-compras", icon: ListChecks, label: "Lista" },
    { to: "/pwa/app/compras", icon: ShoppingBag, label: "Compras" },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-background/80 backdrop-blur-md border-t border-border px-4 h-16 safe-area-bottom z-40">
      <div className="flex items-center justify-around h-full max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/pwa/app"}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 min-w-[64px] transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
