import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Utensils, CreditCard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: "Receitas",
    href: "/admin/receitas",
    icon: Utensils,
  },
  {
    title: "Pagamentos",
    href: "/admin/pagamentos",
    icon: CreditCard,
  },
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-card border-r min-h-screen flex flex-col hidden md:flex">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <span className="bg-primary text-primary-foreground rounded-md p-1 text-xs">RB</span>
          Admin
        </h2>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {sidebarItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.href
            : location.pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sair do Admin
        </Link>
      </div>
    </aside>
  );
}