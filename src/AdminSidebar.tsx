import { createContext, useContext, useState, ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Utensils, CreditCard, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SidebarContext = createContext({ collapsed: false, toggle: () => {} });
export const useAdminSidebar = () => useContext(SidebarContext);

export function AdminSidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarContext.Provider value={{ collapsed, toggle: () => setCollapsed((c) => !c) }}>
      {children}
    </SidebarContext.Provider>
  );
}

const sidebarItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Receitas", href: "/admin/receitas", icon: Utensils },
  { title: "Pagamentos", href: "/admin/pagamentos", icon: CreditCard },
];

export function AdminSidebar() {
  const location = useLocation();
  const { collapsed, toggle } = useAdminSidebar();

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen shrink-0 flex-col border-r bg-card transition-all duration-300 hidden md:flex",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center gap-2 border-b p-4">
        <span className="bg-primary text-primary-foreground rounded-md p-1 text-xs font-bold shrink-0">RB</span>
        {!collapsed && (
          <h2 className="text-xl font-bold text-primary whitespace-nowrap">Admin</h2>
        )}
        <button
          onClick={toggle}
          className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.href
            : location.pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              to={item.href}
              title={item.title}
              className={cn(
                "flex items-center gap-3 rounded-md transition-colors text-sm font-medium",
                collapsed ? "justify-center px-2 py-2" : "px-3 py-2",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.title}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-2">
        <Link
          to="/"
          title="Sair do Admin"
          className={cn(
            "flex items-center gap-3 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
            collapsed ? "justify-center px-2 py-2" : "px-3 py-2"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && "Sair do Admin"}
        </Link>
      </div>
    </aside>
  );
}
