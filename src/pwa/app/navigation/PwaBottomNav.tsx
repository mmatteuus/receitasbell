import { NavLink } from "react-router-dom";
import { Heart, Home, ListChecks, ShoppingBag } from "lucide-react";
import { buildPwaPath } from "@/pwa/app/navigation/pwa-paths";

type PwaBottomNavProps = {
  tenantSlug?: string | null;
};

export function PwaBottomNav({ tenantSlug }: PwaBottomNavProps) {
  const navItems = [
    { to: buildPwaPath("home", { tenantSlug }), icon: Home, label: "Home", end: true },
    { to: buildPwaPath("favorites", { tenantSlug }), icon: Heart, label: "Favoritos" },
    { to: buildPwaPath("shopping", { tenantSlug }), icon: ListChecks, label: "Lista" },
    { to: buildPwaPath("purchases", { tenantSlug }), icon: ShoppingBag, label: "Compras" },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-md"
      style={{ height: "var(--pwa-bottomnav-height)" }}
      aria-label="Navegação principal do app"
    >
      <div
        className="mx-auto flex h-full max-w-md items-center justify-around px-4"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex min-w-[64px] flex-col items-center justify-center gap-1 transition-colors ${
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
