import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Utensils, CreditCard, LogOut,
  ChevronLeft, ChevronRight, Moon, Sun, Menu, X, Settings, Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAdmin } from "@/lib/api/adminSession";
import { trackEvent } from "@/lib/telemetry";

/* ── Context ── */
interface SidebarCtx {
  collapsed: boolean;
  toggle: () => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  dark: boolean;
  toggleDark: () => void;
}
const SidebarContext = createContext<SidebarCtx>({
  collapsed: false, toggle: () => {},
  mobileOpen: false, setMobileOpen: () => {},
  dark: false, toggleDark: () => {},
});
export const useAdminSidebar = () => useContext(SidebarContext);

export function AdminSidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    return localStorage.getItem("rdb_admin_dark") === "true";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("rdb_admin_dark", String(dark));
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, [dark]);

  return (
    <SidebarContext.Provider value={{
      collapsed, toggle: () => setCollapsed(c => !c),
      mobileOpen, setMobileOpen,
      dark, toggleDark: () => setDark(d => !d),
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

/* ── Sidebar items ── */
const sidebarItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Receitas", href: "/admin/receitas", icon: Utensils },
  { title: "Pagamentos", href: "/admin/pagamentos", icon: CreditCard },
  { title: "Configurações", href: "/admin/configuracoes", icon: Settings },
  { title: "Página Inicial", href: "/admin/configuracoes/pagina-inicial", icon: Home },
];

/* ── Sidebar nav content (shared between desktop and mobile) ── */
function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logoutAdmin();
      trackEvent("admin.logout");
    } catch {
      // Ignora erro de logout para não bloquear saída.
    }
    onNavigate?.();
    navigate("/admin/login", { replace: true });
  }

  return (
    <>
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
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md transition-colors text-sm font-medium",
                collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
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

      <div className="border-t p-2 space-y-1">
        <DarkModeButton collapsed={collapsed} />
        <button
          title="Sair do Admin"
          onClick={() => {
            void handleLogout();
          }}
          className={cn(
            "flex w-full items-center gap-3 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && "Sair do Admin"}
        </button>
      </div>
    </>
  );
}

/* ── Dark mode button ── */
function DarkModeButton({ collapsed }: { collapsed: boolean }) {
  const { dark, toggleDark } = useAdminSidebar();
  return (
    <button
      onClick={toggleDark}
      title={dark ? "Modo claro" : "Modo escuro"}
      className={cn(
        "flex items-center gap-3 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full",
        collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
      )}
    >
      {dark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
      {!collapsed && (dark ? "Modo Claro" : "Modo Escuro")}
    </button>
  );
}

/* ── Desktop sidebar ── */
export function AdminSidebar() {
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
        {!collapsed && <h2 className="text-xl font-bold text-primary whitespace-nowrap">Admin</h2>}
        <button
          onClick={toggle}
          className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <SidebarNav collapsed={collapsed} />
    </aside>
  );
}

/* ── Mobile sidebar (drawer overlay) ── */
export function AdminMobileSidebar() {
  const { mobileOpen, setMobileOpen } = useAdminSidebar();

  return (
    <>
      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-card border-r transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2 border-b p-4">
          <span className="bg-primary text-primary-foreground rounded-md p-1 text-xs font-bold">RB</span>
          <h2 className="text-xl font-bold text-primary">Admin</h2>
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}

/* ── Mobile menu trigger ── */
export function AdminMobileMenuButton() {
  const { setMobileOpen } = useAdminSidebar();
  return (
    <button
      onClick={() => setMobileOpen(true)}
      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
